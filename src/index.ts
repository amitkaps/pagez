/** @prose
 * # pagez
 *
 * pagez — one Markdown page, one HTML page. `compile` turns a page into its parts, and `write`
 * puts them together as the HTML the `pagez` command writes beside it. A mistake in a
 * page is a `FileError`, which names its file.
 *
 * It also exports elementz's `html`, what an element's template script imports at build time.
 * `html` records a template for the build's renderer. An element's browser `<script>` imports
 * nothing from here, since it works on the page's DOM.
 */
export { FileError } from "./elementz/errors.ts";
export { html, type Template } from "./elementz/html.ts";
export { compile, write, type Page } from "./page.ts";
