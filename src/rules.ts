/** @prose
 * # The rules, printed
 *
 * `pagez rules <id>` prints one rule from the docs the package ships, so an agent reads the rule
 * for the version it runs. Markz's reader reads them, as every tool built on Markz reads its
 * rules, and Markz's rules print after Pagez's, so an id from either finds its rule. With no id,
 * every rule prints, under its heading.
 *
 * A rule is a list item in [pages](../docs/pages.md) or [elements](../docs/elements.md) that
 * opens with its id. An error or a warning is a row of the Errors or the Warnings table, which
 * names the rule it serves. The row is the code, and the rule lists it among the codes that check
 * it, so an error prints with its rule, as a Markz code does.
 */
import { readFileSync } from "node:fs";
import { ids, parse } from "@amitkaps/markz";
import {
  type Code,
  compose,
  markz,
  printOne,
  printRules,
  readRules,
  type Rule,
  type Rules,
} from "@amitkaps/markz/rules";

/** Where the docs are published, which their links resolve against. */
export const SITE = "https://pagez.amitkaps.com/docs/";

const read = (doc: string) => readFileSync(new URL(`../docs/${doc}`, import.meta.url), "utf8");

/** An error or a warning, with the address of the rule it serves. */
export interface Row extends Code {
  rule: string;
}

/** Each row of the tables in pages.md that opens with an id, an error's or a warning's. */
export function rows(source = read("pages.md")): Row[] {
  const doc = parse(source);
  const url = `${SITE}pages.md`;
  return ids(doc).flatMap(({ id, node }) => {
    const row = doc.parent(doc.parent(node));
    if (doc.type(row) !== "tableRow") return [];
    const [, when, served] = [...doc.children(row)].map((cell) =>
      source.slice(doc.start(cell), doc.end(cell)).trim(),
    );
    const [, label, destination] = /^\[`([a-z0-9-]+)`\]\(([^)]*)\)$/.exec(served ?? "") ?? [];
    if (!when || !label || destination === undefined) return [];
    return [
      {
        code: id,
        level: id.startsWith("error-") ? "error" : "warning",
        message: when,
        instead: `what \`${label}\` asks`,
        url: `${url}#${id}`,
        rule: new URL(destination, url).href,
      },
    ];
  });
}

/** Every rule a doc states, in order. */
export const stated = (doc: string): Rule[] => readRules(read(doc), `${SITE}${doc}`);

/** Pagez's rules, each with the errors and warnings that check it, and its codes. */
export function pagez(): Rules {
  const codes = rows();
  const rules = ["pages.md", "elements.md"].flatMap(stated).map((rule) => ({
    ...rule,
    links: [...rule.links, ...codes.filter((c) => c.rule === rule.url).map((c) => c.url)],
  }));
  return { tool: "pagez", rules, codes };
}

/** What `pagez rules` prints for `id`, or every rule without one, or `undefined` when `id` names
 *  nothing. */
export function printedRule(id?: string): string | undefined {
  const sets = compose(pagez(), markz);
  return id === undefined ? printRules(sets) : printOne(sets, id);
}
