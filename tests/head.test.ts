/** @prose
 * # The frame and the head
 *
 * What fails a frame, each with the line to add or remove, and the metadata the head reads. Then
 * what Pagez writes in a page's head, which is the page's lang, title and description in place of
 * the frame's, and the tags that follow.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { FileError } from "../src/elements/errors.ts";
import {
  addToHead,
  headFields,
  MINIMAL,
  pageHead,
  readFrame,
  SLOT,
  type Metadata,
} from "../src/head.ts";

const frame = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Site</title>
    <meta name="description" content="The site's own." />
  </head>
  <body>
    <main><slot></slot></main>
  </body>
</html>
`;

function read(html?: string) {
  const dir = mkdtempSync(join(tmpdir(), "pagez-"));
  if (html !== undefined) writeFileSync(join(dir, "frame.html"), html);
  try {
    return readFrame(html === undefined ? undefined : join(dir, "frame.html"));
  } catch (error) {
    if (error instanceof FileError) return error;
    throw error;
  }
}

const html = (frame?: string) => (read(frame) as { html: string }).html;

describe("readFrame", () => {
  test("is the frame beside the page, with a marker where the page goes", () => {
    const result = read(frame);
    expect(result).not.toBeInstanceOf(Error);
    expect((result as { file: string }).file).toMatch(/frame\.html$/);
    expect(html(frame)).toContain(`<main>${SLOT}</main>`);
    expect(html(frame)).not.toContain("<slot>");
  });

  test("is the minimal document when there's no frame", () => {
    const result = read();
    expect(result).toEqual({ html: MINIMAL.replace("<slot></slot>", SLOT) });
  });

  test("takes a slot written with its end tag, or with a slash", () => {
    for (const slot of ["<slot></slot>", "<slot> </slot>", "<slot />"]) {
      expect(html(frame.replace("<slot></slot>", slot))).toContain(`<main>${SLOT}</main>`);
    }
  });

  test("needs no title or description of its own", () => {
    const bare = frame.replace(/ *<title>.*\n/, "").replace(/ *<meta name="description".*\n/, "");
    expect(read(bare)).not.toBeInstanceOf(Error);
  });

  test.each([
    [
      "no lang",
      frame.replace(' lang="en"', ""),
      /^<html> has no lang\. Add it, such as <html lang="en">/,
    ],
    ["an empty lang", frame.replace('lang="en"', 'lang=""'), /^<html> has no lang/],
    [
      "no charset",
      frame.replace('    <meta charset="utf-8" />\n', ""),
      /^there's no charset\. Add <meta charset="utf-8" \/>/,
    ],
    [
      "no viewport",
      frame.replace(/ *<meta name="viewport".*\n/, ""),
      /^there's no viewport\. Add <meta name="viewport" content="width=device-width, initial-scale=1" \/>/,
    ],
    ["no slot", frame.replace("<slot></slot>", ""), /^there's no <slot><\/slot>\./],
    ["two slots", frame.replace("</main>", "</main><slot></slot>"), /^line 10: there are 2 slots/],
    [
      "a canonical link",
      frame.replace("</head>", '<link rel="canonical" href="/" /></head>'),
      /^line 8: this writes a canonical link, but Pagez writes it, from the page's url\. Remove <link rel="canonical" href="\/" \/>$/,
    ],
    [
      "an Open Graph tag",
      frame.replace("</head>", '<meta property="og:title" content="x" /></head>'),
      /^line 8: this writes an Open Graph tag.*Remove <meta property="og:title" content="x" \/>$/,
    ],
    [
      "a Twitter tag",
      frame.replace("</head>", '<meta name="twitter:card" content="summary" /></head>'),
      /^line 8: this writes a Twitter tag/,
    ],
  ])("fails on %s, naming frame.html", (_, source, message) => {
    const error = read(source);
    expect(error).toBeInstanceOf(FileError);
    expect((error as FileError).file).toMatch(/frame\.html$/);
    expect((error as FileError).message).toMatch(message);
  });

  test("keeps a social tag Pagez doesn't write, such as the site's Twitter handle", () => {
    const source = frame.replace(
      "</head>",
      '<meta name="twitter:site" content="@x" /><meta property="og:locale" content="en_IN" /></head>',
    );
    expect(read(source)).not.toBeInstanceOf(Error);
  });

  test("sees a tag in a comment or a script as text", () => {
    const source = frame.replace(
      "</body>",
      '<!-- <link rel="canonical" href="/"> --><script>"<meta property=og:x>"</script></body>',
    );
    expect(read(source)).not.toBeInstanceOf(Error);
  });
});

describe("headFields", () => {
  const fields = (page: Metadata) => {
    try {
      return headFields("page.md", page);
    } catch (error) {
      if (error instanceof FileError) return error.message;
      throw error;
    }
  };

  test("reads the keys the head needs, and passes every other key by", () => {
    expect(fields({ title: "A", description: "B", lang: "fr", date: 2026, tags: ["x"] })).toEqual({
      title: "A",
      description: "B",
      lang: "fr",
    });
  });

  test("resolves a relative image against url, and keeps a full one", () => {
    const url = "https://example.com/essays/fish/";
    expect(fields({ url, image: "cover.svg" })).toMatchObject({
      image: "https://example.com/essays/fish/cover.svg",
    });
    expect(fields({ url, image: "../art/c.png" })).toMatchObject({
      image: "https://example.com/essays/art/c.png",
    });
    expect(fields({ image: "https://cdn.example.com/c.png" })).toMatchObject({
      image: "https://cdn.example.com/c.png",
    });
  });

  test.each([
    [{ title: 3 }, /^title is 3, and it must be text/],
    [{ description: "  " }, /^description is "  "/],
    [{ lang: null }, /^lang is null/],
    [{ url: "/essays/" }, /^url is \/essays\/, and it must be the page's full address/],
    [{ image: "cover.svg" }, /^image is cover\.svg, and Open Graph needs a full address/],
  ])("fails on %j", (page, message) => {
    expect(fields(page)).toMatch(message);
  });
});

describe("pageHead", () => {
  const framed = html(frame);
  const minimal = html();
  const lines = (out: string) =>
    out
      .slice(out.indexOf("<head>") + 6, out.indexOf("</head>"))
      .trim()
      .split("\n")
      .map((line) => line.trim());

  test("puts the page's lang, title and description in place of the frame's", () => {
    const out = pageHead(
      framed,
      { lang: "fr", title: "About & me", description: 'Who "I" am' },
      "x",
    );
    expect(out).toContain('<html lang="fr">');
    expect(out).toContain("<title>About &amp; me</title>");
    expect(out).toContain('<meta name="description" content="Who &quot;I&quot; am" />');
    expect(out).not.toContain("My Site");
  });

  test("keeps the frame's own for a page that sets neither, and says the same in the social tags", () => {
    const out = pageHead(framed, {}, "First heading");
    expect(out).toContain("<title>My Site</title>");
    expect(out).toContain('<meta property="og:title" content="My Site" />');
    expect(out).toContain('<meta property="og:description" content="The site\'s own." />');
  });

  test("writes every field into the minimal document, in order", () => {
    const out = pageHead(
      minimal,
      {
        title: "Fish & Chips <tonight>",
        description: "Every field.",
        url: "https://example.com/essays/fish/",
        image: "https://example.com/essays/fish/cover.svg",
      },
      "x",
    );
    expect(lines(out)).toEqual([
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      '<meta name="color-scheme" content="light dark" />',
      "<title>Fish &amp; Chips &lt;tonight&gt;</title>",
      '<meta name="description" content="Every field." />',
      '<link rel="canonical" href="https://example.com/essays/fish/" />',
      '<meta property="og:title" content="Fish &amp; Chips &lt;tonight&gt;" />',
      '<meta property="og:description" content="Every field." />',
      '<meta property="og:url" content="https://example.com/essays/fish/" />',
      '<meta property="og:image" content="https://example.com/essays/fish/cover.svg" />',
      '<meta property="og:type" content="website" />',
      '<meta name="twitter:card" content="summary_large_image" />',
    ]);
  });

  test("titles a page with no title by its fallback, and leaves out what needs a url", () => {
    expect(lines(pageHead(minimal, {}, "Untitled")).slice(3)).toEqual([
      "<title>Untitled</title>",
      '<meta property="og:title" content="Untitled" />',
      '<meta property="og:type" content="website" />',
      '<meta name="twitter:card" content="summary" />',
    ]);
  });

  test("fills a frame's empty title with the fallback", () => {
    const out = pageHead(html(frame.replace("My Site", "")), {}, "Untitled");
    expect(out).toContain("<title>Untitled</title>");
  });
});

describe("addToHead", () => {
  test("puts the lines before </head>, indented one step more", () => {
    expect(addToHead("<html>\n  <head>\n  </head>\n</html>", "<a>\n<b>")).toBe(
      "<html>\n  <head>\n    <a>\n    <b>\n  </head>\n</html>",
    );
  });

  test("puts them after the last head tag when a frame has no </head>", () => {
    const bare = '<html lang="en"><meta charset="utf-8"><title>T</title><p>Hi</p>';
    expect(addToHead(bare, "<b>")).toBe(
      '<html lang="en"><meta charset="utf-8"><title>T</title>\n<b><p>Hi</p>',
    );
  });
});
