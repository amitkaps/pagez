/** @prose
 * # The docs' rules, held to the cases
 *
 * [Pages](../docs/pages.md) and [elements](../docs/elements.md) state each rule once, as a list
 * item that opens with its id, and end it with the cases that hold it. This holds the docs and the
 * tests to each other, so a rule can't be stated without a test, and a case can't test what no
 * rule states.
 *
 * A case is a folder in `tests/pages/` or `tests/sites/`, or a test file. Every `error-…` case
 * has a row in the Errors table, keyed by its name, and the rule the row names cites the case.
 * Code blocks are skipped, so an example can't state a rule.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";

const root = new URL("../", import.meta.url).pathname;

/** The lines of a doc outside its code blocks. */
function lines(doc: string): string[] {
  let fenced = false;
  return readFileSync(`${root}docs/${doc}`, "utf8")
    .split("\n")
    .filter((line) => {
      if (/^(```|~~~)/.test(line)) fenced = !fenced;
      return !fenced;
    });
}

type Rule = { id: string; doc: string; cases: string[] };

/** Every rule a doc states, with the cases in the brackets that end it. */
function rules(doc: string): Rule[] {
  return lines(doc).flatMap((line) => {
    const rule = /^- \[`([a-z][a-z0-9-]*)`\]\{#\1\}: (.+)$/.exec(line);
    if (!rule) return [];
    const cited = /\(([^()]+)\)\.?$/.exec(rule[2]!)?.[1] ?? "";
    const cases = [...cited.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
    return [{ id: rule[1]!, doc, cases }];
  });
}

/** Each row of the Errors table, with the rule it names. */
function errors(): { id: string; rule: string; doc: string }[] {
  return lines("pages.md").flatMap((line) => {
    const row =
      /^\| \[`(error-[a-z-]+)`\]\{#\1\} +\|.*\| +\[`([a-z0-9-]+)`\]\(([a-z.]*)#\2\) *\|$/.exec(
        line,
      );
    return row ? [{ id: row[1]!, rule: row[2]!, doc: row[3] || "pages.md" }] : [];
  });
}

const folders = (dir: string) =>
  readdirSync(`${root}tests/${dir}`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const cases = [...folders("pages"), ...folders("sites")];
const all = [...rules("pages.md"), ...rules("elements.md")];
const rows = errors();

test("each rule and each error has one id across the docs", () => {
  const ids = [...all.map((rule) => rule.id), ...rows.map((row) => row.id)];
  expect(ids.length).toBeGreaterThan(0);
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
});

test("no two cases share a name", () => {
  expect(new Set(cases).size).toBe(cases.length);
});

test("every rule cites a case or a test file that exists", () => {
  for (const rule of all) {
    expect(rule.cases, rule.id).not.toEqual([]);
    for (const name of rule.cases) {
      const found = name.startsWith("tests/") ? existsSync(`${root}${name}`) : cases.includes(name);
      expect(found, `${rule.id} cites ${name}`).toBe(true);
    }
  }
});

test("every case is cited by a rule", () => {
  const cited = new Set(all.flatMap((rule) => rule.cases));
  expect(cases.filter((name) => !cited.has(name))).toEqual([]);
});

test("the Errors table has a row for every error case, and only those", () => {
  const failing = cases.filter((name) => name.startsWith("error-"));
  expect(rows.map((row) => row.id).sort()).toEqual(failing.sort());
});

test("each error's rule is stated, and cites the error's case", () => {
  for (const row of rows) {
    const rule = all.find((r) => r.id === row.rule && r.doc === row.doc);
    expect(rule, `${row.id} names ${row.doc}#${row.rule}`).toBeDefined();
    expect(rule!.cases, `${row.rule} cites ${row.id}`).toContain(row.id);
  }
});
