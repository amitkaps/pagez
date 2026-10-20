/** @prose
 * # Size
 *
 * `pnpm size` measures what Pagez adds to a page, gzipped, as a browser pays for it, and fails
 * past a budget, so growth shows in the pull request that causes it. `verify` runs it. It builds
 * two test pages with the built plugin, `dist/`:
 *
 * - **the theme**, the `<style>` a page with no CSS of its own gets
 * - **the head**, what Pagez writes around a plain page's text, without the theme
 * - **the runtime**, the module a page with one element's behavior ships, with that element's setup
 *
 * Each budget is a little over what it measures now. Raising one is a choice the pull request
 * makes, and says why.
 */
import { cpSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite-plus";

const root = join(import.meta.dirname, "../..");
const { default: pagez } = (await import(join(root, "dist/vite.js"))) as {
  default: () => import("vite-plus").Plugin[];
};

/** Each part's budget, in gzipped bytes. */
const BUDGET = { theme: 900, head: 300, runtime: 400 };

/** A test page, built with the plugin in a folder of its own, as its `dist/`. */
async function built(page: string): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "pagez-size-"));
  cpSync(join(root, "tests/pages", page), dir, { recursive: true });
  await build({ root: dir, configFile: false, logLevel: "silent", plugins: [pagez()] });
  return join(dir, "dist");
}

const gzipped = (text: string) => gzipSync(text, { level: 9 }).length;

const plain = readFileSync(join(await built("plain"), "index.html"), "utf8");
const style = /<style>([\s\S]*?)<\/style>/.exec(plain)?.[1] ?? "";
const head = plain.replace(/<style>[\s\S]*?<\/style>\s*/, "").replace(/<main>[\s\S]*<\/main>/, "");
const assets = join(await built("element-behavior"), "assets");
const runtime = readdirSync(assets)
  .filter((file) => file.endsWith(".js"))
  .map((file) => readFileSync(join(assets, file), "utf8"))
  .join("");

const measured = { theme: gzipped(style), head: gzipped(head), runtime: gzipped(runtime) };
let over = false;
for (const [part, bytes] of Object.entries(measured)) {
  const budget = BUDGET[part as keyof typeof BUDGET];
  const mark = bytes > budget ? "  over budget" : "";
  over ||= bytes > budget;
  console.log(`${part.padEnd(8)} ${String(bytes).padStart(5)} B gzip, of ${budget} B${mark}`);
}
if (over) process.exitCode = 1;
