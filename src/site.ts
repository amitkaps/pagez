/** @prose
 * # The site
 *
 * The pages in a folder, and what each one is made from ([folders.md](../docs/folders.md#the-rules)).
 * The folder Pagez builds is the root, and every `.md` under it is a page, at its folder's path.
 * `index.md` is its folder's own page, and `about.md` is `about/`, built as `about/index.html`, so
 * every page is a folder's `index.html` and its URL says nothing of how it's built. `about.md`
 * beside `about/index.md` is two files for one path, and fails naming both.
 *
 * What's skipped is skipped for elements too: a name starting with `_` or `.`, `node_modules`,
 * `public/`, which is copied as it is, and `dist/`, which is what's built. A `README.md` is a page
 * like any other.
 *
 * `pagez.md` at the root is the site's metadata, not a page. Its `url` is the site's address, and
 * each page's follows from it and the page's path. Its `repo` is where the site's source is. Every
 * other key is the site's own. One anywhere else fails, since a folder's address follows from the
 * root's. A site needs no `pagez.md`, and a page with none takes its `url` from its own metadata.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { parse } from "@amitkaps/markz";
import { FileError } from "./elements/errors.ts";
import type { Metadata } from "./head.ts";

/** The site's metadata file, at the root. */
export const SITE_FILE = "pagez.md";

/** A page of the site. */
export interface SitePage {
  /** The page, as an absolute path. */
  file: string;
  /** Its folder's path from the root, `""` for the root's own and `about/` for `about.md`. */
  path: string;
}

/** A folder of pages, read and checked. */
export interface Site {
  root: string;
  /** `pagez.md`'s metadata, or nothing when there's none. */
  metadata: Metadata;
  /** Every page, sorted by path. */
  pages: SitePage[];
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
 * The site at `root`: its metadata and its pages. A mistake in the folder fails before any page is
 * compiled: no page at all, two files for one path, a `pagez.md` below the root, and an
 * `index.html` where a page is built, which is what Pagez writes.
 */
export function readSite(root: string): Site {
  const pages: SitePage[] = [];
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
    const page = { file, path: pagePath(root, file) };
    const other = byPath.get(page.path);
    if (other) {
      const [first, second] = [other.file, file].sort() as [string, string];
      throw new FileError(
        second,
        `/${page.path} also comes from ${relative(root, first)}. A path has one page: rename or remove one of them.`,
      );
    }
    const built = join(root, page.path, "index.html");
    if (existsSync(built)) {
      throw new FileError(
        built,
        `${relative(root, built)} is what Pagez writes from ${relative(root, file)}, so it can't be in the folder. A frame is frame.html.`,
      );
    }
    byPath.set(page.path, page);
    pages.push(page);
  }
  if (pages.length === 0) {
    throw new FileError(
      join(root, "index.md"),
      "there's no page here. Each .md is one, and index.md is the folder's own.",
    );
  }
  return {
    root,
    metadata: siteMetadata(join(root, SITE_FILE)),
    pages: pages.toSorted((a, b) => (a.path < b.path ? -1 : 1)),
  };
}

/** @prose
 * `pagez.md`'s metadata, the rest of the file being notes for whoever keeps the site. `url` and
 * `repo` are full addresses, and fail otherwise, since every page's address is made from `url`.
 */
function siteMetadata(file: string): Metadata {
  if (!existsSync(file)) return {};
  const metadata: Metadata = { ...parse(readFileSync(file, "utf8")).metadata };
  for (const key of ["url", "repo"]) {
    const value = metadata[key];
    if (value !== undefined && !(typeof value === "string" && /^https?:\/\/[^/\s]/.test(value))) {
      throw new FileError(
        file,
        `${key} is ${JSON.stringify(value)}, and it must be a full address, such as https://example.com/.`,
      );
    }
  }
  return metadata;
}

/** The file `name` in `dir` or the nearest folder above it, up to `root`, if there's one. */
export function nearest(root: string, dir: string, name: string): string | undefined {
  for (let at = dir; ; at = dirname(at)) {
    const file = join(at, name);
    if (existsSync(file)) return file;
    if (at === root || !at.startsWith(root + sep)) return undefined;
  }
}
