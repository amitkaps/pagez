/** @prose
 * # A page, compiled
 *
 * One Markz file in, its parts out: the page in its frame with its head written, and its CSS. The
 * command writes the parts as one standalone file (`standalone.ts`), and Sitez will give them to
 * Vite. This is the compiler without elements or `${…}`, which Markz writes as code for now.
 *
 * The page is Markz's own HTML with one change, made in the AST so nothing else moves. Each
 * `=html` block loses its `<style>` elements, which are the page's CSS, and the rest of it is
 * written as it is. A relative image must be beside the page, and fails at its line when it isn't,
 * so a missing file is found by the compiler and not by whatever inlines it.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import {
  headings,
  html,
  parse,
  position,
  walk,
  type Document,
  type NodeData,
  type NodeId,
} from "@amitkaps/markz";
import { FileError } from "./elementz/errors.ts";
import { scan } from "./elementz/markup.ts";
import { headFields, pageHead, readFrame, SLOT } from "./head.ts";
import { isRelative } from "./standalone.ts";

/** A page's parts. */
export interface Page {
  /** The page, as an absolute path. */
  file: string;
  /** The page in its frame, with its head written, and none of its CSS. */
  html: string;
  /** @prose
   * The CSS for the head, in order. With no frame, Pagez's reset and prose come first. Then each
   * of the page's `<style>` blocks, as written, so each keeps its own `@import` at its top.
   */
  css: string[];
}

/** Pagez's reset and prose, which a page with no frame gets. */
const BASE = ["reset.css", "prose.css"].map((name) =>
  readFileSync(new URL(`../css/${name}`, import.meta.url), "utf8"),
);

/** The page at `file`, compiled into its parts. A mistake in it throws a `FileError`. */
export function compile(file: string): Page {
  const dir = dirname(file);
  const doc = parse(readFileSync(file, "utf8"));
  const line = (offset: number) => position(doc.source)(offset).line;
  const css: string[] = [];
  const swapped = new Map<NodeId, object>();

  walk(doc, {
    enter(node) {
      const type = doc.type(node);
      if (type === "image") {
        const { destination, destinationRange } = doc.data(node, "image");
        const path = destination.split(/[?#]/)[0]!;
        if (isRelative(destination) && !existsSync(join(dir, decodeURI(path)))) {
          throw new FileError(
            file,
            `line ${line(destinationRange.start)}: ${destination} isn't beside the page. Add the file, or fix the path.`,
          );
        }
      }
      if (type === "raw") {
        const { format, value } = doc.data(node, "raw");
        if (format !== "html") return;
        const { styles, rest } = takeStyles(value);
        if (styles.length === 0) return;
        css.push(...styles);
        swapped.set(node, { value: rest.trim() === "" ? "" : rest });
      }
    },
  });

  const frame = readFrame(dir);
  const fields = headFields(file, doc.metadata ?? {});
  const fallback = headings(doc)[0]?.text ?? basename(file, extname(file));
  const body = html(view(doc, swapped)).trimEnd();
  return {
    file,
    html: pageHead(frame.html, fields, fallback).replace(SLOT, () => (body ? `\n${body}\n` : "")),
    css: frame.file ? css : [...BASE, ...css],
  };
}

/** A raw block's `<style>` contents, and the block without them. */
function takeStyles(value: string): { styles: string[]; rest: string } {
  const styles: string[] = [];
  let rest = "";
  let from = 0;
  const tags = scan(value);
  for (const [i, tag] of tags.entries()) {
    if (tag.kind !== "start" || tag.name !== "style") continue;
    const close = tags.slice(i + 1).find((t) => t.kind === "end" && t.name === "style");
    const end = close?.end ?? value.length;
    styles.push(value.slice(tag.end, close?.start ?? value.length));
    rest += value.slice(from, tag.start);
    // The line the style was on goes with it.
    from = value.startsWith("\n", end) ? end + 1 : end;
  }
  return { styles, rest: rest + value.slice(from) };
}

/** @prose
 * The document as `html()` reads it, with each swapped node's data overlaid, as Sitez's renderer
 * does. Everything else reads through to the document.
 */
function view(doc: Document, swapped: Map<NodeId, object>): Document {
  if (swapped.size === 0) return doc;
  return new Proxy(doc, {
    get(target, key) {
      if (key === "data") {
        return (node: NodeId, type: keyof NodeData) => {
          const data = target.data(node, type);
          const swap = swapped.get(node);
          return swap === undefined ? data : { ...data, ...swap };
        };
      }
      const value: unknown = Reflect.get(target, key, target);
      // Document's accessors read private fields, so they run on the document itself.
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
