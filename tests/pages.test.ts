/** @prose
 * # The test pages
 *
 * Each page in `tests/pages/` builds to its snapshot in `tests/snapshots/<page>/page.html`, or an
 * `error-…` page fails with `error.txt`, its file named from `tests/pages/`. A snapshot is reviewed
 * as it changes. Pagez's reset and prose stand as a comment in each, so a change to them doesn't
 * change every snapshot, and are checked in `css.test.ts`. A page that needs what isn't built yet
 * is a todo, with what it waits for.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { FileError } from "../src/elementz/errors.ts";
import { compile, write } from "../src/page.ts";

const pages = new URL("pages/", import.meta.url).pathname;

const LATER: Record<string, string> = {
  elements:
    "element-* error-name-* error-in-page-definition error-template-render page-css-wins frame-elements undefined-tag third-party-component",
  "prose expressions":
    "expressions expressions-dotted-key error-expression-call error-expression-missing error-expression-scope",
  "the bundler":
    "references-relative-script references-package references-shared-import references-url-import error-package-missing",
  "links settled": "references-link",
};

function waitsFor(page: string): string | undefined {
  for (const [what, names] of Object.entries(LATER)) {
    const patterns = names.split(" ").map((name) => new RegExp(`^${name.replace("*", ".*")}$`));
    if (patterns.some((pattern) => pattern.test(page))) return what;
  }
  return undefined;
}

/** Pagez's own CSS, as a page's head carries it. */
const own = ["reset.css", "prose.css"].map((name) => ({
  name,
  css: readFileSync(new URL(`../css/${name}`, import.meta.url), "utf8"),
}));

function build(page: string): string {
  const compiled = compile(join(pages, page, "index.md"));
  compiled.css = compiled.css.map((css) => {
    const found = own.find((file) => file.css === css);
    return found ? `/* Pagez's ${found.name} */` : css;
  });
  return write(compiled);
}

describe("the test pages", () => {
  const names = readdirSync(pages, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const page of names) {
    const later = waitsFor(page);
    if (later) {
      test.todo(`${page}, which waits for ${later}`);
    } else if (page.startsWith("error-")) {
      test(`${page} fails`, async () => {
        let error: unknown;
        try {
          build(page);
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
        await expect(build(page)).toMatchFileSnapshot(`snapshots/${page}/page.html`);
      });
    }
  }
});
