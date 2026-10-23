/** @prose
 * # How the site is deployed
 *
 * The site is static files on a Cloudflare Worker, with no code. `prose build` writes the pages
 * into `.prose`, and the Worker's deploy command, `pnpm run ship`, uploads them with `craftz
 * deploy`. This file names the domain, so a deploy can't drop it.
 */
import { site } from "@amitkaps/craftz/cloudflare";

export default site({
  name: "pagez",
  domains: ["pagez.amitkaps.com"],
  assets: {
    directory: ".prose",
    // Serve the site's own 404.html for any missing address.
    notFoundHandling: "404-page",
    // Serve /src/page.ts from src/page.ts.html, with no redirect.
    htmlHandling: "auto-trailing-slash",
  },
});
