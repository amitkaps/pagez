/** @prose
 * # Redirects
 *
 * A page that moved lists the paths it used to have under `redirects`, and Pagez writes a small
 * page at each one that sends the browser on (`site.ts` checks them).
 *
 * A page's path is still its file's. A redirect only points old addresses at it, so a site can move
 * its files without breaking links from elsewhere. Nothing on the site goes through one, since a
 * link to a redirect fails, asking for the page it reaches.
 *
 * The page is the minimal document, not the page's frame, since it shows for an instant. It
 * refreshes to the page, names it canonical when the site has a `url`, asks not to be indexed, and
 * links to it for a browser that doesn't refresh.
 */
import { dirname, join, relative } from "node:path";
import { encode } from "./elements/markup.ts";
import type { Site, SitePage } from "./site.ts";

/** The page written as `html`, such as `old/index.html`, that sends the browser to `to`. */
export function redirectPage(site: Site, html: string, to: SitePage): string {
  const out = relative(dirname(join(site.root, html)), join(site.root, to.path));
  const href = encode(`${out === "" ? "." : out.startsWith(".") ? out : `./${out}`}/`);
  const { url } = site.metadata;
  const canonical =
    typeof url === "string"
      ? [
          `    <link rel="canonical" href="${encode(new URL(to.path, url.endsWith("/") ? url : `${url}/`).href)}" />`,
        ]
      : [];
  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    "    <title>Moved</title>",
    `    <meta http-equiv="refresh" content="0; url=${href}" />`,
    ...canonical,
    '    <meta name="robots" content="noindex" />',
    "  </head>",
    "  <body>",
    `    <p>This page has moved to <a href="${href}">/${encode(to.path)}</a>.</p>`,
    "  </body>",
    "</html>",
    "",
  ].join("\n");
}
