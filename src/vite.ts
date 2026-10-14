/** @prose
 * # The Vite plugin
 *
 * `pagez()` builds the page in Vite's root, `index.md`, through Vite: `vp build` writes `dist/`
 * with its CSS, images and fonts hashed and minified, `vp dev` serves it while it's written, and
 * `vp preview` serves what was built. `public/` is copied as it is, as Vite does
 * ([folders.md](../docs/folders.md#the-rules)). Its other plugin serves the elements' parts
 * (`parts.ts`), so Vite bundles each element's `setup` into the page's one module.
 *
 * The page's templates run at build time in a Vite server: `dev`'s own, so a change is seen on
 * the next request, or one `build` makes for the page.
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
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite-plus";
import { FileError } from "./elements/errors.ts";
import { attribute, decode, scan } from "./elements/markup.ts";
import { compile, write } from "./page.ts";
import { createLoader, parts, serverLoader, type Loader } from "./parts.ts";
import { linksFile } from "./references.ts";

/** A folder as its real path, so the entry Pagez names and the one Vite resolves are the same. */
const real = (dir: string) => (existsSync(dir) ? realpathSync(dir) : dir);

/** Adds Pagez to a folder's Vite config, with no options. */
export default function pagez(): Plugin[] {
  let root = "";
  let config: ResolvedConfig;
  let server: ViteDevServer | undefined;
  const entry = () => join(root, "index.html");
  const page = () => join(root, "index.md");

  /** The page's HTML, its warnings printed and its mistakes as `file: message`, which Vite prints. */
  async function html(loader: Loader): Promise<string> {
    try {
      const compiled = await compile(page(), { loader });
      for (const warning of compiled.warnings) config.logger.warn(`${page()}: ${warning}`);
      return write(compiled);
    } catch (error) {
      if (error instanceof FileError) {
        // The file and the message are the whole story, and a stack would bury them.
        error.message = `${error.file}: ${error.message}`;
        error.stack = "";
      }
      throw error;
    }
  }

  const main: Plugin = {
    name: "pagez",
    enforce: "pre",
    config(user) {
      return {
        appType: "mpa",
        base: user.base ?? "./",
        build: {
          rollupOptions: { input: join(real(resolve(user.root ?? ".")), "index.html") },
          // The page has one module, so there's nothing to preload.
          modulePreload: { polyfill: false },
        },
      };
    },
    configResolved(resolved) {
      config = resolved;
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
    async load(id) {
      if (id !== entry()) return undefined;
      for (const file of ["index.md", "style.css", "frame.html"])
        this.addWatchFile(join(root, file));
      if (server) return html(serverLoader(server));
      // A build runs the page's templates in a server of its own, closed once the page is written.
      const loader = await createLoader(root);
      try {
        return await html(loader);
      } finally {
        await loader.close();
      }
    },
    // After Vite's own, which writes the page into the bundle.
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        const asset = bundle["index.html"];
        if (asset?.type !== "asset") return;
        asset.source = withLinkedFiles(String(asset.source), (href) => {
          const file = join(root, decodeURI(href.split(/[?#]/)[0]!));
          const ref = this.emitFile({
            type: "asset",
            name: basename(file),
            originalFileName: file,
            source: readFileSync(file),
          });
          return config.base + this.getFileName(ref) + href.slice(href.split(/[?#]/)[0]!.length);
        });
      },
    },
    configureServer(dev) {
      server = dev;
      // The page is rendered here, so a change to anything it's made from reloads it: the page,
      // its frame, CSS and elements, and any module a template ran.
      server.watcher.on("change", (file) => {
        const ssr = dev.environments.ssr?.moduleGraph.getModulesByFile(file);
        if (/\.(md|html)$|style\.css$|\.json$/.test(file) || (ssr && ssr.size > 0)) {
          dev.ws.send({ type: "full-reload" });
        }
      });
      server.middlewares.use(async (request, response, next) => {
        // With a query, it's one of Vite's own, such as the page's inline module.
        if (request.url !== "/" && request.url !== "/index.html") return next();
        try {
          const out = await dev.transformIndexHtml("/index.html", await html(serverLoader(dev)));
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
  return [main, parts()];
}

/** @prose
 * The built page with each link to a file beside it given that file's built name. Vite bundles what
 * HTML loads, such as an image or a stylesheet, but not what it links to, so a linked PDF or CSV is
 * emitted here, hashed like any other asset.
 */
function withLinkedFiles(html: string, emit: (href: string) => string): string {
  let out = "";
  let at = 0;
  for (const tag of scan(html)) {
    const href = tag.kind === "start" && tag.name === "a" ? attribute(tag, "href") : undefined;
    if (!href || href.valueStart === -1 || !linksFile(decode(href.value ?? ""))) continue;
    out += html.slice(at, href.valueStart) + emit(decode(href.value!));
    at = href.valueEnd;
  }
  return out + html.slice(at);
}
