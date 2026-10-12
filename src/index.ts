/** @prose
 * # pagez
 *
 * pagez — one Markdown page, one HTML file. For now the package is elementz's `html`, what an
 * element's template script imports at build time. `html` records a template for the build's
 * renderer. An element's browser `<script>` imports nothing from here, since it works on the
 * page's DOM.
 */
export { html, type Template } from "./elementz/html.ts";
