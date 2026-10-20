/** @prose
 * # Elements in HTML
 *
 * An element is the same everywhere (rule 5). One in text, in the host's frame or in another
 * element's output renders the same way. This file renders the last two, and a host's text calls
 * `renderElement` for each element its Markz wrote.
 *
 * An element's template writes the inside of its tag, and this writes the tag around it
 * ([elements.md](../../docs/elements.md#element-wrap)). The template gets `attrs`, the host's context
 * and its script's names. Its content goes where its `<slot>` is, and the slot's own content is
 * the fallback for an element with none. What an element writes is read for elements too, until
 * none is left.
 *
 * Content is already rendered when an element is called. It goes into the slot as a marker, which
 * is put back once the element's output has rendered. So the output is read for the elements it
 * wrote, never the ones it was handed, and an element isn't rendered twice. An element that ends
 * up inside itself would never end, so it fails, naming the chain.
 */
import { parseAst } from "vite-plus";
import { FileError } from "./errors.ts";
import type { ElementFile } from "./file.ts";
import { lineOf, namedSlot, templateModule } from "./file.ts";
import { html } from "./html.ts";
import { attribute, decode, encode, scan, type Tag } from "./markup.ts";
import { render, type TemplateError } from "./render.ts";

/** What rendering an element needs from its host. */
export interface Host {
  /** Every element, by tag. */
  elements: Map<string, ElementFile>;
  /** The module of an element's template (`templateModule`), whose default export renders it. */
  load(element: ElementFile): Promise<Record<string, unknown>>;
  /** What the host adds to every template's scope, such as `page`. */
  context: Record<string, unknown>;
}

let counter = 0;

/** @prose
 * What an element writes inside its tag, for these attributes and this content.
 *
 * An attribute is a string, as HTML has it, or any value a host gives, such as a list from the
 * page's metadata. `content` is HTML that is already rendered, or nothing for an element with none.
 * `chain` is the elements this one is inside, by their output. An element with no template writes its content as it is.
 */
export async function renderElement(
  host: Host,
  name: string,
  attributes: Record<string, unknown>,
  content: string | undefined,
  chain: string[],
): Promise<string> {
  const element = host.elements.get(name);
  if (!element) throw new Error(`<${name}> has no element file`);
  if (!element.template) return content ?? "";
  const { file } = element;
  const id = counter++;
  const token = `<pagez-content-${id}></pagez-content-${id}>`;
  const module = await host.load(element);
  const fn = module.default as (scope: object) => unknown;
  const fix = module.fix as ((error: Error) => void) | undefined;
  const out = inSlot(
    element,
    rendered(element, () => fn({ ...host.context, attrs: attributes, html }), fix),
    content && token,
  );
  const written = await renderElements(host, out, file, [...chain, name]);
  return written.replaceAll(token, () => content ?? "");
}

/** @prose
 * A template that throws is a mistake in the site, not in Pagez. So the build fails naming the
 * element's file, and the line when its stack has it.
 *
 * The module's lines are the file's, so it's the line the author wrote, once the host has mapped
 * the stack to the module. A template the renderer refuses says why in its own words, at the line
 * of the value it refused. The result is
 * trimmed, so a template written across lines can still sit inside a paragraph.
 */
function rendered(element: ElementFile, fn: () => unknown, fix?: (error: Error) => void): string {
  const { file } = element;
  try {
    return render(fn()).trim();
  } catch (error) {
    if (error instanceof FileError) throw error;
    const { name, message } = error instanceof Error ? error : { name: "", message: String(error) };
    if (name === "TemplateError") {
      const line = valueLine(element, (error as TemplateError).in, fix);
      // Its stack is the renderer's, which says nothing the message doesn't.
      throw new FileError(
        (error as TemplateError).id,
        file,
        `${line ? `line ${line}: ` : ""}${message}`,
      );
    }
    const line = lineIn(file, error);
    const at = line ? `line ${line}: ` : "";
    throw new FileError("error-template-render", file, `${at}failed to render: ${message}`, {
      cause: error,
    });
  }
}

/** @prose
 * The line of the value a template failed at. The stack of its `html` call names the call's line,
 * and the template literal there, in the element's module, has each value's own. A template
 * written in another module names no line.
 */
function valueLine(
  element: ElementFile,
  at: TemplateError["in"],
  fix?: (error: Error) => void,
): number | undefined {
  if (!at?.template.called) return undefined;
  fix?.(at.template.called);
  const line = lineIn(element.file, at.template.called);
  if (!line) return undefined;
  const code = templateModule(element, []);
  const literal = taggedTemplates(parseAst(code, { lang: "js" })).find(
    (node) =>
      lineOf(code, node.start) === line && node.quasi.quasis.length === at.template.strings.length,
  );
  const value = literal?.quasi.expressions[at.index];
  return value ? lineOf(code, value.start) : line;
}

/** Each tagged template in a parsed module, in no particular order. */
function taggedTemplates(node: unknown, found: TaggedTemplate[] = []): TaggedTemplate[] {
  if (Array.isArray(node)) {
    for (const item of node) taggedTemplates(item, found);
  } else if (node && typeof node === "object") {
    if ((node as { type?: unknown }).type === "TaggedTemplateExpression") {
      found.push(node as TaggedTemplate);
    }
    for (const value of Object.values(node)) taggedTemplates(value, found);
  }
  return found;
}

/** The part of a tagged template's node that names where its values are. */
interface TaggedTemplate {
  start: number;
  quasi: { quasis: unknown[]; expressions: { start: number }[] };
}

/** The line of `file` an error's stack names first, read past the query of a part's module. */
function lineIn(file: string, error: unknown): number | undefined {
  const stack = (error as { stack?: unknown } | null)?.stack;
  if (typeof stack !== "string") return undefined;
  const path = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = new RegExp(`${path}(?:\\?[^\\s:)]*)?:(\\d+):\\d+`).exec(stack);
  return found ? Number(found[1]) : undefined;
}

/** @prose
 * An element's content goes where its `<slot>` is, in place of the slot's own content, which is the
 * fallback.
 *
 * The slot is found in what the template wrote, so one in a helper's `html` counts. An element
 * given content with no slot would lose it, and one with two would repeat it. So either fails, as a
 * frame that did either would.
 */
function inSlot(element: ElementFile, out: string, content: string | undefined): string {
  const { file, name } = element;
  const tags = scan(out);
  const slots = tags.filter((tag) => tag.kind === "start" && tag.name === "slot");
  if (slots.some((slot) => attribute(slot, "name")))
    throw new FileError("error-slot-named", file, namedSlot);
  if (content !== undefined && slots.length === 0) {
    throw new FileError(
      "error-slot-missing",
      file,
      `<${name}> is given content, and its template has no <slot></slot> for it. Write one where the content goes.`,
    );
  }
  if (slots.length > 1) {
    throw new FileError(
      "error-slot-two",
      file,
      `the template writes ${slots.length} slots, and <${name}>'s content goes in one. Keep a single <slot></slot>.`,
    );
  }
  const [slot] = slots;
  if (!slot) return out;
  const close = slot.selfClosing
    ? undefined
    : tags.find((tag) => tag.kind === "end" && tag.name === "slot" && tag.start >= slot.end);
  const fallback = close ? out.slice(slot.end, close.start) : "";
  return out.slice(0, slot.start) + (content ?? fallback) + out.slice(close?.end ?? slot.end);
}

interface Node {
  name: string;
  open: Tag;
  close?: Tag;
  inside: Node[];
}

/** @prose
 * `html` with each element in it rendered, innermost first.
 *
 * Only a tag with an element file is an element. One with a hyphen and no file is plain HTML, and
 * so is a tag with none. Both are left as written, with whatever elements they hold rendered.
 * `file` is what wrote `html`, which a failure names, and `chain` is the elements it is the output
 * of.
 */
export async function renderElements(
  host: Host,
  html: string,
  file: string,
  chain: string[],
): Promise<string> {
  const top = nodes(host, html, file);
  if (top.length === 0) return html;
  const render = async (list: Node[], from: number, to: number): Promise<string> => {
    let out = "";
    let at = from;
    for (const node of list) {
      out += html.slice(at, node.open.start);
      const close = node.close!;
      const inner =
        close === node.open ? "" : await render(node.inside, node.open.end, close.start);
      at = close.end;
      out += await written(host, node, inner, file, chain);
    }
    return out + html.slice(at, to);
  };
  return render(top, 0, html.length);
}

/** The elements at the top of `html`, each holding the ones inside it. */
function nodes(host: Host, html: string, file: string): Node[] {
  const top: Node[] = [];
  const open: Node[] = [];
  for (const tag of scan(html)) {
    if (!host.elements.has(tag.name)) continue;
    if (tag.kind === "start") {
      const node: Node = { name: tag.name, open: tag, inside: [] };
      (open.at(-1)?.inside ?? top).push(node);
      if (tag.selfClosing) node.close = tag;
      else open.push(node);
      continue;
    }
    const at = open.findLastIndex((node) => node.name === tag.name);
    if (at === -1) continue;
    if (at < open.length - 1) throw unclosed(file, open[at + 1]!);
    open.pop()!.close = tag;
  }
  if (open.length > 0) throw unclosed(file, open.at(-1)!);
  return top;
}

function unclosed(file: string, node: Node): FileError {
  return new FileError(
    "error-element-unclosed",
    file,
    `<${node.name}> is never closed. Write </${node.name}> after its content, or <${node.name} /> if it has none.`,
  );
}

/** One element, written with its own tag and attributes around what its template writes. */
async function written(
  host: Host,
  node: Node,
  inner: string,
  file: string,
  chain: string[],
): Promise<string> {
  const { name } = node;
  if (chain.includes(name)) {
    throw new FileError(
      "error-element-inside-itself",
      file,
      `this writes <${name}>, which ends up inside itself: ${[...chain, name].map((tag) => `<${tag}>`).join(" → ")}. Remove one of them, or the element would never finish.`,
    );
  }
  const attributes: Record<string, string> = {};
  for (const { name: key, value } of node.open.attributes) {
    if (!(key in attributes)) attributes[key] = decode(value ?? "");
  }
  const content = inner.trim() === "" ? undefined : inner;
  const out = await renderElement(host, name, attributes, content, chain);
  return `${openTag(name, attributes)}${out}</${name}>`;
}

/** @prose
 * An element's opening tag, as Markz writes one, with `class` first, a bare attribute with no `=`,
 * and a value escaped. The element is written here, not by Markz, since its inside is the
 * template's.
 *
 * Only text reaches the browser, as in a template's attribute. A string or a number is written,
 * `true` is bare, and anything else, such as a list, went to the template alone.
 */
export function openTag(name: string, attributes: Record<string, unknown>): string {
  const { class: classes, ...others } = attributes;
  const written = Object.entries(
    classes === undefined ? others : { class: classes, ...others },
  ).flatMap(([key, value]) => {
    if (value === "" || value === true) return [key];
    if (typeof value === "string" || typeof value === "number") {
      return [`${key}="${encode(String(value))}"`];
    }
    return [];
  });
  return `<${[name, ...written].join(" ")}>`;
}
