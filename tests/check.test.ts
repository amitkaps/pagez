/** @prose
 * # Checking a site, and its rules
 *
 * `check` lists every page's failure and every warning, a line each, with its id, and writes
 * nothing. `printedRule` prints a rule, an error or a warning from the docs the package ships,
 * and Markz's rules after Pagez's.
 */
import { cpSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { check } from "../src/check.ts";
import { printedRule } from "../src/rules.ts";

/** A copy of a test site, to check in a folder of its own. */
function folder(name: string, from = "sites"): string {
  const dir = mkdtempSync(join(tmpdir(), "pagez-check-"));
  cpSync(new URL(`${from}/${name}/`, import.meta.url), dir, { recursive: true });
  return dir;
}

describe("check", () => {
  test("checks every page a build would, and writes no dist/", async () => {
    const root = folder("blog");
    expect(await check(root, root)).toEqual({ pages: 5, failures: [], warnings: [] });
    expect(existsSync(join(root, "dist"))).toBe(false);
  });

  test("lists each page's failure, where a build stops at its first, and each warning", async () => {
    const root = folder("folders");
    writeFileSync(join(root, "about.md"), "# About\n\n[Gone](gone.md)\n");
    writeFileSync(join(root, "notes.md"), "# Notes\n\nAt https://example.com/ and ${page.nope}.\n");
    const { failures, warnings } = await check(root, root);
    expect(failures).toEqual([
      expect.stringMatching(/^pagez: error: about\.md:3: error-link-missing: /),
      expect.stringMatching(/^pagez: error: notes\.md:3(:\d+)?: error-expression-missing: /),
    ]);
    expect(warnings).toEqual([]);
    writeFileSync(join(root, "notes.md"), "# Notes\n\nAt https://example.com/.\n");
    expect((await check(root, root)).warnings).toEqual([
      expect.stringMatching(/^pagez: warning: notes\.md:3: bare-url: bare URL; write /),
    ]);
  });

  test("gives a mistake the site's pages share as its one line", async () => {
    const root = folder("error-site-url");
    expect(await check(root, root)).toEqual({
      failures: [expect.stringMatching(/^pagez: error: pagez\.md: error-site-url: /)],
      warnings: [],
    });
  });
});

describe("printedRule", () => {
  test("prints a rule, an error or a warning with its rule, and a Markz code with Markz's", () => {
    expect(printedRule("folder-page")).toMatch(
      /^- `folder-page`: A page is a `\.md`, at its folder's path\./,
    );
    expect(printedRule("folder-page")).toContain(
      "https://pagez.amitkaps.com/docs/pages.md#folder-page",
    );
    expect(printedRule("error-link-missing")).toMatch(
      /^error-link-missing \(error\): .*\n.*\n\n- `links-checked`: A link must reach a page/,
    );
    expect(printedRule("links-checked")).toContain("Checked by `error-link-draft`, ");
    expect(printedRule("undefined-tag")).toMatch(
      /^undefined-tag \(warning\): .*\n.*\n\n- `use-undefined`: /,
    );
    expect(printedRule("bare-url")).toMatch(/^bare-url \(warning\): bare URL; write /);
    expect(printedRule("element-setup")).toMatch(/^- `element-setup`: /);
  });

  test("prints every rule with no id, Markz's after Pagez's, and nothing for an id that names none", () => {
    const all = printedRule()!;
    expect(all).toMatch(/^# pagez\n\n## The folder\n\n- `folder-page`: /);
    expect(all.indexOf("# markz\n")).toBeGreaterThan(all.indexOf("`element-setup`"));
    expect(printedRule("nope")).toBeUndefined();
  });
});
