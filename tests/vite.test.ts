/** @prose
 * # Building to dist/
 *
 * The plugin builds a folder's `index.md` through Vite, with its references hashed into `dist/`,
 * its elements' behavior bundled into one module, and leaves the folder as it was. A folder that has an `index.html` of its own fails, since
 * that's the file Pagez writes.
 */
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "vite-plus";
import { describe, expect, test } from "vite-plus/test";
import pagez from "../src/vite.ts";

/** A copy of a test page, to build in a folder of its own. */
function folder(page: string): string {
  const dir = mkdtempSync(join(tmpdir(), "pagez-vite-"));
  cpSync(new URL(`pages/${page}/`, import.meta.url), dir, { recursive: true });
  return dir;
}

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

  test("gives a linked file a hashed name, and leaves a link to a page", async () => {
    const root = folder("references-link");
    await run(root);
    const html = readFileSync(join(root, "dist/index.html"), "utf8");
    const href = /<a href="\.\/(assets\/data-[\w-]+\.csv)">data<\/a>/.exec(html)?.[1];
    expect(href).toBeDefined();
    expect(readFileSync(join(root, "dist", href!), "utf8")).toContain("2026,5");
    expect(html).toContain('<a href="./other.md">another page</a>');
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
      /@x-chart\.html: line 4: this imports no-such-package, which isn't in a node_modules beside the page/,
    );
  });

  test("fails with the page's mistake, naming its file", async () => {
    const root = folder("error-relative-missing");
    await expect(run(root)).rejects.toThrow(/index\.md: line 7: \.\/missing\.svg isn't there/);
  });
});
