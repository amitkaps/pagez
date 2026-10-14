/** @prose
 * # A page's elements
 *
 * Where a page's elements are defined ([design.md](../docs/design.md#where-definitions-live)): an
 * `@x-tag.html` anywhere in the site, kept with the pages that use it, or a definition
 * in the page, one `=html` block holding `<template element="x-tag">` and its `<style>` and
 * `<script>`. An element is found by its name, so there's nothing to import, and a name has one
 * definition, so two fail, wherever they are.
 *
 * A definition in the page is read as an element file is, from the page with all but its block
 * blanked. So its lines are the page's, and a mistake in it names the page's line, as one in a
 * file names the file's.
 */
import { basename, relative } from "node:path";
import { position, walk, type Document, type NodeId } from "@amitkaps/markz";
import { FileError } from "./elements/errors.ts";
import { nameOf, readElement, type ElementFile } from "./elements/file.ts";
import { attribute, scan } from "./elements/markup.ts";
import { siteFiles } from "./site.ts";

/** What Pagez adds to every template's scope. */
export const SCOPE: string[] = ["page", "pages", "site"];

/** A page's elements, by name, and the blocks in it that define one, which aren't written. */
export interface Definitions {
  elements: Map<string, ElementFile>;
  blocks: Set<NodeId>;
}

/** @prose
 * Every element `file`, a page, can use: each file in the site under `root`, then each definition
 * in the page.
 * A name in a file and in the page fails at the page's definition, and two in the page fail at
 * the second, naming the first's line.
 */
export function readDefinitions(file: string, doc: Document, root: string): Definitions {
  const elements = readFiles(root);
  const blocks = new Set<NodeId>();
  const lines = new Map<string, number>();
  for (const { node, element, line } of pageElements(file, doc)) {
    const { name } = element;
    const other = elements.get(name);
    if (other) {
      const where = lines.has(name)
        ? `at line ${lines.get(name)}`
        : `in ${relative(root, other.file)}`;
      throw new FileError(
        file,
        `line ${line}: <${name}> is already defined ${where}. A name has one definition, wherever it sits. Remove one, or rename the element.`,
      );
    }
    elements.set(name, element);
    lines.set(name, line);
    blocks.add(node);
  }
  return { elements, blocks };
}

/** @prose
 * The definitions in a page, each the `=html` block whose first tag is a `<template>` with an
 * `element` attribute. Any other block is raw HTML, written as it is, a `<template>` with no name
 * included.
 */
export function pageElements(
  file: string,
  doc: Document,
): { node: NodeId; element: ElementFile; line: number }[] {
  const found: { node: NodeId; element: ElementFile; line: number }[] = [];
  const at = position(doc.source);
  walk(doc, {
    enter(node) {
      if (doc.type(node) !== "raw") return;
      const { format, value, range } = doc.data(node, "raw");
      if (format !== "html") return;
      const [first] = scan(value);
      const name = first?.name === "template" ? attribute(first, "element")?.value : undefined;
      if (first?.kind !== "start" || name === undefined) return;
      const source = blankedTo(doc.source, value, range.start);
      const line = at(range.start + first.start).line;
      const problem = nameProblem(name);
      if (problem) throw new FileError(file, `line ${line}: ${problem}`);
      found.push({ node, element: readElement(file, SCOPE, source, name), line });
    },
  });
  return found;
}

/** @prose
 * The page blanked but for one block's content, so each offset in it is the page's. A block inside
 * a list or a quote has its prefixes taken out of its value, so it's put on its lines instead.
 */
function blankedTo(source: string, value: string, start: number): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  if (source.startsWith(value, start)) {
    return blank(source.slice(0, start)) + value + blank(source.slice(start + value.length));
  }
  return "\n".repeat(source.slice(0, start).split("\n").length - 1) + value;
}

/** @prose
 * Each `@x-tag.html` in the site under `root`, read and checked, with what the site skips skipped
 * (`site.ts`). Two files for one name fail at the second, in sorted order, so the same one fails on
 * every run.
 */
function readFiles(root: string): Map<string, ElementFile> {
  const elements = new Map<string, ElementFile>();
  const files = siteFiles(root).filter((file) => /^@.*\.html$/.test(basename(file)));
  for (const file of files) {
    const name = nameOf(file);
    const problem = nameProblem(name);
    if (problem) throw new FileError(file, `${problem} An element's file is named for it.`);
    const other = elements.get(name);
    if (other) {
      throw new FileError(
        file,
        `<${name}> is also in ${relative(root, other.file)}. A name has one definition, wherever it sits. Remove one, or rename the element.`,
      );
    }
    elements.set(name, readElement(file, SCOPE));
  }
  return elements;
}

// A custom element's name: lowercase, starting with a letter, with a hyphen.
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
// Names HTML keeps for its own elements, which `customElements.define` refuses.
const RESERVED = new Set([
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
]);

/** What's wrong with an element's name, if anything. */
export function nameProblem(name: string): string | undefined {
  if (name !== name.toLowerCase() && NAME.test(name.toLowerCase())) {
    return `${name} has capitals, and an element's name is lowercase, as a tag is. Write ${name.toLowerCase()}.`;
  }
  if (!NAME.test(name)) {
    return `${name} isn't an element's name, which is lowercase, starts with a letter and has a hyphen, as in call-out.`;
  }
  if (RESERVED.has(name)) {
    return `${name} is a name HTML keeps for its own elements. Rename the element.`;
  }
  return undefined;
}
