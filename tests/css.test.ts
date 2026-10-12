/** @prose
 * # Reset and prose
 *
 * The rules each file keeps, which a change to it could break without any page looking wrong at
 * first. The reset has no typography or color, prose has no classes, and both open with the
 * layer order. How the two look is checked by eye, on the stories test page.
 */
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";

const read = (name: string) =>
  readFileSync(new URL(`../css/${name}`, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const reset = read("reset.css");
const prose = read("prose.css");

/** Every selector in a stylesheet: what comes before each `{`, less at-rules. */
const selectors = (css: string) =>
  [...css.matchAll(/([^{};]+)\{/g)]
    .map((match) => match[1]!.trim())
    .filter((s) => !s.startsWith("@"));

describe("reset.css and prose.css", () => {
  test.each([
    ["reset.css", reset],
    ["prose.css", prose],
  ])("%s opens with the layer order, and keeps to its layer", (name, css) => {
    expect(css.trim().startsWith("@layer reset, prose, elements;")).toBe(true);
    expect(css).toContain(`@layer ${name.replace(".css", "")} {`);
  });

  test("the reset has no typography or color", () => {
    expect(reset).not.toMatch(
      /\b(font-family|font-size|font-weight|line-height|color|background)\s*:/,
    );
  });

  test("prose has no classes or ids, only native elements", () => {
    for (const selector of selectors(prose)) expect(selector).not.toMatch(/[.#][a-z]/i);
  });

  test("the measure's registered initial value is in px, or the browser drops the rule", () => {
    expect(prose).toMatch(/@property --prose-measure \{[^}]*initial-value: \d+px;/);
  });
});
