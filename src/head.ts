/** @prose
 * # The head, and the frame it is in
 *
 * A page's head is its frame's, with what follows from its metadata added. The frame is the
 * `index.html` beside the page, or with none, Pagez's minimal document, so both go through the
 * same code. Each tag has one owner. The frame writes `charset`, `viewport` and everything else
 * it chooses. Pagez puts the page's `lang`, `title` and `description` in place of the frame's, and
 * writes the canonical link and the Open Graph and Twitter tags, which repeat those values and
 * `url` and `image` with no choice in them.
 *
 * A frame fails the build for what would make the page wrong: a missing `lang`, `charset` or
 * `viewport`, a slot count other than one, and a tag Pagez writes. Each message names the frame
 * and shows the line to add or remove, and the line it's on when there is one. Pagez checks nothing else, since it isn't an HTML
 * validator. It moved here from Sitez, which also checked the frame's title and description. A
 * single page needs neither in its frame, since Pagez writes them.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FileError } from "./elementz/errors.ts";
import { attribute, decode, encode, scan, type Attribute, type Tag } from "./elementz/markup.ts";

/** What stands where the page goes, until the page is put there. */
export const SLOT = "<pagez-slot></pagez-slot>";

/** A page's metadata, its frontmatter as Markz read it. */
export type Metadata = Record<string, unknown>;

/** A frame, read and checked. `file` is missing for Pagez's minimal document. */
export interface Frame {
  file?: string;
  /** The frame with its slot replaced by `SLOT`. */
  html: string;
}

/** @prose
 * The minimal document, which a page with no frame is written into. Its `lang` is replaced by the
 * page's, when it has one. Its `color-scheme` lets the browser paint a dark page dark before any
 * CSS, as prose's `color-scheme` then does. The reset and prose are added by the compiler, not written here, since
 * a frame gets neither.
 */
export const MINIMAL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
  </head>
  <body>
    <main><slot></slot></main>
  </body>
</html>
`;

/** The frame beside a page in `dir`, or the minimal document when there's none. */
export function readFrame(dir: string): Frame {
  const file = join(dir, "index.html");
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    return { html: withSlot(MINIMAL, checkFrame("", MINIMAL)) };
  }
  return { file, html: withSlot(source, checkFrame(file, source)) };
}

/** `html` with its one slot replaced by `SLOT`. A slot is a tag and, as written, its end. */
function withSlot(html: string, slot: Tag): string {
  const close = /^\s*<\/slot\s*>/i.exec(html.slice(slot.end));
  return html.slice(0, slot.start) + SLOT + html.slice(slot.end + (close?.[0].length ?? 0));
}

/** @prose
 * What fails a frame, in the order of its head. It returns the slot, so `readFrame` can put a
 * marker there. A tag Pagez writes is shown as the author wrote it, since that's the line to
 * remove.
 */
function checkFrame(file: string, html: string): Tag {
  const tags = scan(html);
  const start = (name: string) => tags.find((tag) => tag.kind === "start" && tag.name === name);
  const fail = (message: string) => new FileError(file, message);
  const line = (tag: Tag) => `line ${html.slice(0, tag.start).split("\n").length}: `;
  if (!attribute(start("html") ?? tags[0]!, "lang")?.value) {
    throw fail(
      `<html> has no lang. Add it, such as <html lang="en">, so screen readers read the page in its language.`,
    );
  }
  if (!tags.some((tag) => tag.name === "meta" && attribute(tag, "charset"))) {
    throw fail(
      `there's no charset. Add <meta charset="utf-8" /> to the head, or accented text garbles.`,
    );
  }
  if (!metaNamed(tags, "viewport")) {
    throw fail(
      `there's no viewport. Add <meta name="viewport" content="width=device-width, initial-scale=1" /> to the head, or a phone zooms out.`,
    );
  }
  const slots = tags.filter((tag) => tag.kind === "start" && tag.name === "slot");
  if (slots.length !== 1) {
    throw fail(
      slots.length === 0
        ? "there's no <slot></slot>. Write it where the page goes, such as <main><slot></slot></main>."
        : `${line(slots[1]!)}there are ${slots.length} slots, and the page goes in one. Keep a single <slot></slot>.`,
    );
  }
  for (const tag of tags) {
    if (tag.kind !== "start") continue;
    const written = html.slice(tag.start, tag.end);
    const rel = decode(attribute(tag, "rel")?.value ?? "").toLowerCase();
    const key = decode(
      attribute(tag, "property")?.value ?? attribute(tag, "name")?.value ?? "",
    ).toLowerCase();
    const [what, from] =
      tag.name === "link" && rel.split(/\s+/).includes("canonical")
        ? ["a canonical link", "the page's url"]
        : tag.name === "meta" && WRITTEN.has(key) && key.startsWith("og:")
          ? ["an Open Graph tag", "the page's metadata"]
          : tag.name === "meta" && WRITTEN.has(key)
            ? ["a Twitter tag", "the page's metadata"]
            : [];
    if (what) {
      throw fail(
        `${line(tag)}this writes ${what}, but Pagez writes it, from ${from}. Remove ${written}`,
      );
    }
  }
  return slots[0]!;
}

/** The social tags Pagez writes. Any other, such as `twitter:site` or `og:locale`, is the frame's. */
const WRITTEN = new Set([
  "og:title",
  "og:description",
  "og:url",
  "og:image",
  "og:type",
  "twitter:card",
]);

const metaNamed = (tags: Tag[], name: string) =>
  tags.find(
    (tag) =>
      tag.kind === "start" &&
      tag.name === "meta" &&
      decode(attribute(tag, "name")?.value ?? "").toLowerCase() === name,
  );

/** The metadata the head is written from, checked. */
export interface HeadFields {
  lang?: string;
  title?: string;
  description?: string;
  url?: string;
  /** Absolute, resolved against `url` when it was written relative. */
  image?: string;
}

/** @prose
 * The keys the head reads, and what each must be. Each is a string with something in it, `url` is
 * a full `http` or `https` address, and `image` is a full address or a path relative to `url`.
 * Open Graph needs a full address, so a relative `image` with no `url` fails rather than being
 * dropped. The image isn't inlined as the page's own files are, since only a crawler reads it, at
 * the page's address. Every other key is the page's own, and passes through unchecked.
 */
export function headFields(file: string, page: Metadata): HeadFields {
  const fields: HeadFields = {};
  for (const key of ["lang", "title", "description", "url", "image"] as const) {
    const value = page[key];
    if (value === undefined) continue;
    if (typeof value !== "string" || value.trim() === "") {
      throw new FileError(
        file,
        `${key} is ${JSON.stringify(value)}, and it must be text. Write it as ${key}: …, or leave the line out.`,
      );
    }
    fields[key] = value;
  }
  if (fields.url !== undefined && !/^https?:\/\/[^/]/i.test(fields.url)) {
    throw new FileError(
      file,
      `url is ${fields.url}, and it must be the page's full address, such as https://example.com/page/.`,
    );
  }
  if (fields.image !== undefined && !/^https?:\/\//i.test(fields.image)) {
    if (fields.url === undefined) {
      throw new FileError(
        file,
        `image is ${fields.image}, and Open Graph needs a full address. Add the page's url, which it's found from, or write the image's full address.`,
      );
    }
    fields.image = new URL(fields.image, fields.url).href;
  }
  return fields;
}

/** @prose
 * A page's head, in the frame. The page's `lang`, `title` and `description` go in place of the
 * frame's, or after its last head tag when the frame has none. A page with no title takes the
 * frame's, and with neither, `fallback`, which is the page's first heading or its file's name, so
 * every page has a `<title>`. Then the canonical link and the social tags go at the end of the
 * head. Those that need a `url` or an `image` are left out without one. A title that is the
 * frame's own is read as the frame wrote it, with its entities, so a social tag says what the
 * page does.
 */
export function pageHead(html: string, fields: HeadFields, fallback: string): string {
  const tags = scan(html);
  const title = tags.find((tag) => tag.kind === "start" && tag.name === "title");
  const titleEnd =
    title &&
    tags.find((tag) => tag.kind === "end" && tag.name === "title" && tag.start > title.end);
  const described = metaNamed(tags, "description");
  const content = described && attribute(described, "content");
  const lang = attribute(
    tags.find((tag) => tag.kind === "start" && tag.name === "html")!,
    "lang",
  )!;

  const framed = title && titleEnd ? html.slice(title.end, titleEnd.start) : undefined;
  const text =
    fields.title !== undefined
      ? encode(fields.title)
      : framed !== undefined && framed.trim() !== ""
        ? framed
        : encode(fallback);
  const description =
    fields.description !== undefined ? encode(fields.description) : content?.value;

  const edits: [number, number, string][] = [];
  if (fields.lang !== undefined) {
    edits.push([lang.valueStart, lang.valueEnd, quoted(lang, encode(fields.lang))]);
  }
  if (title && titleEnd) edits.push([title.end, titleEnd.start, text]);
  if (content && fields.description !== undefined) {
    edits.push([content.valueStart, content.valueEnd, quoted(content, description!)]);
  }
  let out = html;
  for (const [from, to, value] of edits.toSorted((a, b) => b[0] - a[0])) {
    out = out.slice(0, from) + value + out.slice(to);
  }

  const lines: string[] = [];
  if (!(title && titleEnd)) lines.push(`<title>${text}</title>`);
  if (!content && description !== undefined) {
    lines.push(`<meta name="description" content="${description}" />`);
  }
  const url = fields.url && encode(fields.url);
  const image = fields.image && encode(fields.image);
  if (url) lines.push(`<link rel="canonical" href="${url}" />`);
  lines.push(metaTag("property", "og:title", attr(text)));
  if (description !== undefined) lines.push(metaTag("property", "og:description", description));
  if (url) lines.push(metaTag("property", "og:url", url));
  if (image) lines.push(metaTag("property", "og:image", image));
  lines.push(metaTag("property", "og:type", "website"));
  lines.push(metaTag("name", "twitter:card", image ? "summary_large_image" : "summary"));
  return addToHead(out, lines.join("\n"));
}

/** An encoded value as it replaces `found`'s, quoted if it wasn't. */
const quoted = (found: Attribute, value: string) => (found.quoted ? value : `"${value}"`);

/** A `<title>`'s text, which may hold a quote, as an attribute's value. */
const attr = (text: string) => text.replaceAll('"', "&quot;");

const metaTag = (kind: string, key: string, content: string) =>
  `<meta ${kind}="${key}" content="${content}" />`;

/** @prose
 * `html` with `text` at the end of its head. When `</head>` is on a line of its own, the lines go
 * before it, indented one step more than it is. A frame with no `</head>` gets them after its
 * last tag that belongs in the head, which HTML allows.
 */
export function addToHead(html: string, text: string): string {
  const tags = scan(html);
  const close = tags.find((tag) => tag.kind === "end" && tag.name === "head");
  if (!close) {
    const inHead = tags.filter(
      (tag) => tag.kind === "start" && ["meta", "link", "title", "html", "head"].includes(tag.name),
    );
    const last = inHead.at(-1)!;
    const after =
      last.name === "title"
        ? tags.find((tag) => tag.kind === "end" && tag.name === "title" && tag.start > last.end)!
            .end
        : last.end;
    return `${html.slice(0, after)}\n${text}${html.slice(after)}`;
  }
  const lineStart = html.lastIndexOf("\n", close.start) + 1;
  const indent = html.slice(lineStart, close.start);
  if (!/^[ \t]*$/.test(indent)) {
    return `${html.slice(0, close.start)}${text}\n${html.slice(close.start)}`;
  }
  const lines = text.split("\n").map((line) => (line ? `${indent}  ${line}\n` : "\n"));
  return html.slice(0, lineStart) + lines.join("") + html.slice(lineStart);
}
