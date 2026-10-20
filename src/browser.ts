/** @prose
 * # What a page's elements ship
 *
 * The elements a page uses that send something to the browser: CSS from a top-level `<style>`,
 * or behavior from a top-level `<script>`. The page's finished HTML is scanned for their tags, so
 * an element in the frame or written by another element counts, and an element the page doesn't
 * use ships nothing. A page with no behavior loads no JavaScript.
 *
 * - **Their CSS** is each element's once, unlayered, in a `<style>` after Pagez's theme and before
 *   the page's `style.css` ([Element CSS](../docs/elements.md#element-css-once)). A path in it is the element's,
 *   from its own folder, so it's written from the page's.
 * - **Their behavior** is one module, which Vite bundles: the elements' runtime, then each
 *   element's `setup`, defined under its tag. The tag comes from the file's name or the page's
 *   definition, so the script never names its element.
 *
 * What a script imports is checked before Vite sees it, as an image is, so a missing file or
 * package fails at the import's line.
 */
import { isBuiltin, findPackageJSON } from "node:module";
import { dirname, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { parseAst } from "vite-plus";
import { FileError } from "./elements/errors.ts";
import { lineOf, setupModule, type ElementFile } from "./elements/file.ts";
import { scan } from "./elements/markup.ts";
import { browserImport, PACKAGE, partId, RUNTIME } from "./parts.ts";
import { checkCss, exists, isRelative, rebased } from "./references.ts";

/** The elements `html` uses that ship CSS or behavior, sorted by tag. */
export function usedElements(elements: Map<string, ElementFile>, html: string): ElementFile[] {
  const tags = new Set(scan(html).flatMap((tag) => (tag.kind === "start" ? [tag.name] : [])));
  return [...tags].sort().flatMap((tag) => {
    const element = elements.get(tag);
    return element && (element.style || element.script) ? [element] : [];
  });
}

/** The CSS of the elements used, each once, for a page in `dir`. */
export function elementCss(used: ElementFile[], dir: string): string | undefined {
  const styled = used.filter((element) => element.style);
  if (styled.length === 0) return undefined;
  const rules = styled.map((element) => {
    const from = dirname(element.file);
    const css = dedent(element.style!.text);
    checkCss(element.file, from, css);
    return rebased(css, from, dir);
  });
  return rules.join("\n\n");
}

/** The page's one module, which defines each element with behavior, for a page in `dir`. */
export function pageScript(used: ElementFile[], dir: string): string | undefined {
  const setups = used.filter((element) => element.script);
  if (setups.length === 0) return undefined;
  for (const element of used) checkImports(element, "setup");
  const names = setups.map(({ name }) => name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()));
  return [
    `import { define } from "${RUNTIME}";`,
    ...setups.map(
      (element, i) => `import ${names[i]} from "./${relative(dir, partId(element, "setup"))}";`,
    ),
    ...setups.map(({ name }, i) => `define("${name}", ${names[i]});`),
  ].join("\n");
}

/** @prose
 * Each import of one of an element's scripts, checked. A full URL is left as written, for the
 * browser to fetch. A relative path must be there, and a package must be in a `node_modules` the
 * element's folder reaches. The browser's script can't import Pagez, whose `html` renders at build
 * time, or Node's own modules, which the browser doesn't have.
 */
export function checkImports(element: ElementFile, part: "template" | "setup"): void {
  const script = part === "setup" ? element.script : element.template?.script;
  if (!script) return;
  let body;
  try {
    body = parseAst(setupModule(element, script), { lang: "js" }).body;
  } catch {
    return;
  }
  const { file, source } = element;
  for (const statement of body) {
    if (!("source" in statement) || !statement.source) continue;
    const specifier = String(statement.source.value);
    const at = `line ${lineOf(source, statement.start)}: `;
    if (part === "setup" && (specifier === PACKAGE || specifier.startsWith(`${PACKAGE}/`))) {
      const error = browserImport(file);
      throw new FileError(file, at + error.message);
    }
    if (isBuiltin(specifier)) {
      if (part === "template") continue;
      throw new FileError(
        file,
        `${at}this imports ${specifier}, which is Node's, and the browser doesn't have it. Read files in the template's script, which runs at build time.`,
      );
    }
    if (URL.canParse(specifier) || specifier === PACKAGE) continue;
    if (/^\.{0,2}\//.test(specifier)) {
      if (isRelative(specifier) && !exists(dirname(file), specifier)) {
        throw new FileError(file, `${at}${specifier} isn't there. Add the file, or fix the path.`);
      }
      continue;
    }
    try {
      findPackageJSON(specifier, pathToFileURL(file));
    } catch {
      throw new FileError(
        file,
        `${at}this imports ${specifier}, which isn't in a node_modules beside the page. Install it there, with pnpm add ${packageName(specifier)}.`,
      );
    }
  }
}

/** The package a bare specifier names: `d3` for `d3/scale`, and `@scope/name` for its parts. */
const packageName = (specifier: string) =>
  specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/");

/** CSS with its common indent and its blank first and last lines taken out. */
function dedent(css: string): string {
  const lines = css
    .replace(/^\s*\n/, "")
    .trimEnd()
    .split("\n");
  const margin = Math.min(
    ...lines.filter((line) => line.trim()).map((line) => /^\s*/.exec(line)![0].length),
  );
  return lines.map((line) => line.slice(margin)).join("\n");
}
