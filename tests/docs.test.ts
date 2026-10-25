/** @prose
 * # The docs' rules, held to the cases
 *
 * [Pages](../docs/pages.md) and [elements](../docs/elements.md) state each rule once, as a list
 * item that opens with its id, and end it with the cases that hold it. This holds the docs and the
 * tests to each other, so a rule can't be stated without a test, and a case can't test what no
 * rule states.
 *
 * A case is a folder in `tests/pages/` or `tests/sites/`, or a test file. The rules and the rows
 * are read as `pagez rules` reads them, with Markz's reader, so an example in a code block can't
 * state a rule.
 *
 * The Errors table has a row for each id in `src/`, and only those, so a mistake can't ship
 * without one. An `error-…` case fails with an id, the code in its `error.txt`, and the rule
 * its row names cites the case. Each row is held by a case that fails with it or a test file that
 * names it, and its rule cites one of them. The Warnings table has a row for each `WarningId`, held
 * the same way by the `warnings.txt` of a case, which may warn with a Markz code too.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WARNINGS } from "@amitkaps/markz";
import { expect, test } from "vite-plus/test";
import { rows as codes, type Row, stated } from "../src/rules.ts";

const root = new URL("../", import.meta.url).pathname;

type Rule = { id: string; url: string; cases: string[] };

/** Every rule a doc states, with the cases in the brackets that end it. */
const rules = (doc: string): Rule[] =>
  stated(doc).map(({ id, url, text }) => {
    const cited = /\(([^()]+)\)\.?$/.exec(text)?.[1] ?? "";
    const cases = [...cited.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
    return { id, url, cases };
  });

const folders = (dir: string) =>
  readdirSync(`${root}tests/${dir}`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const cases = [...folders("pages"), ...folders("sites")];

/** Every file under `dir`, from the root. */
const under = (dir: string) =>
  readdirSync(`${root}${dir}`, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(root.length));

/** Each id the source fails with, written as a string, such as `"error-link-draft"`. */
const ids = new Set(
  under("src")
    .filter((file) => file.endsWith(".ts"))
    .flatMap((file) => [...readFileSync(`${root}${file}`, "utf8").matchAll(/"(error-[a-z-]+)"/g)])
    .map((match) => match[1]!),
);

/** The id each `error-…` case fails with, from its snapshot. */
const failsWith = new Map(
  cases
    .filter((name) => name.startsWith("error-"))
    .map((name) => {
      const dir = folders("pages").includes(name) ? "" : "sites/";
      const text = readFileSync(`${root}tests/snapshots/${dir}${name}/error.txt`, "utf8");
      return [name, /^pagez: error: \S+: (error-[a-z-]+): /.exec(text)?.[1]] as const;
    }),
);

/** Each `WarningId`, from its type. */
const warningIds = (
  /export type WarningId = ([^;]+);/.exec(
    readFileSync(`${root}src/elements/errors.ts`, "utf8"),
  )?.[1] ?? ""
)
  .split("|")
  .map((id) => id.trim().replace(/^"|"$/g, ""));

/** The ids each case warns with, from its snapshot. */
const warnsWith = cases.flatMap((name) => {
  const file = `${root}tests/snapshots/${name}/warnings.txt`;
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(/^pagez: warning: \S+: ([a-z-]+): /gm)].map(
    (match) => [name, match[1]!] as const,
  );
});

/** The test files, with their text, which may name an id. */
const testFiles = under("tests")
  .filter((file) => file.endsWith(".test.ts") && file !== "tests/docs.test.ts")
  .map((file) => ({ file, text: readFileSync(`${root}${file}`, "utf8") }));
const all = [...rules("pages.md"), ...rules("elements.md")];
const rows = codes().filter((row) => row.level === "error");
const warningRows = codes().filter((row) => row.level === "warning");

test("each rule and each error has one id across the docs", () => {
  const ids = [...all.map((rule) => rule.id), ...codes().map((row) => row.code)];
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

const ruleOf = (row: Row) => all.find((rule) => rule.url === row.rule);

test("the Errors table has a row for every id in the source, and only those", () => {
  expect(ids.size).toBeGreaterThan(0);
  expect(rows.map((row) => row.code).sort()).toEqual([...ids].sort());
});

test("each error case fails with an id, and its row's rule cites the case", () => {
  for (const [name, id] of failsWith) {
    const row = rows.find((row) => row.code === id);
    expect(row, `${name} fails with ${id}`).toBeDefined();
    expect(ruleOf(row!)?.cases, `${row!.rule} cites ${name}`).toContain(name);
  }
});

test("each error's rule is stated, and cites a case or a test file that holds the error", () => {
  for (const row of rows) {
    const rule = ruleOf(row);
    expect(rule, `${row.code} names ${row.rule}`).toBeDefined();
    const holders = [
      ...[...failsWith].filter(([, id]) => id === row.code).map(([name]) => name),
      ...testFiles.filter(({ text }) => text.includes(`"${row.code}"`)).map(({ file }) => file),
    ];
    expect(holders, `${row.code} is held by a test`).not.toEqual([]);
    expect(
      rule!.cases.some((name) => holders.includes(name)),
      `${rule!.id} cites one of ${holders.join(", ")}, for ${row.code}`,
    ).toBe(true);
  }
});

test("the Warnings table has a row for every WarningId, each held by a case its rule cites", () => {
  expect(warningRows.map((row) => row.code).sort()).toEqual(warningIds.toSorted());
  for (const row of warningRows) {
    const holders = warnsWith.filter(([, id]) => id === row.code).map(([name]) => name);
    expect(holders, `${row.code} is held by a case`).not.toEqual([]);
    expect(
      ruleOf(row)?.cases.some((name) => holders.includes(name)),
      row.code,
    ).toBe(true);
  }
  for (const [name, id] of warnsWith) {
    expect([...warningIds, ...Object.keys(WARNINGS)], `${name} warns with ${id}`).toContain(id);
  }
});
