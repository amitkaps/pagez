/** @prose
 * # A page, compiled
 *
 * One Markz page in, its parts out: the page in its frame with its head written, Pagez's CSS and
 * its elements', the stylesheets it links, and its one module. `write` puts them together as the
 * `index.html` the plugin hands to Vite, in memory beside the page
 * ([The folder](../docs/design.md#the-folder)). Each element the page uses renders from its
 * definition (`definitions.ts`), in the text and in the frame, and each `${…}` in the text prints
 * from `page` (`text.ts`). What it ships is in `browser.ts`.
 *
 * The page is Markz's own HTML, raw `=html` blocks included, as written. Its references stay as
 * written too, and each must be there. A relative image in the Markdown fails at its line. One in
 * raw HTML or a stylesheet fails naming it, and one in the frame at the frame's line.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { headings, parse } from "@amitkaps/markz";
import { elementCss, checkImports, pageScript, usedElements } from "./browser.ts";
import { readDefinitions } from "./definitions.ts";
import { renderElements, type Host } from "./elements/elements.ts";
import { addToHead, headFields, pageHead, readFrame, SLOT } from "./head.ts";
import { createLoader, type Loader } from "./parts.ts";
import { checkCss, checkHtml } from "./references.ts";
import { textHtml } from "./text.ts";

/** A page's parts. */
export interface Page {
  /** The page, as an absolute path. */
  file: string;
  /** The page in its frame, with its head written and its elements rendered, and none of its CSS. */
  html: string;
  /** Pagez's CSS, for a `<style>` in the head: the reset and prose, unless the page has its own, then its elements' CSS. */
  css: string[];
  /** The stylesheets the head links after it, as written: `style.css`, when the page has one. */
  links: string[];
  /** The page's one module, when an element it uses has behavior. */
  script?: string;
  /** What's worth fixing that doesn't stop the build, each as `line N: message`. */
  warnings: string[];
}

/** How a page is compiled. `loader` runs its templates, and is made for the page when not given. */
export interface Options {
  loader?: Loader;
}

/** Pagez's reset and prose, which a page with no CSS of its own gets. */
const BASE = ["reset.css", "prose.css"].map((name) =>
  readFileSync(new URL(`../css/${name}`, import.meta.url), "utf8"),
);

const DARK = /\n *<meta name="color-scheme" content="light dark" \/>/;

/** The page at `file`, compiled into its parts. A mistake in it throws a `FileError`. */
export async function compile(file: string, options: Options = {}): Promise<Page> {
  const dir = dirname(file);
  let own: Loader | undefined;
  const loader = async () => options.loader ?? (own ??= await createLoader(dir));
  try {
    const doc = parse(readFileSync(file, "utf8"));
    const page = doc.metadata ?? {};
    const definitions = readDefinitions(file, doc, dir);
    const host: Host = {
      elements: definitions.elements,
      load: async (element) => {
        checkImports(element, "template");
        return (await loader()).load(element);
      },
      data: (path) => readData(dir, path),
      context: { page },
    };
    const text = await textHtml(file, doc, page, definitions, host);
    const body = text.html.trimEnd();
    checkHtml(file, dir, body);
    const frame = readFrame(dir);
    if (frame.file) checkHtml(frame.file, dir, frame.html, true);
    const style = join(dir, "style.css");
    const styled = existsSync(style);
    const css = styled ? readFileSync(style, "utf8") : "";
    if (styled) checkCss(style, dir, css);

    // The page's own CSS says whether it has a dark mode, which prose's does.
    const shell = await renderElements(
      host,
      styled && !frame.file ? frame.html.replace(DARK, "") : frame.html,
      frame.file ?? file,
      [],
    );
    const fields = headFields(file, page);
    const fallback = headings(doc)[0]?.text ?? basename(file, extname(file));
    const html = pageHead(shell, fields, fallback).replace(SLOT, () => (body ? `\n${body}\n` : ""));
    const used = usedElements(definitions.elements, html);
    const elements = elementCss(used, dir);
    const script = pageScript(used, dir);
    const sheets = [css, ...styles(html), elements ?? ""].join("\n");
    const warnings = text.undefined
      .filter(({ name }) => !selects(sheets, name))
      .map(
        ({ name, line }) =>
          `line ${line}: {@${name}} has no definition, and nothing in the page's CSS selects it. If it's a typo, fix the name. If a script defines it, give it a rule, such as ${name}:not(:defined) { visibility: hidden; }.`,
      );
    return {
      file,
      html,
      css: [...(frame.file || styled ? [] : BASE), ...(elements ? [elements] : [])],
      links: styled ? ["style.css"] : [],
      script,
      warnings,
    };
  } finally {
    await own?.close();
  }
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
