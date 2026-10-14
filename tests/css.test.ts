/** @prose
 * # The theme
 *
 * The rules the theme keeps, which a change to it could break without any page looking wrong at
 * first. It's one layer, so any other CSS beats it, and it styles only what Markdown writes, with
 * no classes. How it looks is checked by eye, on the prose and stories test pages.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";

const theme = readFileSync(new URL("../src/theme.css", import.meta.url), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Every selector in the theme: what comes before each `{`, less at-rules, one per comma. */
const selectors = [...theme.matchAll(/([^{};]+)\{/g)]
  .map((match) => match[1]!.trim())
  .filter((s) => !s.startsWith("@"))
  .flatMap((s) => s.split(",").map((part) => part.trim()));

// What Markz writes: Markdown's own, then the elements it names, inline and block, and the
// document around them.
const MARKDOWN = new Set(
  [
    "h1 h2 h3 h4 h5 h6 p a em strong del code pre blockquote ul ol li input img table thead tbody tr th td hr br",
    "abbr b i u s small cite q dfn time data var samp kbd mark sub sup ins bdi bdo ruby rt rp",
    "div section article aside header footer nav main address hgroup search details summary figure figcaption dl dt dd",
    "html body",
  ]
    .join(" ")
    .split(" "),
);

describe("theme.css", () => {
  test("is all in one layer", () => {
    expect(theme.trim().startsWith("@layer theme {")).toBe(true);
    expect(theme.trim().endsWith("}")).toBe(true);
    expect(theme.match(/@layer/g)).toHaveLength(1);
  });

  test("styles only what Markz writes, with no classes or ids", () => {
    for (const selector of selectors) {
      expect(selector).not.toMatch(/[.#][a-z]/i);
      for (const [tag] of selector.matchAll(/(?<![\w:[-])[a-z][a-z0-9]*(?![\w(-])/g)) {
        expect(MARKDOWN, `${tag} in ${selector}`).toContain(tag);
      }
    }
  });
});
