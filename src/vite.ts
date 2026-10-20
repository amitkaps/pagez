/** @prose
 * # The Vite plugin
 *
 * `pagez()` builds the site in Vite's root through Vite, every page, each a `.md` at its folder's
 * path (`site.ts`).
 *
 * `vp build` writes `dist/` with its CSS, images and fonts hashed and minified, `vp dev` serves it
 * while it's written, and `vp preview` serves what was built. `public/` is copied as it is, as Vite
 * does ([pages](../docs/pages.md#folder-public)). Pagez's other plugin serves the elements'
 * parts (`parts.ts`), so Vite bundles each element's `setup` into its page's one module.
 *
 * The pages' templates run at build time in a Vite server. It's `dev`'s own, so a change is seen on
 * the next request, or one `build` makes for every page.
 *
 * Vite builds from HTML files, and each page's is the one Pagez compiles. The plugin hands it to
 * Vite in memory, at the path it's built at, `about/index.html` for `about.md`. So Vite reads its
 * references from there, and the source is never written to. `dev` reads the site again for each
 * request, so a new page is served without a restart.
 *
 * The base is `./` unless the config sets one, so `dist/` works wherever it's served, at a site's
 * root or under a path such as `/stories/`. Built HTML needs a server, since Vite marks its
 * stylesheet `crossorigin`, which a page opened from disk can't load.
 */
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import type { Connect, Plugin, ResolvedConfig, ViteDevServer } from "vite-plus";
import { FileError, printedError } from "./elements/errors.ts";
import { attribute, decode, scan } from "./elements/markup.ts";
import { checkShared, compile, write } from "./page.ts";
import { createLoader, parts, serverLoader, type Loader } from "./parts.ts";
import { redirectsFile, redirectTo } from "./redirects.ts";
import { fromRoot, linksFile } from "./references.ts";
import { report, type Report, type Reported } from "./report.ts";
import { readSite, type Site, type SitePage } from "./site.ts";

/** A folder as its real path, so the entries Pagez names and the ones Vite resolves are the same. */
const real = (dir: string) => (existsSync(dir) ? realpathSync(dir) : dir);

/** A mistake as `file: message [id]`, which Vite prints, since that's the whole story. */
function shown(error: unknown): unknown {
  if (error instanceof FileError && !error.message.startsWith(`${error.file}: `)) {
    error.message = printedError(error);
    error.stack = "";
  }
  return error;
}

/** The site at `root`, with its mistakes shown, and its drafts in `dev`. */
function site(root: string, dev = false): Site {
  try {
    return readSite(root, { drafts: dev });
  } catch (error) {
    throw shown(error);
  }
}

/** Each site's entries, once it's been read, since a build asks for them on every resolve. */
const listed = new WeakMap<Site, Map<string, Entry>>();

/** What an entry builds: a page. */
type Entry = { page: SitePage };

/** Each page the site builds, by its path in memory, `about/index.html` under the root, and `404.html`. */
function entries(site: Site): Map<string, Entry> {
  const known = listed.get(site);
  if (known) return known;
  const found = new Map<string, Entry>();
  for (const page of [...site.pages, ...(site.notFound ? [site.notFound] : [])]) {
    found.set(join(site.root, page.html), { page });
  }
  listed.set(site, found);
  return found;
}

/** @prose
 * Sends a request for an old address on to its page, with a 301, as a host does with
 * `_redirects`, so `dev` and `preview` send what's built.
 */
function redirecting(read: () => Site): Connect.NextHandleFunction {
  return (request, response, next) => {
    const url = request.url ?? "/";
    const cut = url.search(/[?#]/);
    const to = redirectTo(read(), decodeURI(cut === -1 ? url : url.slice(0, cut)));
    if (!to) return next();
    response.statusCode = 301;
    response.setHeader("Location", encodeURI(to) + (cut === -1 ? "" : url.slice(cut)));
    response.end();
  };
}

/** Pagez's version, for the report. */
const VERSION = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

/** Adds Pagez to a folder's Vite config, with no options. */
export default function pagez(): Plugin[] {
  let root = "";
  let config: ResolvedConfig;
  let server: ViteDevServer | undefined;
  // A build runs every page's templates in one server, closed once the pages are written.
  let built: Promise<Loader> | undefined;
  // What the report needs, kept as a build goes.
  let started = 0;
  const compiled = new Map<string, { ms: number; behavior: string[] }>();
  let reported: Omit<Report, "ms" | "out" | "version"> | undefined;
  // A build reads the site once, since nothing in it changes as it runs. `dev` reads it again for
  // each request, so a new page is served without a restart.
  let read: Site | undefined;
  const current = () => (server ? site(root, true) : (read ??= site(root)));

  /** What `id`, an entry, builds, with its mistakes shown. */
  async function html(from: Site, entry: Entry, loader: () => Promise<Loader>): Promise<string> {
    try {
      const ready = await loader();
      const t = performance.now();
      const page = await compile(entry.page.file, { site: from, loader: ready });
      for (const warning of page.warnings) config.logger.warn(`${entry.page.file}: ${warning}`);
      compiled.set(entry.page.html, { ms: performance.now() - t, behavior: page.behavior });
      return write(page);
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
    buildStart() {
      started = performance.now();
      compiled.clear();
      read = undefined;
      // What pages share fails here, once, rather than in each page's build.
      try {
        checkShared(current());
      } catch (error) {
        throw shown(error);
      }
    },
    resolveId(id) {
      return id.startsWith(root) && id.endsWith(".html") && entries(current()).has(id)
        ? id
        : undefined;
    },
    async load(id) {
      const from = current();
      const entry = entries(from).get(id);
      if (!entry) return undefined;
      this.addWatchFile(entry.page.file);
      if (server) return html(from, entry, async () => serverLoader(server!));
      built ??= createLoader(root);
      return html(from, entry, () => built!);
    },
    async buildEnd() {
      await (await built)?.close();
      built = undefined;
    },
    // After Vite's own, which writes each page into the bundle.
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        const from = current();
        const pages: Reported[] = [];
        let [css, js] = [0, 0];
        for (const file of Object.values(bundle)) {
          const source = file.type === "asset" ? file.source : file.code;
          if (file.fileName.endsWith(".css")) css += gzipSync(source).length;
          if (file.fileName.endsWith(".js")) js += gzipSync(source).length;
          if (file.type !== "asset" || !file.fileName.endsWith(".html")) continue;
          const dir = dirname(file.fileName);
          let out = withLinkedFiles(String(file.source), join(root, dir), (linked) => {
            const ref = this.emitFile({
              type: "asset",
              name: basename(linked),
              originalFileName: linked,
              source: readFileSync(linked),
            });
            const name = this.getFileName(ref);
            if (!/^\.?\/?$/.test(config.base)) return config.base + name;
            const path = relative(dir, name);
            return path.startsWith(".") ? path : `./${path}`;
          });
          if (file.fileName === from.notFound?.html) {
            out = fromRoot(out, new URL(String(from.metadata.url)).pathname);
          }
          file.source = out;
          const page = compiled.get(file.fileName);
          if (page) {
            const path = file.fileName === "404.html" ? "/404.html" : `/${dirname(file.fileName)}/`;
            pages.push({
              path: path.replace(/^\/\.\/$/, "/"),
              html: gzipSync(out).length,
              ...page,
            });
          }
        }
        pages.sort((a, b) => (a.path < b.path ? -1 : 1));
        if (from.redirects.size > 0) {
          // A host reads one `_redirects`, so one in `public/` goes first, and Vite's copy of it
          // is replaced.
          const own = join(config.publicDir, "_redirects");
          const first = config.publicDir && existsSync(own) ? readFileSync(own, "utf8") : "";
          this.emitFile({
            type: "asset",
            fileName: "_redirects",
            source: `${first}${first && !first.endsWith("\n") ? "\n" : ""}${redirectsFile(from)}`,
          });
        }
        reported = { pages, css, js, redirects: from.redirects.size };
      },
    },
    closeBundle() {
      if (config.command !== "build" || !reported) return;
      // `dist/` is named from the current folder when it's below it, and by its whole path when not.
      const dist = resolve(root, config.build.outDir);
      const below = relative(process.cwd(), dist);
      const out = below.startsWith("..") ? dist : below || ".";
      const ms = performance.now() - started;
      config.logger.info(`\n${report({ ...reported, ms, out, version: VERSION })}`);
      reported = undefined;
    },
    configurePreviewServer(preview) {
      preview.middlewares.use(redirecting(() => (read ??= site(root))));
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
      server.middlewares.use(redirecting(() => site(root, true)));
      server.middlewares.use(async (request, response, next) => {
        // With a query, it's one of Vite's own, such as a page's inline module.
        const url = request.url ?? "/";
        if (url.includes("?")) return next();
        const path = decodeURI(url).replace(/\/index\.html$/, "/");
        const from = site(root, true);
        const found = entries(from);
        const file = path.endsWith("/") ? `${path}index.html` : path;
        const entry = found.get(join(root, file));
        if (!entry && !path.endsWith("/") && found.has(join(root, path, "index.html"))) {
          // `/about` is the page at `/about/`, where its relative references are written from.
          response.statusCode = 301;
          response.setHeader("Location", `${url}/`);
          return response.end();
        }
        if (!entry) return next();
        try {
          const page = await serve(from, entry, dev);
          response.setHeader("Content-Type", "text/html");
          response.end(await dev.transformIndexHtml(file, page));
        } catch (error) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "text/plain");
          response.end((error as Error).message);
        }
      });
    },
  };

  /** An entry in `dev`, `404.html` with its references from the root, as it's built. */
  async function serve(from: Site, entry: Entry, dev: ViteDevServer): Promise<string> {
    const out = await html(from, entry, async () => serverLoader(dev));
    return entry.page === from.notFound ? fromRoot(out, "/") : out;
  }

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
