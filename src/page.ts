/** @prose
 * # A page, compiled
 *
 * One Markz page in, its parts out. They're the page in its frame with its head written, Pagez's
 * CSS and its elements', the stylesheets it links, and its one module.
 *
 * `write` puts them together as the `index.html` the plugin hands to Vite, in memory where the page
 * is built ([The folder](../docs/pages.md#the-folder)). Each element the page uses renders from
 * its definition (`definitions.ts`), in the text and in the frame. Each `${…}` in the text prints
 * from `page` (`text.ts`). What it ships is in `browser.ts`.
 *
 * The page is Markz's own HTML, raw `=html` blocks included, as written. Each reference must be
 * there, and is written from where the page is built. A relative image in the Markdown fails at its
 * line. One in raw HTML or a stylesheet fails naming it, and one in the frame at the frame's line.
 */
import { readFileSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { headings, parse, position } from "@amitkaps/markz";
import { elementCss, checkImports, pageScript, usedElements } from "./browser.ts";
import { readDefinitions, readFiles } from "./definitions.ts";
import { renderElements, type Host } from "./elements/elements.ts";
import { addToHead, headFields, pageHead, readFrame, SLOT, type Metadata } from "./head.ts";
import type { WarningId } from "./elements/errors.ts";
import { createLoader, type Loader } from "./parts.ts";
import { checkCss, checkHtml, relink, siteLinks } from "./references.ts";
import { nearest, pagePath, pageUrl, readSite, type Site, type SitePage } from "./site.ts";
import { textHtml } from "./text.ts";
import theme from "./theme.css?built";

/** A page's parts. */
export interface Page {
  /** The page, as an absolute path. */
  file: string;
  /** Its folder's path in the site, where its `index.html` is built: `""` for the root's. */
  path: string;
  /** The page in its frame, with its head written and its elements rendered, and none of its CSS. */
  html: string;
  /** Pagez's CSS, for a `<style>` in the head: its theme, unless the page has its own, then its elements' CSS. */
  css: string[];
  /** The stylesheets the head links after it: its nearest `style.css`, from where it's built. */
  links: string[];
  /** The page's one module, when an element it uses has behavior. */
  script?: string;
  /** The elements it uses that have behavior, by name. */
  behavior: string[];
  /** What's worth fixing that doesn't stop the build, each as `line N: message [id]`. */
  warnings: string[];
}

/** @prose
 * How a page is compiled. `site` is the site it's in, read from the page's folder when not given,
 * so a page compiled alone is a site of one folder. `loader` runs its templates, and is made for
 * the site when not given.
 */
export interface Options {
  site?: Site;
  loader?: Loader;
}

/** Pagez's theme, which a page with no CSS of its own gets. */
const THEME: string = theme;

const DARK = /\n *<meta name="color-scheme" content="light dark" \/>/;

/** @prose
 * The page at `file`, compiled into its parts. A mistake in it throws a `FileError`.
 *
 * Its design is the nearest `style.css` and `frame.html`, each found on its own, in its folder or
 * one above it ([pages](../docs/pages.md#folder-design)). Each is written where it is, so the
 * frame's references are its own, from its folder, and every reference in the page is then
 * written from where the page is built, `about/` for `about.md`. With a `url` in `pagez.md`, the
 * page's is that and its path (`site.ts`).
 *
 * A template gets the page as `page`, every page the site builds as `pages`, sorted by path, and
 * `pagez.md`'s metadata as `site`. Each page is its metadata with its `path` from the root,
 * `/about/`, which a link can be written as, and its `url` when the site has one.
 */
export async function compile(file: string, options: Options = {}): Promise<Page> {
  const dir = dirname(file);
  const site = options.site ?? readSite(dir);
  const { root } = site;
  const at = site.all.find((page) => page.file === file);
  const path = at?.path ?? pagePath(root, file);
  const out = dirname(join(root, at?.html ?? `${path}index.html`));
  const links = siteLinks(site);
  let own: Loader | undefined;
  const loader = async () => options.loader ?? (own ??= await createLoader(root));
  try {
    const doc = parse(readFileSync(file, "utf8"));
    const page =
      at === site.notFound
        ? { ...doc.metadata }
        : listed(site, { path, metadata: { ...doc.metadata } });
    const definitions = readDefinitions(file, doc, root, site.files);
    const host: Host = {
      elements: definitions.elements,
      load: async (element) => {
        checkImports(element, "template");
        return (await loader()).load(element);
      },
      context: {
        page,
        pages: site.pages.map((page) => listed(site, page)),
        site: site.metadata,
      },
    };
    const text = await textHtml(file, doc, page, definitions, host, links);
    const body = text.html.trimEnd();
    checkHtml(file, dir, body);
    const frame = readFrame(nearest(root, dir, "frame.html"));
    if (frame.file) {
      const from = dirname(frame.file);
      checkHtml(frame.file, from, frame.html, true);
      frame.html = relink(frame.file, frame.html, from, dir, links, true);
    }
    const style = nearest(root, dir, "style.css");
    const css = style ? readFileSync(style, "utf8") : "";
    if (style) checkCss(style, dirname(style), css);

    // The page's own CSS says whether it has a dark mode, which the theme's does.
    const shell = await renderElements(
      host,
      style && !frame.file ? frame.html.replace(DARK, "") : frame.html,
      frame.file ?? file,
      [],
    );
    const fields = headFields(file, page);
    const fallback = headings(doc)[0]?.label ?? basename(file, extname(file));
    const written = pageHead(shell, fields, fallback).replace(SLOT, () =>
      body ? `\n${body}\n` : "",
    );
    const html = relink(file, written, dir, out, links);
    const used = usedElements(definitions.elements, html);
    const elements = elementCss(used, out);
    const script = pageScript(used, out);
    const sheets = [css, ...styles(html), elements ?? ""].join("\n");
    const undefinedTag: WarningId = "undefined-tag";
    const lineOf = position(doc.source);
    const warnings = [
      ...doc.warnings.map(({ code, message, instead, start }) => ({
        line: lineOf(start).line,
        text: `${message}. Instead: ${instead}. [${code}]`,
      })),
      ...text.undefined
        .filter(({ name }) => !selects(sheets, name))
        .map(({ name, line }) => ({
          line,
          text: `{@${name}} has no definition, and nothing in the page's CSS selects it. If it's a typo, fix the name. If a script defines it, give it a rule, such as ${name}:not(:defined) { visibility: hidden; }. [${undefinedTag}]`,
        })),
    ]
      .toSorted((a, b) => a.line - b.line)
      .map(({ line, text }) => `line ${line}: ${text}`);
    return {
      file,
      path,
      html,
      css: [...(frame.file || style ? [] : [THEME]), ...(elements ? [elements] : [])],
      links: style ? [fromHere(relative(out, style))] : [],
      script,
      behavior: used.filter((element) => element.script).map((element) => element.name),
      warnings,
    };
  } finally {
    await own?.close();
  }
}

/** @prose
 * What every page in a folder shares, checked once: the site's element files, and each page's
 * nearest frame and `style.css`. A build checks them before any page, so a mistake in one fails
 * once, not in every page that uses it. `compile` checks them again, for a page compiled alone.
 */
export function checkShared(site: Site): void {
  readFiles(site.root, site.files);
  const seen = new Set<string>();
  for (const page of [...site.pages, ...(site.notFound ? [site.notFound] : [])]) {
    const dir = dirname(page.file);
    const frame = nearest(site.root, dir, "frame.html");
    if (frame && !seen.has(frame)) {
      seen.add(frame);
      checkHtml(frame, dirname(frame), readFrame(frame).html, true);
    }
    const style = nearest(site.root, dir, "style.css");
    if (style && !seen.has(style)) {
      seen.add(style);
      checkCss(style, dirname(style), readFileSync(style, "utf8"));
    }
  }
}

/** @prose
 * A page as a template sees it: its metadata, its `path` from the root, and its `url`, made from
 * `pagez.md`'s when the site has one.
 */
function listed(site: Site, page: Pick<SitePage, "path" | "metadata">): Metadata {
  const { url } = site.metadata;
  const at = { ...page.metadata, path: `/${page.path}` };
  return typeof url === "string" ? { ...at, url: pageUrl(url, page.path) } : at;
}

/** The text of each `<style>` in `html`. */
function styles(html: string): string[] {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((found) => found[1]!);
}

/** Whether `css` has a selector for the tag `name`. */
function selects(css: string, name: string): boolean {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return new RegExp(`(^|[\\s,>+~(}{])${name}(?![\\w-])`).test(code);
}

/** @prose
 * The page as one HTML document. Pagez's CSS is in a `<style>` in the head, since it isn't a file
 * beside the page. A `<link>` to each stylesheet follows, so the page's own CSS comes last, and
 * then the page's one module, which Vite bundles.
 */
export function write(page: Page): string {
  const lines = [
    ...page.css.map((css) => `<style>\n${indent(css.trim())}\n</style>`),
    ...page.links.map((href) => `<link rel="stylesheet" href="${href}" />`),
    ...(page.script ? [`<script type="module">\n${indent(page.script)}\n</script>`] : []),
  ];
  return lines.length > 0 ? addToHead(page.html, lines.join("\n")) : page.html;
}

/** A path from the page's folder, `./style.css`, since Vite reads a bare `style.css` as one file wherever it's written. */
const fromHere = (path: string) => (path.startsWith(".") ? path : `./${path}`);

const indent = (css: string) => css.replace(/^(?=.)/gm, "  ");
