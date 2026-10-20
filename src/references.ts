/** @prose
 * # References
 *
 * A page links the files beside it as they're written ([Files and links](../docs/pages.md#files-and-links)).
 * So Pagez checks that each one is there, and the build fails on one that isn't rather than the
 * page showing a broken image.
 *
 * A reference is a `src` or a `poster`, a `<link>`'s `href`, and an `@import` or a `url()` in CSS.
 * A link's `href` is one too when it names a file, such as `./data.csv`. A full URL and a fragment
 * are left alone. A link to a page, by its `.md` or its path from the site's root, must be one the
 * site builds, and anything else from the root a file in `public/`.
 *
 * A stylesheet's references are its own, from its folder, as the browser reads them. In CSS, an
 * `@import` that doesn't start with `.` names a package, as a script's `import` does. A folder
 * doesn't serve `node_modules`, so it fails, with the two ways to write it instead.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { FileError } from "./elements/errors.ts";
import { attribute, decode, encode, scan, type Tag } from "./elements/markup.ts";
import { spellings, type Site } from "./site.ts";

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

const PATH = /(@import\s+(?:url\(\s*)?|url\(\s*)(["']?)([^"')\s;]+)\2/g;

/** A relative path from `from`, written from `to`, keeping a trailing `/` and its query and fragment. */
function moved(path: string, from: string, to: string): string {
  const cut = path.search(/[?#]/);
  const [file, suffix] = cut === -1 ? [path, ""] : [path.slice(0, cut), path.slice(cut)];
  let out = relative(to, resolve(from, file)) || ".";
  if (!out.startsWith(".")) out = `./${out}`;
  return `${out}${file.endsWith("/") && !out.endsWith("/") ? "/" : ""}${suffix}`;
}

/** CSS from `from`, with each relative path in it written from `to`. */
export function rebased(css: string, from: string, to: string): string {
  if (from === to) return css;
  return css.replace(PATH, (match, before: string, quote: string, path: string) =>
    isRelative(path) ? `${before}${quote}${moved(path, from, to)}${quote}` : match,
  );
}

/** @prose
 * What a link can reach.
 *
 * A page a run builds is reached by its `.md` or by its path from the site's root, `/about/`, and
 * is written as the folder it's built in. A draft, `404.md` and a redirect aren't linked to, each
 * for its own reason. A path from the root that isn't a page is a file in `public/`, which Vite
 * serves as it is.
 */
export interface Links {
  root: string;
  /** Each page this run builds, by its file and by its path, `/about/`: the folder it's built in. */
  pages: Map<string, string>;
  /** Each page that can't be linked to, by its file and by its path, and why. */
  closed: Map<string, string>;
}

/** What a link in the site can reach. */
export function siteLinks(site: Site): Links {
  const { root } = site;
  const pages = new Map<string, string>();
  const closed = new Map<string, string>();
  for (const page of site.pages) {
    const dir = join(root, page.path);
    pages.set(page.file, dir).set(`/${page.path}`, dir);
  }
  for (const page of site.all) {
    if (pages.has(page.file)) continue;
    const why =
      page === site.notFound
        ? "is the page a host serves for a path that isn't there, not one to link to. Link to a page that is."
        : "is a draft, which build leaves out. Publish it, with draft: false, or remove the link.";
    closed.set(page.file, why).set(`/${page.path}`, why);
  }
  for (const [address, { to }] of site.redirects) {
    for (const path of spellings(address)) {
      closed.set(path, `redirects to /${to.path}. Link to that, where the page is now.`);
    }
  }
  return { root, pages, closed };
}

/** Whether a reference is a path from the site's root, `/about/`, not a URL with no scheme. */
const isSitePath = (reference: string) => reference.startsWith("/") && !reference.startsWith("//");

/** @prose
 * Where `href` goes, written in `from`, or what's wrong with it.
 *
 * `anchor` is whether it's a link, which may reach a page. A link to a `.md` or a path from the
 * root must be a page this run builds, and anything else from the root must be a file in `public/`.
 * A relative link to another file is checked as an image is (`checkHtml`), so it's `undefined`
 * here, as is a URL.
 */
export function linkTarget(
  links: Links,
  from: string,
  href: string,
  anchor: boolean,
): { page: string } | { problem: string } | undefined {
  const cut = href.search(/[?#]/);
  const path = decodeURI(cut === -1 ? href : href.slice(0, cut));
  if (isSitePath(href)) {
    if (statSync(join(links.root, "public", path), { throwIfNoEntry: false })?.isFile()) {
      return undefined;
    }
    if (!anchor)
      return { problem: `${href} isn't a file in public/. Add it there, or fix the path.` };
    const key = path.endsWith("/") || path.endsWith(".html") ? path : `${path}/`;
    const page = links.pages.get(key);
    if (page !== undefined) return { page };
    const why = links.closed.get(key);
    return {
      problem: why
        ? `${href} ${why}`
        : `${href} isn't a page of this site or a file in public/. Link to one that is, or fix the path.`,
    };
  }
  if (!anchor || !isRelative(href) || linksFile(href)) return undefined;
  const file = resolve(from, path);
  const page = links.pages.get(file);
  if (page !== undefined) return { page };
  const why = links.closed.get(file);
  return { problem: why ? `${href} ${why}` : notAPage(href) };
}

/** @prose
 * `html`, written in `from`, for a page built in `to`. Each relative reference is written from
 * `to`, which covers a `src`, a `poster`, a `<link>`'s or an anchor's `href`, and the paths in a
 * `<style>`.
 *
 * A link to a page, by its `.md` or its path from the root, is written as the folder that page is
 * built in, with its fragment kept, so the site works under any path. One that can't be linked to
 * fails naming `file`. It names its line too when `lines` is set, which is when `html` is the file
 * as written, such as the frame.
 */
export function relink(
  file: string,
  html: string,
  from: string,
  to: string,
  links: Links,
  lines = false,
): string {
  return rewrite(
    html,
    (value, tag) => {
      const target = linkTarget(links, from, value, tag.name === "a");
      if (target && "problem" in target) {
        const at = lines ? `line ${html.slice(0, tag.start).split("\n").length}: ` : "";
        throw new FileError(file, at + target.problem);
      }
      if (target) {
        const cut = value.search(/[?#]/);
        const out = relative(to, target.page);
        const folder = out === "" ? "." : out.startsWith(".") ? out : `./${out}`;
        return `${folder}/${cut === -1 ? "" : value.slice(cut)}`;
      }
      return isRelative(value) && from !== to ? moved(value, from, to) : undefined;
    },
    (css) => rebased(css, from, to),
  );
}

/** @prose
 * A built page at the root, with each relative reference written from the site's root path,
 * `base`, such as `/`. `404.html` is served at any path that isn't there, so a reference relative
 * to it would be read from that path instead.
 */
export function fromRoot(html: string, base: string): string {
  const absolute = (path: string) => base + path.replace(/^\.\//, "");
  return rewrite(
    html,
    (value) => (isRelative(value) ? absolute(value) : undefined),
    (css) =>
      css.replace(PATH, (match, before: string, quote: string, path: string) =>
        isRelative(path) ? `${before}${quote}${absolute(path)}${quote}` : match,
      ),
  );
}

/** `html` with each reference `edit` returns a new value for, and each `<style>` `css` writes. */
function rewrite(
  html: string,
  edit: (value: string, tag: Tag) => string | undefined,
  css: (text: string) => string,
): string {
  const tags = scan(html);
  const edits: { start: number; end: number; text: string }[] = [];
  for (const [i, tag] of tags.entries()) {
    if (tag.kind !== "start") continue;
    if (tag.name === "style") {
      const close = tags.slice(i + 1).find((t) => t.kind === "end" && t.name === "style");
      const end = close?.start ?? html.length;
      edits.push({ start: tag.end, end, text: css(html.slice(tag.end, end)) });
      continue;
    }
    const names = tag.name === "link" || tag.name === "a" ? ["href"] : ["src", "poster"];
    for (const name of names) {
      const found = attribute(tag, name);
      if (!found || found.valueStart === -1) continue;
      const value = edit(decode(found.value ?? ""), tag);
      if (value !== undefined) {
        edits.push({ start: found.valueStart, end: found.valueEnd, text: encode(value) });
      }
    }
  }
  let out = html;
  for (const { start, end, text } of edits.toSorted((a, b) => b.start - a.start)) {
    out = out.slice(0, start) + text + out.slice(end);
  }
  return out;
}

/** The failure for a link to a `.md` that isn't one of the site's pages. */
export function notAPage(href: string): string {
  return `${href} isn't a page of this site. Link to a .md that's there, or fix the path.`;
}
