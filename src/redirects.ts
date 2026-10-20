/** @prose
 * # Redirects
 *
 * A page that moved lists the paths it used to have under `redirects`, and Pagez writes each to
 * `dist/_redirects` as a 301 to where the page is now (`site.ts` checks them). Cloudflare Pages and
 * Netlify read that file, before the files they serve.
 *
 * A page's path is still its file's. A redirect only points old addresses at it, so a site can move
 * its files without breaking links from elsewhere. Nothing on the site goes through one, since a
 * link to a redirect fails, asking for the page it reaches.
 *
 * A host serves a page's folder at `/x/` and sends `/x` and `/x.html` there itself, but an old
 * address is no page's, so nothing sends its spellings. Each is a line, and a page lists an old
 * address once. With a `url` in `pagez.md`, both sides are written from its path, as `404.html`'s
 * links are, so a site served under `/stories/` redirects there. A `_redirects` in `public/` comes
 * first, for the redirects that aren't a page's, such as to another site.
 *
 * `dev` and `preview` send them too, from the root, where they serve the site (`vite.ts`).
 */
import { spellings, type Site } from "./site.ts";

/** `_redirects`, one line for each spelling of each old address: `/old /blog/new/ 301`. */
export function redirectsFile(site: Site): string {
  const { url } = site.metadata;
  const base = typeof url === "string" ? new URL(url).pathname.replace(/\/$/, "") : "";
  const lines = [];
  for (const [address, { to }] of [...site.redirects].sort(([a], [b]) => (a < b ? -1 : 1))) {
    for (const from of spellings(address)) lines.push(`${base}${from} ${base}/${to.path} 301`);
  }
  return `${lines.join("\n")}\n`;
}

/** Where a request for `path`, from the root, is sent, when it's an old address's. */
export function redirectTo(site: Site, path: string): string | undefined {
  for (const [address, { to }] of site.redirects) {
    if (spellings(address).includes(path)) return `/${to.path}`;
  }
  return undefined;
}
