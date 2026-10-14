/** @prose
 * # References
 *
 * A page links the files beside it as they're written ([The folder](../docs/design.md#the-folder)),
 * so Pagez checks that each one is there, and the build fails on one that isn't rather than the
 * page showing a broken image. A reference is a `src` or a `poster`, a `<link>`'s `href`, and an
 * `@import` or a `url()` in CSS, and a link's `href` when it names a file, such as `./data.csv`. A
 * full URL, a path from the site's root and a fragment are left alone, and so is a link to a
 * `.md`, which is another page, checked once a folder builds many.
 *
 * A stylesheet's references are its own, from its folder, as the browser reads them. In CSS, an
 * `@import` that doesn't start with `.` names a package, as a script's `import` does. A
 * folder doesn't serve `node_modules`, so it fails, with the two ways to write it instead.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { FileError } from "./elements/errors.ts";
import { attribute, decode, scan } from "./elements/markup.ts";

/** Whether a reference names a file beside the page: not a URL, a site's path or a fragment. */
export function isRelative(reference: string): boolean {
  return reference !== "" && !/^([a-z][a-z\d+.-]*:|[/#?])/i.test(reference);
}

/** Whether the file a relative reference names, from `dir`, is there. */
export function exists(dir: string, reference: string): boolean {
  return existsSync(resolve(dir, decodeURI(reference.split(/[?#]/)[0]!)));
}

/** Whether a link's `href` names a file beside the page, not another page, which is a `.md`. */
export function linksFile(href: string): boolean {
  return isRelative(href) && !/\.md$/i.test(href.split(/[?#]/)[0]!);
}

const missing = (file: string, where: string, reference: string) =>
  new FileError(file, `${where}${reference} isn't there. Add the file, or fix the path.`);

/** @prose
 * Each reference in `html` and its `<style>`s, from `dir`. A mistake names `file`, and its line
 * when `lines` is set, which is when `html` is the file as written, such as the frame.
 */
export function checkHtml(file: string, dir: string, html: string, lines = false): void {
  const tags = scan(html);
  const at = (offset: number) =>
    lines ? `line ${html.slice(0, offset).split("\n").length}: ` : "";
  for (const [i, tag] of tags.entries()) {
    if (tag.kind !== "start") continue;
    if (tag.name === "style") {
      const close = tags.slice(i + 1).find((t) => t.kind === "end" && t.name === "style");
      checkCss(file, dir, html.slice(tag.end, close?.start ?? html.length), at(tag.start));
      continue;
    }
    const names = tag.name === "link" || tag.name === "a" ? ["href"] : ["src", "poster"];
    for (const name of names) {
      const value = decode(attribute(tag, name)?.value ?? "");
      if (tag.name === "a" && !linksFile(value)) continue;
      if (isRelative(value) && !exists(dir, value)) throw missing(file, at(tag.start), value);
    }
  }
}

const IMPORT = /@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1/g;
const URL_FUNCTION = /url\(\s*(["']?)([^"')\s]+)\1\s*\)/g;

/** Each `@import` and `url()` in `css`, from `dir`. */
export function checkCss(file: string, dir: string, css: string, where = ""): void {
  for (const [, , path] of css.matchAll(IMPORT)) {
    if (!isRelative(path!) || path!.startsWith(".")) continue;
    throw new FileError(
      file,
      `${where}@import "${path}" names a package, which the page's folder doesn't serve. Import it by its full URL, or keep a copy beside the page and import that, as "./${path!.split("/").at(-1)}".`,
    );
  }
  for (const [, , path] of [...css.matchAll(IMPORT), ...css.matchAll(URL_FUNCTION)]) {
    if (isRelative(path!) && !exists(dir, path!)) throw missing(file, where, path!);
  }
  // A stylesheet it imports has references of its own, from where it is.
  for (const [, , path] of css.matchAll(IMPORT)) {
    if (!isRelative(path!) || !path!.endsWith(".css")) continue;
    const imported = resolve(dir, decodeURI(path!));
    checkCss(imported, dirname(imported), readFileSync(imported, "utf8"));
  }
}
