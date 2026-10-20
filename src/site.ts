/** @prose
 * # The site
 *
 * The pages in a folder, and what each one is made from
 * ([pages](../docs/pages.md#the-folder)). The folder Pagez builds is the root, and every
 * `.md` under it is a page, at its folder's path.
 *
 * `index.md` is its folder's own page, and `about.md` is `about/`, built as `about/index.html`. So
 * every page is a folder's `index.html`, and its URL says nothing of how it's built. `about.md`
 * beside `about/index.md` is two files for one path, and fails naming both.
 *
 * What's skipped is skipped for elements too. That's a name starting with `_` or `.`,
 * `node_modules`, `public/`, which is copied as it is, and `dist/`, which is what's built. A
 * `README.md` is a page like any other.
 *
 * `pagez.md` at the root is the site's metadata, not a page. Its `url` is the site's address, and
 * each page's follows from it and the page's path. Its `repo` is where the site's source is. Every
 * other key is the site's own, as `site.author` in a template. One anywhere else fails, since a
 * folder's address follows from the root's. A page's own `url` passes when it's that address, so a
 * section that wrote it joins unchanged, and fails otherwise, since it would be ignored. That's
 * checked as the site is read, so it fails once, not in every page that lists it. A site needs no
 * `pagez.md`, and a page with none takes its `url` from its own metadata.
 *
 * Three pages are built differently ([A site](../docs/pages.md#a-site)):
 *
 * - **A draft,** `draft: true`, is left out of `build`, of `pages` and of what a link can reach.
 *   `dev` serves it like any page, so it can be written.
 * - **`404.md`** at the root is what a host serves for a path that isn't there, so it's built as
 *   `404.html`, and it isn't in `pages` or linked to.
 * - **A page that moved** lists the paths it used to have under `redirects`, and each is a 301 to
 *   it in `_redirects` (`redirects.ts`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { parse, type Document } from "@amitkaps/markz";
import { FileError } from "./elements/errors.ts";
import type { Metadata } from "./head.ts";

/** The site's metadata file, at the root. */
export const SITE_FILE = "pagez.md";
/** The page a host serves for a path that isn't there, at the root. */
export const NOT_FOUND = "404.md";

/** A page of the site. */
export interface SitePage {
  /** The page, as an absolute path. */
  file: string;
  /** Its folder's path from the root, `""` for the root's own and `about/` for `about.md`. */
  path: string;
  /** The file it's built as, from the root: `about/index.html`, or `404.html`. */
  html: string;
  /** Its metadata, as Markz read it, with the keys Pagez reads checked. */
  metadata: Metadata;
  draft: boolean;
  /** The old paths it lists under `redirects`, each as a link to it would be written: `/old/`. */
  redirects: string[];
}

/** A folder of pages, read and checked. */
export interface Site {
  root: string;
  /** `pagez.md`'s metadata, or nothing when there's none. */
  metadata: Metadata;
  /** Every page this run builds, sorted by path, without `404.md`, and without drafts in `build`. */
  pages: SitePage[];
  /** Every page in the folder, drafts and `404.md` included. */
  all: SitePage[];
  /** `404.md`, when the site has one. */
  notFound?: SitePage;
  /** Each old address a built page lists, `/old/`, with the path it was listed as. */
  redirects: Map<string, { from: string; to: SitePage }>;
}

/** Folders that hold no pages or elements: what's installed, copied as it is, and built. */
const SKIP = new Set(["node_modules", "public", "dist"]);

/** Every file under `root` that's part of the site, sorted, leaving out what's skipped. */
export function siteFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (/^[_.]/.test(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name)) visit(path);
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  };
  visit(root);
  return files.sort();
}

/** A page's folder's path from `root`, `""` for the root's `index.md` and `about/` for `about.md`. */
export function pagePath(root: string, file: string): string {
  const parts = relative(root, file).slice(0, -".md".length).split(sep);
  if (parts.at(-1) === "index") parts.pop();
  return parts.map((part) => `${part}/`).join("");
}

/** @prose
 * The site at `root`, its metadata and its pages. A mistake in the folder fails before any page is
 * compiled.
 *
 * The mistakes are no page at all, two files for one path, a `pagez.md` below the root, and an
 * `index.html` where a page is built, which is what Pagez writes. A key Pagez reads written wrong is
 * one too, and so is a redirect that can't be one. `drafts` builds the drafts too, as `dev` does.
 */
export function readSite(root: string, { drafts = false }: { drafts?: boolean } = {}): Site {
  const all: SitePage[] = [];
  const byPath = new Map<string, SitePage>();
  for (const file of siteFiles(root)) {
    if (!file.endsWith(".md")) continue;
    if (file === join(root, SITE_FILE)) continue;
    if (file.endsWith(`${sep}${SITE_FILE}`)) {
      throw new FileError(
        file,
        `${SITE_FILE} is the site's metadata, at its root, and a folder's address follows from the root's. Move its keys into ${relative(dirname(file), join(root, SITE_FILE))}, or rename it if it's a page.`,
      );
    }
    const path = pagePath(root, file);
    const html = file === join(root, NOT_FOUND) ? "404.html" : `${path}index.html`;
    const page = { file, path, html, ...pageMetadata(file) };
    const other = byPath.get(path);
    if (other) {
      const [first, second] = [other.file, file].sort() as [string, string];
      throw new FileError(
        second,
        `/${path} also comes from ${relative(root, first)}. A path has one page: rename or remove one of them.`,
      );
    }
    const built = join(root, html);
    if (existsSync(built)) {
      throw new FileError(
        built,
        `${html} is what Pagez writes from ${relative(root, file)}, so it can't be in the folder. A frame is frame.html.`,
      );
    }
    byPath.set(path, page);
    all.push(page);
  }
  if (all.length === 0) {
    throw new FileError(
      join(root, "index.md"),
      "there's no page here. Each .md is one, and index.md is the folder's own.",
    );
  }
  all.sort((a, b) => (a.path < b.path ? -1 : 1));
  const metadata = siteMetadata(join(root, SITE_FILE));
  const notFound = all.find((page) => page.html === "404.html");
  if (notFound && typeof metadata.url !== "string") {
    throw new FileError(
      notFound.file,
      `a host serves 404.html at any path that isn't there, so its links are written from the site's root, which needs its address. Add url to ${SITE_FILE}, such as url: https://example.com/`,
    );
  }
  for (const page of all) {
    if (page !== notFound) checkUrl(metadata, page);
  }
  const pages = all.filter((page) => page !== notFound && (drafts || !page.draft));
  return { root, metadata, pages, all, notFound, redirects: readRedirects(root, all, pages) };
}

/** A page's address, from the site's `url` and the page's path. */
export function pageUrl(url: string, path: string): string {
  return new URL(path, url.endsWith("/") ? url : `${url}/`).href;
}

/** A page's own `url`, which must be the address the site gives it. */
function checkUrl(metadata: Metadata, page: SitePage): void {
  const { url } = metadata;
  const own = page.metadata.url;
  if (typeof url !== "string" || own === undefined) return;
  const address = pageUrl(url, page.path);
  if (typeof own === "string" && URL.canParse(own) && new URL(own).href === address) return;
  throw new FileError(
    page.file,
    `url is ${JSON.stringify(own)}, and a page's address is pagez.md's url and its path, ${address}. Remove url, or move the file.`,
  );
}

/** @prose
 * `pagez.md`'s metadata, the rest of the file being notes for whoever keeps the site. `url` and
 * `repo` are full addresses, and fail otherwise, since every page's address is made from `url`.
 */
function siteMetadata(file: string): Metadata {
  if (!existsSync(file)) return {};
  const doc = parse(readFileSync(file, "utf8"));
  const metadata: Metadata = { ...doc.metadata };
  const address: Rule = (value) =>
    typeof value === "string" && /^https?:\/\/[^/\s]/.test(value)
      ? undefined
      : "write a full address, such as https://example.com/";
  check(file, doc, metadata, { url: address, repo: address });
  return metadata;
}

/** @prose
 * A page's metadata, with the keys a site reads checked. Markz skips a value YAML reads
 * differently, such as `draft: yes`, with a warning, so a key Pagez reads is checked as written on
 * its line, or `draft: yes` would publish a draft. `path` is the page's folder, which Pagez gives
 * every template, so a page can't set it.
 */
function pageMetadata(file: string): Pick<SitePage, "metadata" | "draft" | "redirects"> {
  const doc = parse(readFileSync(file, "utf8"));
  const metadata: Metadata = { ...doc.metadata };
  check(file, doc, metadata, {
    draft: (value) =>
      typeof value === "boolean" ? undefined : "write draft: true or draft: false",
    redirects: (value) =>
      typeof value === "string" ||
      (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string"))
        ? undefined
        : "write the paths that used to reach this page, such as redirects: [/old-name/]",
    path: () => "a page's path is its file's, so move the file instead, and remove path",
  });
  const listed = metadata.redirects;
  return {
    metadata,
    draft: metadata.draft === true,
    redirects:
      listed === undefined ? [] : Array.isArray(listed) ? (listed as string[]) : [listed as string],
  };
}

/** What's wrong with a key's value, if anything. */
type Rule = (value: unknown) => string | undefined;

function check(file: string, doc: Document, metadata: Metadata, rules: Record<string, Rule>): void {
  for (const { code, start, end } of doc.warnings) {
    if (code !== "metadata-value") continue;
    const line = /^([^:]+):\s*(.*)$/.exec(doc.source.slice(start, end));
    const key = line?.[1]?.trim();
    if (key && key in rules && !(key in metadata)) {
      throw new FileError(
        file,
        `${key} is ${JSON.stringify(line?.[2])}: ${rules[key]!(line?.[2])}.`,
      );
    }
  }
  for (const [key, rule] of Object.entries(rules)) {
    if (!(key in metadata)) continue;
    const value = metadata[key];
    const problem = value === null ? "leave the line out, or give it a value" : rule(value);
    if (problem) throw new FileError(file, `${key} is ${JSON.stringify(value)}: ${problem}.`);
  }
}

/** @prose
 * The address an old path is a spelling of, `/old/` for `/old`, `/old/` or `/old.html`, or
 * `undefined` when it isn't a path a page could have had.
 *
 * A host serves a page's folder at `/x/`, and sends `/x` and `/x.html` there itself, so the three
 * are one address. Any other extension is a file, which a page can't stand in for.
 */
export function redirectAddress(path: string): string | undefined {
  if (!path.startsWith("/") || path.startsWith("//") || /[?#\s]/.test(path)) return undefined;
  const last = path.slice(path.lastIndexOf("/") + 1);
  if (!last.endsWith(".html") && last.includes(".")) return undefined;
  return `${path.replace(/(\/index)?\.html$|\/$/, "")}/`;
}

/** Each way a host is asked for `address`, `/old/`: `/old`, `/old/` and `/old.html`. */
export function spellings(address: string): string[] {
  if (address === "/") return ["/", "/index.html"];
  const name = address.slice(0, -1);
  return [name, address, `${name}.html`];
}

/** @prose
 * Every old address the built pages list, `/old/`, with the path it was listed as and the page it
 * goes to. Each failure names the page that lists it.
 *
 * An old address can't be a page's, drafts included, in any spelling, since a host reads redirects
 * before the files it serves, so one would stand in front of the page. No two pages can list one,
 * and a page lists it once.
 */
function readRedirects(
  root: string,
  all: SitePage[],
  pages: SitePage[],
): Map<string, { from: string; to: SitePage }> {
  const built = new Map(all.map((page) => [page.html, page]));
  const redirects = new Map<string, { from: string; to: SitePage }>();
  for (const page of pages) {
    for (const from of page.redirects) {
      const fail = (problem: string) =>
        new FileError(page.file, `redirects lists ${from}: ${problem}`);
      const address = redirectAddress(from);
      if (address === undefined) {
        throw fail(
          "write each old path from the site's root, such as /old-name/ or /old-name.html.",
        );
      }
      const other = built.get(`${address.slice(1)}index.html`);
      const whose = other === page ? "this page" : other && relative(root, other.file);
      if (other && from === address) {
        throw fail(
          other === page
            ? "that's this page's own path. List the paths that used to reach it."
            : `that's the path of ${whose}.`,
        );
      }
      if (other) {
        throw fail(
          `that's ${address} spelled another way, which is ${whose}, and a host sends it there itself.${other === page ? " Remove it." : ""}`,
        );
      }
      const listed = redirects.get(address);
      if (listed?.to === page) {
        throw fail(
          `that's ${address} again, and one redirect sends ${spellings(address)
            .join(", ")
            .replace(/, (?=[^,]*$)/, " and ")}. List it once.`,
        );
      }
      if (listed) throw fail(`${relative(root, listed.to.file)} lists it too. Keep one.`);
      redirects.set(address, { from, to: page });
    }
  }
  return redirects;
}

/** The file `name` in `dir` or the nearest folder above it, up to `root`, if there's one. */
export function nearest(root: string, dir: string, name: string): string | undefined {
  for (let at = dir; ; at = dirname(at)) {
    const file = join(at, name);
    if (existsSync(file)) return file;
    if (at === root || !at.startsWith(root + sep)) return undefined;
  }
}
