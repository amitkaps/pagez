/** @prose
 * # The page's text
 *
 * The page as Markz writes it, with three of its nodes Pagez's
 * ([Markz and Pagez](../docs/design.md#what-it-is)): each `${…}` printed from `page`, each
 * element with a definition rendered from it, and each definition's block left out. Everything
 * else is Markz's own HTML, raw `=html` blocks included.
 *
 * It's written in two steps, which keep each exact.
 *
 * 1. Markz writes the HTML from a view of the document. In it, an expression is the text it
 *    prints, a link's destination has its expressions printed, and an element with a definition
 *    is a marker, which Markz writes with no attributes.
 * 2. Each marker is replaced by its element, written with its own name and attributes around what
 *    its template writes. Markers go innermost first, so an element's content is already rendered
 *    when it goes in its slot, nested elements included.
 *
 * An element gets each attribute's value, a list from `${page.tags}` included, and classes
 * accumulate as Markz's do. A hyphenated tag with no definition is written as Markz writes it,
 * and kept for the warning about undefined tags.
 */
import { dirname } from "node:path";
import {
  html,
  position,
  textContent,
  walk,
  type Document,
  type NodeData,
  type NodeId,
} from "@amitkaps/markz";
import type { Definitions } from "./definitions.ts";
import { openTag, renderElement, type Host } from "./elements/elements.ts";
import { FileError, type Problem } from "./elements/errors.ts";
import { attributeValue, interpolated, printed } from "./expressions.ts";
import type { Metadata } from "./head.ts";
import { exists, isRelative, linkTarget, type Links } from "./references.ts";

/** A tag Markz wrote that has a hyphen and no definition, and its line. */
export interface Undefined {
  name: string;
  line: number;
}

/** @prose
 * The page's text as HTML, and its undefined tags.
 *
 * A relative image is checked once its destination is printed, so it fails at its line when it
 * isn't beside the page. So does a link to a page that the site doesn't build, or a path from the
 * root that isn't in `public/`.
 */
export async function textHtml(
  file: string,
  doc: Document,
  page: Metadata,
  { elements, blocks }: Definitions,
  host: Host,
  links: Links,
): Promise<{ html: string; undefined: Undefined[] }> {
  const at = position(doc.source);
  const fail = (offset: number, { id, problem }: Problem) => {
    const { line, column } = at(offset);
    return new FileError(id, file, `line ${line}, column ${column + 1}: ${problem}`);
  };
  const swapped = new Map<NodeId, object>();
  const texts = new Set<NodeId>();
  const markers = new Set<NodeId>();
  const attributes = new Map<NodeId, { key: string; value: string }[]>();
  const headings: NodeId[] = [];
  const found: {
    node: NodeId;
    name: string;
    attributes: Record<string, unknown>;
    data?: { value: unknown };
  }[] = [];
  const undefinedTags: Undefined[] = [];
  const dir = dirname(file);

  walk(doc, {
    enter(node) {
      const type = doc.type(node);
      const items = doc.attributes(node)?.items ?? [];
      if (type === "expression") {
        const { code, range } = doc.data(node, "expression");
        const result = printed(code, page);
        if ("problem" in result) throw fail(range.start, result);
        texts.add(node);
        swapped.set(node, { value: result.text });
        const heading = headingOf(doc, node);
        if (heading !== undefined) headings.push(heading);
        return;
      }
      if (type === "link" || type === "image") {
        const data = doc.data(node, type);
        let { destination } = data;
        if (data.expressions.length > 0) {
          const result = interpolated(destination, page);
          if ("problem" in result) throw fail(data.expressions[0]!.start, result);
          destination = result.text;
          swapped.set(node, { destination });
        }
        const { line } = at(data.destinationRange.start);
        if (type === "image" && isRelative(destination) && !exists(dir, destination)) {
          throw new FileError(
            "error-relative-missing",
            file,
            `line ${line}: ${destination} isn't there. Add the file, or fix the path.`,
          );
        }
        const target = linkTarget(links, dir, destination, type === "link");
        if (target && "problem" in target) {
          throw new FileError(target.id, file, `line ${line}: ${target.problem}`);
        }
      }
      if (type === "raw" && blocks.has(node)) {
        swapped.set(node, { value: "" });
        return;
      }
      if (type === "element") {
        const { name } = doc.data(node, "element");
        if (elements.has(name)) {
          const values: Record<string, unknown> = {};
          for (const item of items) {
            const result = attributeValue(item.value, page);
            if ("problem" in result) throw fail(item.start, result);
            const before = values[item.key];
            values[item.key] =
              item.key === "class" && typeof before === "string"
                ? `${before} ${String(result.value)}`
                : result.value;
          }
          // A data attribute's file is read for the element, and the page doesn't carry it.
          let data: { value: unknown } | undefined;
          if (typeof values.data === "string") {
            const read = host.data(values.data);
            const item = items.findLast((item) => item.key === "data")!;
            if ("problem" in read)
              throw fail(item.start, { ...read, problem: `<${name}> ${read.problem}` });
            data = read;
            delete values.data;
          }
          swapped.set(node, { name: `pagez-element-${found.length}` });
          markers.add(node);
          found.push({ node, name, attributes: values, data });
          return;
        }
        if (name.includes("-")) undefinedTags.push({ name, line: at(doc.start(node)).line });
      }
      if (items.some((item) => item.value.includes("${"))) {
        attributes.set(
          node,
          items.map((item) => {
            const result = interpolated(item.value, page);
            if ("problem" in result) throw fail(item.start, result);
            return { key: item.key, value: result.text };
          }),
        );
      }
    },
  });

  // A heading that prints a value is named for what it prints, not for what's written.
  const base = view(doc, swapped, texts, markers, attributes);
  for (const heading of new Set(headings)) {
    const { idExplicit } = doc.data(heading, "heading");
    if (!idExplicit) swapped.set(heading, { id: slug(textContent(base, heading)) });
  }
  uniqueIds(doc, headings, swapped);

  let out = html(view(doc, swapped, texts, markers, attributes));
  for (let i = found.length - 1; i >= 0; i--) {
    const [open, close] = [`<pagez-element-${i}>`, `</pagez-element-${i}>`];
    const start = out.indexOf(open);
    const end = out.indexOf(close, start);
    const content = out.slice(start + open.length, end);
    const { node, name, attributes: values, data } = found[i]!;
    const inner = await renderElement(
      host,
      name,
      values,
      content.trim() === "" ? undefined : content,
      data,
      [],
    );
    if (doc.data(node, "element").kind === "inline") paragraphSafe(file, doc, node, name, inner);
    out =
      out.slice(0, start) +
      `${openTag(name, values)}${inner}</${name}>` +
      out.slice(end + close.length);
  }
  return { html: out, undefined: undefinedTags };
}

/** The heading a node is inside, if any. */
function headingOf(doc: Document, node: NodeId): NodeId | undefined {
  for (let at = doc.parent(node); at >= 0; at = doc.parent(at)) {
    if (doc.type(at) === "heading") return at;
  }
  return undefined;
}

/** @prose
 * Markz's slug, on the heading's printed text: lowercased, with what isn't a letter, a mark, a
 * digit, a connector, a space or a hyphen taken out, and each space a hyphen. A heading with
 * nothing left is `section`, as in Markz.
 */
function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\p{Alphabetic}\p{M}\p{Nd}\p{Pc} -]/gu, "")
      .replace(/ /g, "-") || "section"
  );
}

/** Each renamed heading's id made unique among the page's, with a number as Markz adds one. */
function uniqueIds(doc: Document, renamed: NodeId[], swapped: Map<NodeId, object>): void {
  const taken = new Set<string>();
  const ids = new Map<NodeId, string>();
  walk(doc, {
    enter(node) {
      if (doc.type(node) !== "heading") return;
      const own = (swapped.get(node) as { id?: string } | undefined)?.id;
      ids.set(node, own ?? doc.data(node, "heading").id);
    },
  });
  for (const [node, id] of ids) if (!renamed.includes(node)) taken.add(id);
  for (const node of new Set(renamed)) {
    const base = ids.get(node)!;
    let id = base;
    for (let n = 1; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    if (id !== doc.data(node, "heading").id) swapped.set(node, { id });
  }
}

/** @prose
 * An inline element's output can't hold a start tag that closes a paragraph
 * ([`element-inline`](../docs/elements.md#element-inline)). These are the tags the HTML parser closes an open
 * `<p>` for, so the build fails exactly where a browser would break the page.
 */
const CLOSING_TAGS =
  "address article aside blockquote center details dialog dir div dl fieldset figcaption figure " +
  "footer header hgroup main menu nav ol p search section summary ul h[1-6] pre listing form li " +
  "dd dt plaintext table hr xmp";
const CLOSES_P = new RegExp(`<(${CLOSING_TAGS.split(" ").join("|")})(?=[\\s/>])`, "i");

function paragraphSafe(file: string, doc: Document, node: NodeId, name: string, out: string): void {
  const tag = CLOSES_P.exec(out)?.[1];
  if (!tag) return;
  const { line } = position(doc.source)(doc.start(node));
  throw new FileError(
    "error-inline-block",
    file,
    `line ${line}: {@${name}} is used inline, but its template writes a <${tag.toLowerCase()}>, which ends a paragraph. Write inline HTML, such as a <span>.`,
  );
}

/** @prose
 * The document as Markz's `html()` reads it, through its public accessors, with each swapped
 * node's data overlaid. An expression reads as text, a marker has no attributes, and a node whose
 * attributes hold `${…}` has them printed. Everything else reads through to the document.
 */
function view(
  doc: Document,
  swapped: Map<NodeId, object>,
  texts: Set<NodeId>,
  markers: Set<NodeId>,
  attributes: Map<NodeId, { key: string; value: string }[]>,
): Document {
  return new Proxy(doc, {
    get(target, key) {
      if (key === "type") {
        return (node: NodeId) => (texts.has(node) ? "text" : target.type(node));
      }
      if (key === "data") {
        return (node: NodeId, type: keyof NodeData) => {
          const swap = swapped.get(node);
          if (texts.has(node)) return swap;
          const data = target.data(node, type);
          return swap === undefined ? data : { ...data, ...swap };
        };
      }
      if (key === "attributes") {
        return (node: NodeId) => {
          if (markers.has(node)) return undefined;
          const items = attributes.get(node);
          const own = target.attributes(node);
          return items && own
            ? { ...own, items: own.items.map((item, i) => ({ ...item, ...items[i] })) }
            : own;
        };
      }
      const value: unknown = Reflect.get(target, key, target);
      // Document's accessors read private fields, so they run on the document itself.
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
