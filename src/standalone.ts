/** @prose
 * # One standalone file
 *
 * A page's parts written as one HTML file that works with nothing beside it, opened from disk or
 * offline ([Standalone](../docs/design.md#standalone)). Its CSS goes in the head, one `<style>`
 * for each part, and every reference to a file beside the page is inlined as a data URL. That's
 * a `src` or a `poster` in the HTML, and an `@import` or a `url()` in its CSS, the frame's own
 * included. A CSS file is inlined with its own references inlined first, as an `@import` of a
 * data URL, which keeps its place in the cascade and its `layer()` or media. An `@import` that
 * doesn't start with `.` names a package, as a script's `import` does, and is found in the
 * `node_modules` beside the page.
 *
 * A full URL is left as written, as is a path from the site's root and a link's `href`, which are
 * a site's. A `<script>`'s `src` waits for the bundler, which inlines a script with its imports.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { FileError } from "./elementz/errors.ts";
import { attribute, decode, encode, scan, withValue } from "./elementz/markup.ts";
import { addToHead } from "./head.ts";
import type { Page } from "./page.ts";

/** Whether a reference names a file beside the page: not a URL, a site's path or a fragment. */
export function isRelative(reference: string): boolean {
  return reference !== "" && !/^([a-z][a-z\d+.-]*:|[/#?])/i.test(reference);
}

/** The page as one file. A reference to a file that isn't there throws a `FileError`. */
export function standalone(page: Page): string {
  const dir = dirname(page.file);
  const styles = page.css.map((css) => `<style>\n${indent(dedent(css))}\n</style>`);
  const out = styles.length > 0 ? addToHead(page.html, styles.join("\n")) : page.html;
  return inlineHtml(page.file, dir, out);
}

/** CSS without the blank lines around it, or the indent its lines share, so the head indents it. */
function dedent(css: string): string {
  const lines = css.replace(/^\s*\n|\s+$/g, "").split("\n");
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => /^[ \t]*/.exec(l)![0].length),
  );
  return lines.map((line) => line.slice(indent)).join("\n");
}

const indent = (css: string) => css.replace(/^(?=.)/gm, "  ");

/** Each `<style>`'s CSS and each `src` and `poster` in `html`, inlined, last first. */
function inlineHtml(file: string, dir: string, html: string): string {
  const tags = scan(html);
  let out = html;
  for (let i = tags.length - 1; i >= 0; i--) {
    const tag = tags[i]!;
    if (tag.kind !== "start") continue;
    if (tag.name === "style") {
      const close = tags.slice(i + 1).find((t) => t.kind === "end" && t.name === "style");
      if (!close) continue;
      const css = out.slice(tag.end, close.start);
      out = out.slice(0, tag.end) + inlineCss(file, dir, css) + out.slice(close.start);
      continue;
    }
    if (tag.name === "script") continue;
    for (const name of ["poster", "src"]) {
      const found = attribute(tag, name);
      if (!found?.value || !isRelative(decode(found.value))) continue;
      out = withValue(out, found, encode(dataUrl(file, dir, decode(found.value))));
    }
  }
  return out;
}

const IMPORT = /@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1\s*\)?/g;
const URL_FUNCTION = /url\(\s*(["']?)([^"')\s]+)\1\s*\)/g;

/** `css` from `dir`, with each `@import` and `url()` of a file inlined. */
function inlineCss(file: string, dir: string, css: string): string {
  return css
    .replace(IMPORT, (written, _, path: string) => {
      if (!isRelative(path)) return written;
      const at = path.startsWith(".") ? resolve(dir, path) : packageFile(file, dir, path);
      const inlined = inlineCss(file, dirname(at), read(file, at, path).toString("utf8"));
      return `@import url("data:text/css;base64,${Buffer.from(inlined).toString("base64")}")`;
    })
    .replace(URL_FUNCTION, (written, _, path: string) =>
      isRelative(path) ? `url("${dataUrl(file, dir, path)}")` : written,
    );
}

/** A package's file, such as `@amitkaps/pagez/prose.css`, from the `node_modules` beside `dir`. */
function packageFile(file: string, dir: string, specifier: string): string {
  try {
    return createRequire(join(dir, "noop.js")).resolve(specifier);
  } catch {
    throw new FileError(
      file,
      `${specifier} isn't installed beside the page. Install it, or write a path that starts with ./ for a file.`,
    );
  }
}

const TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css",
  ".csv": "text/csv",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".vtt": "text/vtt",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** A file beside `dir` as a data URL, its type from its extension. */
function dataUrl(file: string, dir: string, reference: string): string {
  const path = decodeURI(reference.split(/[?#]/)[0]!);
  const type = TYPES[extname(path).toLowerCase()];
  if (!type) {
    throw new FileError(
      file,
      `${reference} can't be inlined, since Pagez doesn't know its type. Use a common format, such as .svg, .png or .woff2.`,
    );
  }
  const data = read(file, resolve(dir, path), reference).toString("base64");
  return `data:${type};base64,${data}`;
}

function read(file: string, path: string, reference: string): Buffer {
  try {
    return readFileSync(path);
  } catch {
    throw new FileError(file, `${reference} isn't beside the page. Add the file, or fix the path.`);
  }
}
