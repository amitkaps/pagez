/** @prose
 * # Building to dist/
 *
 * The plugin builds a folder's pages through Vite, each to its folder in `dist/`, with their
 * references hashed into `dist/assets/`, each page's elements' behavior bundled into one module,
 * and leaves the folder as it was. A folder that has an `index.html` where a page is built fails,
 * since that's the file Pagez writes.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { build, createLogger, createServer, preview, type InlineConfig } from "vite-plus";
import { describe, expect, test, vi } from "vite-plus/test";
import { reportOnly } from "../src/report.ts";
import pagez from "../src/vite.ts";

/** A copy of a test page, or a test site, to build in a folder of its own. */
function folder(page: string, from = "pages"): string {
  const dir = mkdtempSync(join(tmpdir(), "pagez-vite-"));
  cpSync(new URL(`${from}/${page}/`, import.meta.url), dir, { recursive: true });
  return dir;
}

/** Every file under `dir`, from it, sorted. */
const files = (dir: string) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .toSorted();

const run = (root: string) =>
  build({ root, configFile: false, logLevel: "silent", plugins: [pagez()] });

describe("pagez()", () => {
  test("builds index.md to dist/, its CSS bundled with a hashed name, and writes nothing beside it", async () => {
    const root = folder("references-css");
    const before = readdirSync(root).toSorted();
    await run(root);
    const html = readFileSync(join(root, "dist/index.html"), "utf8");
    expect(html).toContain("<title>CSS references</title>");
    expect(html).toMatch(/<link rel="stylesheet" crossorigin href="\.\/assets\/[\w-]+\.css">/);
    expect(readdirSync(root).toSorted()).toEqual([...before, "dist"].toSorted());
    expect(existsSync(join(root, "dist/index.md"))).toBe(false);
  });

  test("builds a site's pages, each to its folder, with every reference reaching its file", async () => {
    const root = folder("folders", "sites");
    await run(root);
    const dist = join(root, "dist");
    const built = files(dist);
    expect(built.filter((file) => file.endsWith(".html"))).toEqual([
      "about/index.html",
      "essays/first/index.html",
      "essays/index.html",
      "index.html",
      "stories/index.html",
    ]);
    expect(built).toContain("robots.txt");
    for (const page of built.filter((file) => file.endsWith(".html"))) {
      const html = readFileSync(join(dist, page), "utf8");
      for (const [, path] of html.matchAll(/(?:src|href)="(\.[^"#]*)/g)) {
        const target = join(dist, dirname(page), path!);
        expect(
          existsSync(path!.endsWith("/") ? join(target, "index.html") : target),
          `${path} in ${page}`,
        ).toBe(true);
      }
    }
    const first = readFileSync(join(dist, "essays/first/index.html"), "utf8");
    expect(first).toContain('<a href="../../">Home</a> · <a href="../">Essays</a>');
    expect(first).toMatch(
      /<link rel="stylesheet" crossorigin href="\.\.\/\.\.\/assets\/[\w-]+\.css">/,
    );
  });

  test("links each page's own style.css, when a folder above has one too", async () => {
    const root = folder("folders", "sites");
    writeFileSync(join(root, "style.css"), "body { color: red; }\n");
    await run(root);
    const dist = join(root, "dist");
    const sheet = (page: string) => {
      const html = readFileSync(join(dist, page), "utf8");
      const [, href] = html.match(/<link rel="stylesheet" crossorigin href="([^"]+\.css)">/)!;
      return readFileSync(join(dist, dirname(page), href!), "utf8");
    };
    expect(sheet("index.html")).toContain("color:red");
    expect(sheet("stories/index.html")).not.toContain("color:red");
    expect(sheet("essays/index.html")).not.toContain("color:red");
  });

  test("builds 404.html from the root, _redirects after public/'s, no drafts, and reports the pages", async () => {
    const root = folder("blog", "sites");
    writeFileSync(join(root, "public/_redirects"), "/elsewhere https://example.org/ 302");
    const info: string[] = [];
    const logger = createLogger("silent");
    logger.info = (message) => void info.push(message);
    await build({ root, configFile: false, customLogger: logger, plugins: [pagez()] });
    const dist = join(root, "dist");
    expect(files(dist)).toEqual([
      "404.html",
      "_redirects",
      "blog/hello/index.html",
      "blog/index.html",
      "blog/moved/index.html",
      "favicon.svg",
      "index.html",
    ]);
    const missing = readFileSync(join(dist, "404.html"), "utf8");
    expect(missing).toContain('<nav><a href="/">Home</a> · <a href="/blog/">Blog</a></nav>');
    expect(missing).toContain('<a href="/">the home page</a>');
    const redirects = readFileSync(join(dist, "_redirects"), "utf8").split("\n");
    expect(redirects.slice(0, 2)).toEqual([
      "/elsewhere https://example.org/ 302",
      "/moved /blog/moved/ 301",
    ]);
    const shown = info.join("\n");
    expect(shown).toMatch(/^\/blog\/hello\/ +[\d.]+ KB +\d+ ms$/m);
    expect(shown).toMatch(
      /^5 pages and 2 redirects in [\d.]+ m?s → .*dist · pagez \d+\.\d+\.\d+$/m,
    );
    // A `dist/` outside the current folder is named by its whole path, not by a climb of `../`.
    expect(shown).not.toContain("→ ..");
  });

  test("prints the report alone in `pagez build`, without Vite's list of files", async () => {
    const root = folder("blog", "sites");
    const printed: string[] = [];
    const log = vi.spyOn(console, "log").mockImplementation((line) => void printed.push(line));
    const write = vi.spyOn(process.stdout, "write").mockImplementation((line) => {
      printed.push(String(line));
      return true;
    });
    try {
      await build({
        root,
        configFile: false,
        customLogger: reportOnly(),
        logLevel: "warn",
        plugins: [pagez()],
      });
    } finally {
      log.mockRestore();
      write.mockRestore();
    }
    expect(printed).toHaveLength(1);
    expect(printed[0]).toMatch(/^\npage +html +time\n/);
    expect(printed[0]).toMatch(/5 pages and 2 redirects in .* · pagez \S+$/);
  });

  test("sends an old address on to its page in dev and preview, as a host does", async () => {
    const root = folder("blog", "sites");
    const options = (): InlineConfig => ({
      root,
      configFile: false,
      logLevel: "silent",
      plugins: [pagez()],
    });
    const sent = async (url: string, path: string) => {
      const response = await fetch(new URL(path, url), { redirect: "manual" });
      return [response.status, response.headers.get("location")];
    };
    const dev = await createServer({ ...options(), server: { port: 0 } });
    await dev.listen();
    const at = dev.resolvedUrls!.local[0]!;
    expect(await sent(at, "/old-moved?a=1")).toEqual([301, "/blog/moved/?a=1"]);
    expect(await sent(at, "/moved.html")).toEqual([301, "/blog/moved/"]);
    await dev.close();
    await build(options());
    const served = await preview({ ...options(), preview: { port: 0 } });
    expect(await sent(served.resolvedUrls!.local[0]!, "/old-moved/")).toEqual([
      301,
      "/blog/moved/",
    ]);
    await new Promise((done) => served.httpServer.close(done));
  });

  test("fails in dev on a part of a definition the page no longer has", async () => {
    const root = folder("element-in-page");
    const dev = await createServer({
      root,
      configFile: false,
      logLevel: "silent",
      plugins: [pagez()],
    });
    await expect(
      dev.transformRequest("/index.md?pagez=setup&element=x-gone&lang.js"),
    ).rejects.toMatchObject({ id: "error-element-gone" });
    await dev.close();
  });

  test("fails on an index.html in the folder, which is what Pagez writes", async () => {
    const root = folder("plain");
    writeFileSync(join(root, "index.html"), "<p>old</p>");
    await expect(run(root)).rejects.toThrow(/index\.html is what Pagez writes from index\.md/);
  });

  test("bundles the runtime and each element's setup into one module, with the element's CSS in the page", async () => {
    const root = folder("element-behavior");
    await run(root);
    const html = readFileSync(join(root, "dist/index.html"), "utf8");
    expect(html).toContain(
      '<fold-out label="Details"><button aria-expanded="false">Details</button>',
    );
    expect(html).toContain("<style>fold-out{");
    const scripts = readdirSync(join(root, "dist/assets")).filter((file) => file.endsWith(".js"));
    expect(scripts).toHaveLength(1);
    const script = readFileSync(join(root, "dist/assets", scripts[0]!), "utf8");
    expect(script).toContain("customElements.define");
    expect(script).toContain("`fold-out`");
    expect(script).not.toContain("modulepreload");
  });

  test("runs a template's script at build time, and ships none of it", async () => {
    const root = folder("element-template-script");
    await run(root);
    const html = readFileSync(join(root, "dist/index.html"), "utf8");
    expect(html).toContain("<p>A template with a script: 5 words in its description.</p>");
    expect(existsSync(join(root, "dist/assets"))).toBe(false);
  });

  test("bundles a package from the node_modules beside the page, and leaves a URL import as written", async () => {
    const package_ = folder("references-package");
    await run(package_);
    const [script] = readdirSync(join(package_, "dist/assets"));
    expect(readFileSync(join(package_, "dist/assets", script!), "utf8")).toContain("toFixed(2)");
    const url = folder("references-url-import");
    await run(url);
    const [other] = readdirSync(join(url, "dist/assets"));
    expect(readFileSync(join(url, "dist/assets", other!), "utf8")).toContain(
      'from"https://esm.sh/canvas-confetti@1.9.3"',
    );
  });

  test("gives a linked file a hashed name, and a link to a page its folder", async () => {
    const root = folder("references-link");
    await run(root);
    const html = readFileSync(join(root, "dist/index.html"), "utf8");
    const href = /<a href="\.\/(assets\/data-[\w-]+\.csv)">data<\/a>/.exec(html)?.[1];
    expect(href).toBeDefined();
    expect(readFileSync(join(root, "dist", href!), "utf8")).toContain("2026,5");
    expect(html).toContain('<a href="./other/">another page</a>');
  });

  test("bundles what an element's CSS refers to, from the element's folder", async () => {
    const root = folder("element-in-folder");
    await run(root);
    const html = readFileSync(join(root, "dist/index.html"), "utf8");
    expect(html).toMatch(/site-badge\{[^}]*url\("?data:image\/svg\+xml/);
  });

  test("fails on an element's import that isn't there, at its line", async () => {
    const root = folder("error-package-missing");
    await expect(run(root)).rejects.toThrow(
      /@x-chart\.html:4: error-package-missing: this imports no-such-package, which isn't in a node_modules beside the page/,
    );
  });

  test("fails once for a mistake its pages share", async () => {
    const root = folder("folders", "sites");
    writeFileSync(
      join(root, "frame.html"),
      "<!doctype html>\n<html>\n<body><slot></slot></body>\n</html>\n",
    );
    const error = await run(root).then(
      () => undefined,
      (thrown: { errors?: unknown[]; message: string }) => thrown,
    );
    expect(error?.errors ?? [error]).toHaveLength(1);
    expect(error?.message).toMatch(/frame\.html: /);
  });

  test("gives a helper module Pagez's own html, not a copy installed beside the site", async () => {
    const root = folder("element-in-folder");
    const old = join(root, "node_modules/@amitkaps/pagez");
    mkdirSync(old, { recursive: true });
    writeFileSync(
      join(old, "package.json"),
      '{"name":"@amitkaps/pagez","type":"module","exports":"./index.js"}',
    );
    writeFileSync(
      join(old, "index.js"),
      "export const html = (strings, ...values) => ({ strings, values });",
    );
    writeFileSync(
      join(root, "card.js"),
      'import { html } from "@amitkaps/pagez";\nexport const card = (x) => html`<i>${x}</i>`;\n',
    );
    writeFileSync(
      join(root, "@x-card.html"),
      '<template>\n  <script>\n    import { card } from "./card.js";\n  </script>\n  ${card("helped")}\n</template>\n',
    );
    writeFileSync(
      join(root, "index.md"),
      `${readFileSync(join(root, "index.md"), "utf8")}\n{@x-card /}\n`,
    );
    await run(root);
    expect(readFileSync(join(root, "dist/index.html"), "utf8")).toContain(
      "<x-card><i>helped</i></x-card>",
    );
  });

  test("fails with the page's mistake, naming its file", async () => {
    const root = folder("error-relative-missing");
    await expect(run(root)).rejects.toThrow(
      /index\.md:7: error-[a-z-]+: \.\/missing\.svg isn't there/,
    );
  });
});
