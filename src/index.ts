/** @prose
 * # pagez
 *
 * pagez — one Markdown page, one HTML file. `compile` turns a page into its parts, and
 * `standalone` writes them as one file, which is what the `pagez` command does. A mistake in a
 * page is a `FileError`, which names its file.
 *
 * It also exports elementz's `html`, what an element's template script imports at build time.
 * `html` records a template for the build's renderer. An element's browser `<script>` imports
 * nothing from here, since it works on the page's DOM.
 */
export { FileError } from "./elementz/errors.ts";
export { html, type Template } from "./elementz/html.ts";
export { compile, type Page } from "./page.ts";
export { standalone } from "./standalone.ts";
