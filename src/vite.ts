/** @prose
 * # The Vite plugin
 *
 * `pagez()` builds the page in Vite's root, `index.md`, through Vite: `vp build` writes `dist/`
 * with its CSS, images and fonts hashed and minified, `vp dev` serves it while it's written, and
 * `vp preview` serves what was built. `public/` is copied as it is, as Vite does
 * ([folders.md](../docs/folders.md#the-rules)).
 *
 * Vite builds from an `index.html`, and the page's is the one Pagez compiles. The plugin hands it
 * to Vite in memory, at the path it would have beside `index.md`, so Vite reads its references from
 * there and the source is never written to. An `index.html` already in the folder is what Pagez
 * writes, so it fails, as a frame from before the frame was `frame.html` would.
 *
 * The base is `./` unless the config sets one, so `dist/` works wherever it's served, at a site's
 * root or under a path such as `/stories/`. Built HTML needs a server, since Vite marks its
 * stylesheet `crossorigin`, which a page opened from disk can't load.
 */
import { existsSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite-plus";
import { FileError } from "./elements/errors.ts";
import { compile, write } from "./page.ts";

/** A folder as its real path, so the entry Pagez names and the one Vite resolves are the same. */
const real = (dir: string) => (existsSync(dir) ? realpathSync(dir) : dir);

/** Adds Pagez to a folder's Vite config, with no options. */
export default function pagez(): Plugin {
  let root = "";
  const entry = () => join(root, "index.html");
  const page = () => join(root, "index.md");

  /** The page's HTML, its mistakes as `file: message`, which Vite prints. */
  function html(): string {
    try {
      return write(compile(page()));
    } catch (error) {
      if (error instanceof FileError) {
        // The file and the message are the whole story, and a stack would bury them.
        error.message = `${error.file}: ${error.message}`;
        error.stack = "";
      }
      throw error;
    }
  }

  return {
    name: "pagez",
    enforce: "pre",
    config(user) {
      return {
        appType: "mpa",
        base: user.base ?? "./",
        build: { rollupOptions: { input: join(real(resolve(user.root ?? ".")), "index.html") } },
      };
    },
    configResolved(config) {
      root = real(config.root);
      if (existsSync(entry())) {
        throw new FileError(
          entry(),
          "index.html is what Pagez writes from index.md, so it can't be in the folder. A frame is frame.html.",
        );
      }
      if (!existsSync(page())) {
        throw new FileError(page(), "there's no index.md, which is the page Pagez builds.");
      }
    },
    resolveId(id) {
      return id === entry() ? id : undefined;
    },
    load(id) {
      if (id !== entry()) return undefined;
      for (const file of ["index.md", "style.css", "frame.html"])
        this.addWatchFile(join(root, file));
      return html();
    },
    configureServer(server) {
      for (const file of ["index.md", "style.css", "frame.html"]) {
        server.watcher.add(join(root, file));
      }
      server.watcher.on("change", (file) => {
        if (/(index\.md|style\.css|frame\.html)$/.test(file))
          server.ws.send({ type: "full-reload" });
      });
      server.middlewares.use(async (request, response, next) => {
        const url = request.url?.split("?")[0];
        if (url !== "/" && url !== "/index.html") return next();
        try {
          const out = await server.transformIndexHtml("/index.html", html());
          response.setHeader("Content-Type", "text/html");
          response.end(out);
        } catch (error) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "text/plain");
          response.end((error as Error).message);
        }
      });
    },
  };
}
