/** @prose
 * # A page, compiled
 *
 * One Markz page in, its parts out: the page in its frame with its head written, Pagez's CSS, and
 * the stylesheets it links. `write` puts them together as the `index.html` the command writes
 * beside the page ([The folder](../docs/design.md#the-folder)), and Sitez will give them to Vite.
 * This is the compiler without elements or `${…}`, which Markz writes as code for now.
 *
 * The page is Markz's own HTML, raw `=html` blocks included, as written. Its references stay as
 * written too, and each must be there. A relative image in the Markdown fails at its line. One in
 * raw HTML or a stylesheet fails naming it, and one in the frame at the frame's line.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { headings, html, parse, position, walk } from "@amitkaps/markz";
import { FileError } from "./elements/errors.ts";
import { addToHead, headFields, pageHead, readFrame, SLOT } from "./head.ts";
import { checkCss, checkHtml, exists, isRelative } from "./references.ts";

/** A page's parts. */
export interface Page {
  /** The page, as an absolute path. */
  file: string;
  /** The page in its frame, with its head written, and none of its CSS. */
  html: string;
  /** Pagez's CSS, for a `<style>` in the head: the reset and prose, unless the page has its own. */
  css: string[];
  /** The stylesheets the head links after it, as written: `style.css`, when the page has one. */
  links: string[];
}

/** Pagez's reset and prose, which a page with no CSS of its own gets. */
const BASE = ["reset.css", "prose.css"].map((name) =>
  readFileSync(new URL(`../css/${name}`, import.meta.url), "utf8"),
);

const DARK = /\n *<meta name="color-scheme" content="light dark" \/>/;

/** The page at `file`, compiled into its parts. A mistake in it throws a `FileError`. */
export function compile(file: string): Page {
  const dir = dirname(file);
  const doc = parse(readFileSync(file, "utf8"));
  walk(doc, {
    enter(node) {
      if (doc.type(node) !== "image") return;
      const { destination, destinationRange } = doc.data(node, "image");
      if (!isRelative(destination) || exists(dir, destination)) return;
      const { line } = position(doc.source)(destinationRange.start);
      throw new FileError(
        file,
        `line ${line}: ${destination} isn't there. Add the file, or fix the path.`,
      );
    },
  });

  const body = html(doc).trimEnd();
  checkHtml(file, dir, body);
  const frame = readFrame(dir);
  if (frame.file) checkHtml(frame.file, dir, frame.html, true);
  const style = join(dir, "style.css");
  const styled = existsSync(style);
  if (styled) checkCss(style, dir, readFileSync(style, "utf8"));

  // The page's own CSS says whether it has a dark mode, which prose's does.
  const shell = styled && !frame.file ? frame.html.replace(DARK, "") : frame.html;
  const fields = headFields(file, doc.metadata ?? {});
  const fallback = headings(doc)[0]?.text ?? basename(file, extname(file));
  return {
    file,
    html: pageHead(shell, fields, fallback).replace(SLOT, () => (body ? `\n${body}\n` : "")),
    css: frame.file || styled ? [] : BASE,
    links: styled ? ["style.css"] : [],
  };
}

/** @prose
 * The page as one HTML document: Pagez's CSS in a `<style>` in the head, since it isn't a file
 * beside the page, then a `<link>` to each stylesheet, so the page's own CSS comes last.
 */
export function write(page: Page): string {
  const lines = [
    ...page.css.map((css) => `<style>\n${indent(css.trim())}\n</style>`),
    ...page.links.map((href) => `<link rel="stylesheet" href="${href}" />`),
  ];
  return lines.length > 0 ? addToHead(page.html, lines.join("\n")) : page.html;
}

const indent = (css: string) => css.replace(/^(?=.)/gm, "  ");
