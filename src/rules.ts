/** @prose
 * # The rules, printed
 *
 * `pagez rules <id>` prints one rule from the docs the package ships, so an agent reads the rule
 * for the version it runs. An error or a warning prints when it fails or warns, and then its rule.
 * A Markz code prints Markz's text for it. With no id, every rule prints, one a line.
 */
import { readFileSync } from "node:fs";
import { WARNINGS, type WarningCode } from "@amitkaps/markz";

const DOCS = ["pages.md", "elements.md"];

/** The lines of a doc outside its code blocks. */
function lines(doc: string): string[] {
  let fenced = false;
  return readFileSync(new URL(`../docs/${doc}`, import.meta.url), "utf8")
    .split("\n")
    .filter((line) => {
      if (/^(```|~~~)/.test(line)) fenced = !fenced;
      return !fenced;
    });
}

/** A doc's Markz as plain text: an id's span as the id, and a link within the docs as its text. */
const plain = (text: string) =>
  text.replace(/\[`([^`]+)`\]\{#[^}]+\}/g, "$1").replace(/\[([^\]]+)\]\(([a-z.]*)#[^)]*\)/g, "$1");

/** Every rule, as `id: text`. */
function rules(): Map<string, string> {
  const found = new Map<string, string>();
  for (const doc of DOCS) {
    for (const line of lines(doc)) {
      const rule = /^- \[`([a-z][a-z0-9-]*)`\]\{#\1\}: (.+)$/.exec(line);
      if (rule) found.set(rule[1]!, plain(rule[2]!));
    }
  }
  return found;
}

/** Each error and warning, by its id, with when it fails or warns, and its rule's id. */
function rows(): Map<string, { when: string; rule: string }> {
  const found = new Map<string, { when: string; rule: string }>();
  for (const line of lines("pages.md")) {
    const row = /^\| \[`([a-z-]+)`\]\{#\1\} +\| (.+?) +\| +\[`([a-z0-9-]+)`\]/.exec(line);
    if (row) found.set(row[1]!, { when: plain(row[2]!), rule: row[3]! });
  }
  return found;
}

/** What `pagez rules` prints for `id`, or `undefined` when it names nothing. */
export function printedRule(id?: string): string | undefined {
  const all = rules();
  if (id === undefined) return [...all].map(([id, text]) => `${id}: ${text}`).join("\n");
  const rule = all.get(id);
  if (rule) return `${id}: ${rule}`;
  const row = rows().get(id);
  if (row) {
    const verb = id.startsWith("error-") ? "Fails" : "Warns";
    return `${id}: ${verb} when ${row.when}.\n\n${row.rule}: ${all.get(row.rule)}`;
  }
  if (!Object.hasOwn(WARNINGS, id)) return undefined;
  const markz = WARNINGS[id as WarningCode];
  return `${id}: Markz warns at ${markz.message}. Instead: ${markz.instead}.`;
}
