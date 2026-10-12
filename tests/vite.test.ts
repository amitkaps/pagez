/** @prose
 * # Building to dist/
 *
 * The plugin builds a folder's `index.md` through Vite, with its references hashed into `dist/`,
 * and leaves the folder as it was. A folder that has an `index.html` of its own fails, since
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

  test("fails with the page's mistake, naming its file", async () => {
    const root = folder("error-relative-missing");
    await expect(run(root)).rejects.toThrow(/index\.md: line 7: \.\/missing\.svg isn't there/);
  });
});
