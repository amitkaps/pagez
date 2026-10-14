/** @prose
 * # The Vite plugin
 *
 * `pagez()` builds the site in Vite's root through Vite: every page, each a `.md` at its folder's
 * path (`site.ts`). `vp build` writes `dist/` with its CSS, images and fonts hashed and minified,
 * `vp dev` serves it while it's written, and `vp preview` serves what was built. `public/` is
 * copied as it is, as Vite does ([folders.md](../docs/folders.md#the-rules)). Its other plugin
 * serves the elements' parts (`parts.ts`), so Vite bundles each element's `setup` into its page's
 * one module.
 *
 * The pages' templates run at build time in a Vite server: `dev`'s own, so a change is seen on
 * the next request, or one `build` makes for every page.
 *
 * Vite builds from HTML files, and each page's is the one Pagez compiles. The plugin hands it to
 * Vite in memory, at the path it's built at, `about/index.html` for `about.md`, so Vite reads its
 * references from there, and the source is never written to. `dev` reads the site again for each
 * request, so a new page is served without a restart.
 *
 * The base is `./` unless the config sets one, so `dist/` works wherever it's served, at a site's
 * root or under a path such as `/stories/`. Built HTML needs a server, since Vite marks its
 * stylesheet `crossorigin`, which a page opened from disk can't load.
 */
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite-plus";
import { FileError } from "./elements/errors.ts";
import { attribute, decode, scan } from "./elements/markup.ts";
import { compile, write } from "./page.ts";
import { createLoader, parts, serverLoader, type Loader } from "./parts.ts";
import { linksFile } from "./references.ts";
import { readSite, type Site } from "./site.ts";

/** A folder as its real path, so the entries Pagez names and the ones Vite resolves are the same. */
const real = (dir: string) => (existsSync(dir) ? realpathSync(dir) : dir);

/** A mistake as `file: message`, which Vite prints, since the file and the message are the whole story. */
function shown(error: unknown): unknown {
  if (error instanceof FileError && !error.message.startsWith(`${error.file}: `)) {
    error.message = `${error.file}: ${error.message}`;
    error.stack = "";
  }
  return error;
}

/** The site at `root`, with its mistakes shown. */
function site(root: string): Site {
  try {
    return readSite(root);
  } catch (error) {
    throw shown(error);
  }
}

/** Each page's entry, the `index.html` it's built as, and the page. */
const entries = ({ root, pages }: Site) =>
  new Map(pages.map((page) => [join(root, page.path, "index.html"), page.file]));

/** Adds Pagez to a folder's Vite config, with no options. */
export default function pagez(): Plugin[] {
  let root = "";
  let config: ResolvedConfig;
  let server: ViteDevServer | undefined;
  // A build runs every page's templates in one server, closed once the pages are written.
  let built: Promise<Loader> | undefined;

  /** A page's HTML, with its warnings printed. */
  async function html(file: string, from: Site, loader: Loader): Promise<string> {
    try {
      const compiled = await compile(file, { site: from, loader });
      for (const warning of compiled.warnings) config.logger.warn(`${file}: ${warning}`);
      return write(compiled);
    } catch (error) {
      throw shown(error);
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
          rollupOptions: { input: [...entries(site(real(resolve(user.root ?? ".")))).keys()] },
          // A page has one module, so there's nothing to preload.
          modulePreload: { polyfill: false },
        },
      };
    },
    configResolved(resolved) {
      config = resolved;
      root = real(config.root);
    },
    resolveId(id) {
      return id.startsWith(root) && id.endsWith("index.html") && entries(site(root)).has(id)
        ? id
        : undefined;
    },
    async load(id) {
      const from = site(root);
      const file = entries(from).get(id);
      if (!file) return undefined;
      this.addWatchFile(file);
      if (server) return html(file, from, serverLoader(server));
      built ??= createLoader(root);
      return html(file, from, await built);
    },
    async buildEnd() {
      await (await built)?.close();
      built = undefined;
    },
    // After Vite's own, which writes each page into the bundle.
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        for (const asset of Object.values(bundle)) {
          if (asset.type !== "asset" || !asset.fileName.endsWith(".html")) continue;
          const dir = dirname(asset.fileName);
          asset.source = withLinkedFiles(String(asset.source), join(root, dir), (file) => {
            const ref = this.emitFile({
              type: "asset",
              name: basename(file),
              originalFileName: file,
              source: readFileSync(file),
            });
            const name = this.getFileName(ref);
            if (!/^\.?\/?$/.test(config.base)) return config.base + name;
            const out = relative(dir, name);
            return out.startsWith(".") ? out : `./${out}`;
          });
        }
      },
    },
    configureServer(dev) {
      server = dev;
      // A page is rendered here, so a change to anything a page is made from reloads it: a page,
      // a frame, CSS or an element, and any module a template ran. A page added or removed does too.
      const reload = (file: string) => {
        const ssr = dev.environments.ssr?.moduleGraph.getModulesByFile(file);
        if (/\.(md|html)$|style\.css$|\.json$/.test(file) || (ssr && ssr.size > 0)) {
          dev.ws.send({ type: "full-reload" });
        }
      };
      server.watcher.on("change", reload);
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
      server.middlewares.use(async (request, response, next) => {
        // With a query, it's one of Vite's own, such as a page's inline module.
        const url = request.url ?? "/";
        if (url.includes("?")) return next();
        const path = decodeURI(url).replace(/\/index\.html$/, "/");
        const from = site(root);
        const found = entries(from);
        if (!path.endsWith("/")) {
          // `/about` is the page at `/about/`, where its relative references are written from.
          if (!found.has(join(root, path, "index.html"))) return next();
          response.statusCode = 301;
          response.setHeader("Location", `${url}/`);
          return response.end();
        }
        const file = found.get(join(root, path, "index.html"));
        if (!file) return next();
        try {
          const page = await html(file, from, serverLoader(dev));
          const out = await dev.transformIndexHtml(`${path}index.html`, page);
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
 * A built page, in `dir`, with each link to a file given that file's built name. Vite bundles what
 * HTML loads, such as an image or a stylesheet, but not what it links to, so a linked PDF or CSV is
 * emitted here, hashed like any other asset. A link to a folder, such as another page's, is left.
 */
function withLinkedFiles(html: string, dir: string, emit: (file: string) => string): string {
  let out = "";
  let at = 0;
  for (const tag of scan(html)) {
    const href = tag.kind === "start" && tag.name === "a" ? attribute(tag, "href") : undefined;
    if (!href || href.valueStart === -1 || !linksFile(decode(href.value ?? ""))) continue;
    const value = decode(href.value!);
    const cut = value.search(/[?#]/);
    const file = join(dir, decodeURI(cut === -1 ? value : value.slice(0, cut)));
    if (!statSync(file, { throwIfNoEntry: false })?.isFile()) continue;
    out += html.slice(at, href.valueStart) + emit(file) + (cut === -1 ? "" : value.slice(cut));
    at = href.valueEnd;
  }
  return out + html.slice(at);
}
