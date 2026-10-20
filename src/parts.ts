/** @prose
 * # An element's parts, as Vite's modules
 *
 * Each part of an element that runs is a module of its own (`elements/file.ts`). They're the
 * template, which the build runs in a Vite server, and `setup`, which the page's script imports and
 * Vite bundles.
 *
 * Its id is its file's, with the part in the query, so Vite resolves the part's imports from the
 * element's own folder. A part of a definition in a page names the element too. The query ends in
 * `lang.js`, as Vue names the parts of a `.vue` file, so Vite reads it as JavaScript.
 *
 * Two names are Pagez's own, and need no install beside the page. `@amitkaps/pagez`, which a
 * template module and a build script's modules import `html` from, is a module of `html` alone. The
 * elements' runtime is `@amitkaps/pagez/runtime`. In the browser, `@amitkaps/pagez` fails, since
 * `html` renders at build time.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "@amitkaps/markz";
import { createServer, type Plugin, type ViteDevServer } from "vite-plus";
import { pageElements, SCOPE } from "./definitions.ts";
import { FileError } from "./elements/errors.ts";
import { readElement, setupModule, templateModule, type ElementFile } from "./elements/file.ts";
import { define } from "./elements/runtime.ts";

/** What a template module and a build script import `html` from. */
export const PACKAGE = "@amitkaps/pagez";
/** What the page's script imports the elements' runtime from. */
export const RUNTIME = "@amitkaps/pagez/runtime";

const HTML_ID = "\0pagez:html";
const RUNTIME_ID = "\0pagez:runtime";
// The same value as `elements/html.ts`, which is marked by a registered symbol, so a template
// made here renders there.
const HTML_MODULE = `const TEMPLATE = Symbol.for("pagez.template");
export function html(strings, ...values) {
  return { [TEMPLATE]: true, strings, values, called: new Error() };
}`;

type PartName = "template" | "setup";

// Vite adds flags of its own to the query, such as `import`.
const PART = /[?&]pagez=(template|setup)(?:&|$)/;
const ELEMENT = /[?&]element=([^&]+)/;

/** The module id of one part of an element. */
export function partId(element: ElementFile, part: PartName): string {
  const named = element.file.endsWith(".md") ? `&element=${element.name}` : "";
  return `${element.file}?pagez=${part}${named}&lang.js`;
}

/** The element a part's id names, read again, so a part is never stale. */
function readPart(id: string): ElementFile {
  const file = id.split("?")[0]!;
  if (!file.endsWith(".md")) return readElement(file, SCOPE);
  const name = ELEMENT.exec(id)?.[1];
  const found = pageElements(file, parse(readFileSync(file, "utf8"))).find(
    ({ element }) => element.name === name,
  );
  if (!found)
    throw new FileError(
      "error-element-gone",
      file,
      `<${name}> isn't defined in this page anymore.`,
    );
  return found.element;
}

/** @prose
 * Serves each part, and Pagez's own two modules. A part is found from the file that imports it, or
 * from the root, which is how the browser asks for one in `dev`.
 */
export function parts(): Plugin {
  return {
    name: "pagez:parts",
    enforce: "pre",
    // A package in node_modules is externalized, and Node loads it, so a helper module's import
    // of Pagez would get whichever copy is installed, not this one's `html`.
    config: () => ({ ssr: { noExternal: [PACKAGE] } }),
    resolveId(id, importer) {
      const from = importer?.startsWith("\0") ? undefined : importer?.split("?")[0];
      if (id === RUNTIME) return RUNTIME_ID;
      if (id === PACKAGE) {
        if (this.environment.config.consumer === "client") throw browserImport(from ?? id);
        return HTML_ID;
      }
      if (!PART.test(id)) return null;
      const [path, query] = [id.slice(0, id.indexOf("?")), id.slice(id.indexOf("?") + 1)];
      const { root } = this.environment.config;
      const found = [resolve(from ? dirname(from) : root, path), join(root, path)].find((file) =>
        existsSync(file),
      );
      return found ? `${found}?${query}` : null;
    },
    load(id) {
      if (id === HTML_ID) return HTML_MODULE;
      if (id === RUNTIME_ID) return `export const define = ${String(define)};`;
      const part = PART.exec(id)?.[1] as PartName | undefined;
      if (!part) return null;
      this.addWatchFile(id.split("?")[0]!);
      const element = readPart(id);
      const code =
        part === "template" ? templateModule(element, SCOPE, PACKAGE) : setupModule(element);
      return { code, moduleType: "js" };
    },
  };
}

/** The failure for a module the browser loads that imports Pagez. */
export function browserImport(file: string): FileError {
  return new FileError(
    "error-browser-import",
    file,
    `this imports ${PACKAGE}, whose html renders at build time. An element's <script> works on the page's DOM the build wrote, with nothing from Pagez.`,
  );
}

/** What runs a template at build time. */
export interface Loader {
  /** The template's module, whose default export writes it, and whose `fix` maps a stack in it. */
  load(element: ElementFile): Promise<Record<string, unknown>>;
  close(): Promise<void>;
}

/** @prose
 * A loader in a Vite server of its own, with no listener or watcher, for `build` and for a page
 * compiled on its own. Only the template's code runs in it, and nothing in it needs pre-bundling.
 */
export async function createLoader(root: string): Promise<Loader> {
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    appType: "custom",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, watch: null },
    plugins: [parts()],
  });
  return serverLoader(server, () => server.close());
}

/** @prose
 * A loader in a Vite server, which is `dev`'s own. Its `ssrLoadModule` checks Vite's module graph
 * on every import, so a template is never stale.
 *
 * A template that throws has its stack mapped to the module, whose lines are the file's, so the
 * error names the line the author wrote. The module's `fix` maps another stack the same way. One that doesn't compile fails naming its file, with the
 * lines around the mistake.
 */
export function serverLoader(server: ViteDevServer, close = async (): Promise<void> => {}): Loader {
  return {
    async load(element) {
      let module: Record<string, unknown>;
      try {
        module = await server.ssrLoadModule(partId(element, "template"));
      } catch (error) {
        throw loadError(error, element.file, server.config.root);
      }
      const write = module.default as (scope: object) => unknown;
      return {
        default: (scope: object) => {
          try {
            return write(scope);
          } catch (error) {
            if (error instanceof Error) server.ssrFixStacktrace(error);
            throw error;
          }
        },
        // A value the renderer refuses fails after the template returns, so its `html` call's
        // stack is mapped then.
        fix: (error: Error) => server.ssrFixStacktrace(error),
      };
    },
    close,
  };
}

/** @prose
 * A module that failed to load, as a mistake in the file Vite names, or the element's. Vite names
 * a file under its root from the root, as `/blog/words.js`, so it's made absolute.
 */
function loadError(error: unknown, file: string, root: string): FileError {
  if (error instanceof FileError) return error;
  const { message, id, frame } = error as { message?: string; id?: string; frame?: string };
  const named = id?.split("?")[0];
  const shown = message ?? String(error);
  return new FileError(
    "error-module-load",
    named === undefined ? file : existsSync(named) ? named : join(root, named),
    // Rolldown's message shows the line already, and Vite's frame would repeat it.
    `${shown}${frame && !shown.includes("\n") ? `\n\n${frame}` : ""}`,
    { cause: error },
  );
}
