/** @prose
 * # The test pages
 *
 * Each page in `tests/pages/` builds to its snapshot in `tests/snapshots/<page>/page.html`, or an
 * `error-…` page fails with `error.txt`, its file named from `tests/pages/`. A snapshot is reviewed
 * as it changes, and a page that warns has its warnings in `warnings.txt`. Pagez's theme stands
 * as a comment in each, so a change to it doesn't change every snapshot, and is checked in
 * `css.test.ts`.
 */
import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { FileError } from "../src/elements/errors.ts";
import { compile, write } from "../src/page.ts";
import { createLoader, type Loader } from "../src/parts.ts";
import theme from "../src/theme.css?built";

const pages = new URL("pages/", import.meta.url).pathname;

/** Pagez's own CSS, as a page's head carries it. */
const own = [{ name: "theme.css", css: theme }];

// One loader runs every page's templates, as one build would.
let loader: Loader;
beforeAll(async () => {
  loader = await createLoader(pages);
});
afterAll(() => loader.close());

async function build(page: string): Promise<{ html: string; warnings: string[] }> {
  const compiled = await compile(join(pages, page, "index.md"), { loader });
  compiled.css = compiled.css.map((css) => {
    const found = own.find((file) => file.css === css);
    return found ? `/* Pagez's ${found.name} */` : css;
  });
  return { html: write(compiled), warnings: compiled.warnings };
}

describe("the test pages", () => {
  const names = readdirSync(pages, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const page of names) {
    if (page.startsWith("error-")) {
      test(`${page} fails`, async () => {
        let error: unknown;
        try {
          await build(page);
        } catch (thrown) {
          error = thrown;
        }
        expect(error).toBeInstanceOf(FileError);
        const { file, message } = error as FileError;
        await expect(`${relative(pages, file)}: ${message}\n`).toMatchFileSnapshot(
          `snapshots/${page}/error.txt`,
        );
      });
    } else {
      test(`${page} builds`, async () => {
        const { html, warnings } = await build(page);
        await expect(html).toMatchFileSnapshot(`snapshots/${page}/page.html`);
        const shown = warnings.map((warning) => `${page}/index.md: ${warning}\n`).join("");
        if (shown) await expect(shown).toMatchFileSnapshot(`snapshots/${page}/warnings.txt`);
        // A page that stops warning loses its snapshot, so the snapshot never says it still does.
        else
          expect(existsSync(new URL(`snapshots/${page}/warnings.txt`, import.meta.url))).toBe(
            false,
          );
      });
    }
  }
});
