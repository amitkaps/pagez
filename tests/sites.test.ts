/** @prose
 * # The test sites
 *
 * Each site in `tests/sites/` builds every page to its snapshot in
 * `tests/snapshots/sites/<site>/`, at the path the page is built at, or an `error-…` site fails
 * with `error.txt`, its file named from `tests/sites/`. Pagez's theme stands as a comment, as in
 * `pages.test.ts`.
 */
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { FileError } from "../src/elements/errors.ts";
import { compile, write } from "../src/page.ts";
import { createLoader, type Loader } from "../src/parts.ts";
import { readSite } from "../src/site.ts";
import theme from "../src/theme.css?built";

const sites = new URL("sites/", import.meta.url).pathname;

// One loader runs every site's templates.
let loader: Loader;
beforeAll(async () => {
  loader = await createLoader(sites);
});
afterAll(() => loader.close());

/** Every page of the site, each as its path and its HTML. */
async function build(name: string): Promise<{ path: string; html: string }[]> {
  const site = readSite(join(sites, name));
  const built = [];
  for (const page of site.pages) {
    const compiled = await compile(page.file, { site, loader });
    compiled.css = compiled.css.map((css) => (css === theme ? "/* Pagez's theme.css */" : css));
    built.push({ path: page.path, html: write(compiled) });
  }
  return built;
}

describe("the test sites", () => {
  const names = readdirSync(sites, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const name of names) {
    if (name.startsWith("error-")) {
      test(`${name} fails`, async () => {
        let error: unknown;
        try {
          await build(name);
        } catch (thrown) {
          error = thrown;
        }
        expect(error).toBeInstanceOf(FileError);
        const { file, message } = error as FileError;
        await expect(`${relative(sites, file)}: ${message}\n`).toMatchFileSnapshot(
          `snapshots/sites/${name}/error.txt`,
        );
      });
    } else {
      test(`${name} builds`, async () => {
        for (const { path, html } of await build(name)) {
          await expect(html).toMatchFileSnapshot(`snapshots/sites/${name}/${path}index.html`);
        }
      });
    }
  }
});
