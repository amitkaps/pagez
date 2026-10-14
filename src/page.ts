/** @prose
 * # A page, compiled
 *
 * One Markz page in, its parts out: the page in its frame with its head written, Pagez's CSS and
 * its elements', the stylesheets it links, and its one module. `write` puts them together as the
 * `index.html` the plugin hands to Vite, in memory where the page is built
 * ([The folder](../docs/design.md#the-folder)). Each element the page uses renders from its
 * definition (`definitions.ts`), in the text and in the frame, and each `${…}` in the text prints
 * from `page` (`text.ts`). What it ships is in `browser.ts`.
 *
 * The page is Markz's own HTML, raw `=html` blocks included, as written. Each reference must be
 * there, and is written from where the page is built. A relative image in the Markdown fails at
 * its line. One in raw HTML or a stylesheet fails naming it, and one in the frame at the frame's
 * line.
 */
import { readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { headings, parse } from "@amitkaps/markz";
import { elementCss, checkImports, pageScript, usedElements } from "./browser.ts";
import { readDefinitions } from "./definitions.ts";
import { renderElements, type Host } from "./elements/elements.ts";
import { FileError } from "./elements/errors.ts";
import { addToHead, headFields, pageHead, readFrame, SLOT, type Metadata } from "./head.ts";
import { createLoader, type Loader } from "./parts.ts";
import { checkCss, checkHtml, relink, type Pages } from "./references.ts";
import { nearest, pagePath, readSite, type Site } from "./site.ts";
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
  /** What's worth fixing that doesn't stop the build, each as `line N: message`. */
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
 * one above it ([folders.md](../docs/folders.md#the-rules)). Each is written where it is, so the
 * frame's references are its own, from its folder, and every reference in the page is then
 * written from where the page is built, `about/` for `about.md`. With a `url` in `pagez.md`, the
 * page's is that and its path, and a page that sets its own fails, since it would be ignored.
 */
export async function compile(file: string, options: Options = {}): Promise<Page> {
  const dir = dirname(file);
  const site = options.site ?? readSite(dir);
  const { root } = site;
  const path = pagePath(root, file);
  const out = join(root, path);
  const pages: Pages = new Map(site.pages.map((page) => [page.file, join(root, page.path)]));
  let own: Loader | undefined;
  const loader = async () => options.loader ?? (own ??= await createLoader(root));
  try {
    const doc = parse(readFileSync(file, "utf8"));
    const page = withUrl(file, doc.metadata ?? {}, site, path);
    const definitions = readDefinitions(file, doc, root);
    const host: Host = {
      elements: definitions.elements,
      load: async (element) => {
        checkImports(element, "template");
        return (await loader()).load(element);
      },
      data: (path) => readData(dir, path),
      context: { page },
    };
    const text = await textHtml(file, doc, page, definitions, host, pages);
    const body = text.html.trimEnd();
    checkHtml(file, dir, body);
    const frame = readFrame(nearest(root, dir, "frame.html"));
    if (frame.file) {
      const from = dirname(frame.file);
      checkHtml(frame.file, from, frame.html, true);
      frame.html = relink(frame.file, frame.html, from, dir, pages, true);
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
    const fallback = headings(doc)[0]?.text ?? basename(file, extname(file));
    const written = pageHead(shell, fields, fallback).replace(SLOT, () =>
      body ? `\n${body}\n` : "",
    );
    const html = relink(file, written, dir, out, pages);
    const used = usedElements(definitions.elements, html);
    const elements = elementCss(used, out);
    const script = pageScript(used, out);
    const sheets = [css, ...styles(html), elements ?? ""].join("\n");
    const warnings = text.undefined
      .filter(({ name }) => !selects(sheets, name))
      .map(
        ({ name, line }) =>
          `line ${line}: {@${name}} has no definition, and nothing in the page's CSS selects it. If it's a typo, fix the name. If a script defines it, give it a rule, such as ${name}:not(:defined) { visibility: hidden; }.`,
      );
    return {
      file,
      path,
      html,
      css: [...(frame.file || style ? [] : [THEME]), ...(elements ? [elements] : [])],
      links: style ? [relative(out, style)] : [],
      script,
      warnings,
    };
  } finally {
    await own?.close();
  }
}

/** The page's metadata, with its `url` made from `pagez.md`'s when the site has one. */
function withUrl(file: string, page: Metadata, site: Site, path: string): Metadata {
  const { url } = site.metadata;
  if (typeof url !== "string") return page;
  const address = new URL(path, url.endsWith("/") ? url : `${url}/`).href;
  if (page.url !== undefined) {
    throw new FileError(
      file,
      `url is ${JSON.stringify(page.url)}, and a page's address is pagez.md's url and its path, ${address}. Remove url, or move the file.`,
    );
  }
  return { ...page, url: address };
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
 * The parsed JSON a `data` attribute names, beside the page, or what is wrong with the path.
 * Where data lives is still open ([plan.md](../docs/plan.md#open-questions)).
 */
function readData(dir: string, path: string): { value: unknown } | { problem: string } {
  const file = resolve(dir, path);
  const written = `data="${path}"`;
  if (extname(file) !== ".json") return { problem: `${written} isn't JSON, which data is.` };
  if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
    return { problem: `${written} isn't there: no file at ${relative(dir, file)}.` };
  }
  try {
    return { value: JSON.parse(readFileSync(file, "utf8")) };
  } catch (error) {
    return { problem: `${written} isn't valid JSON: ${(error as Error).message}` };
  }
}

/** @prose
 * The page as one HTML document: Pagez's CSS in a `<style>` in the head, since it isn't a file
 * beside the page, then a `<link>` to each stylesheet, so the page's own CSS comes last, then the
 * page's one module, which Vite bundles.
 */
export function write(page: Page): string {
  const lines = [
    ...page.css.map((css) => `<style>\n${indent(css.trim())}\n</style>`),
    ...page.links.map((href) => `<link rel="stylesheet" href="${href}" />`),
    ...(page.script ? [`<script type="module">\n${indent(page.script)}\n</script>`] : []),
  ];
  return lines.length > 0 ? addToHead(page.html, lines.join("\n")) : page.html;
}

const indent = (css: string) => css.replace(/^(?=.)/gm, "  ");
