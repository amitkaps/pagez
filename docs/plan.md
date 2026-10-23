# Plan

Pagez 0.2.0 is on npm, and `main` builds one page or a site of folders to `dist/` through Vite. What each release changed is in its [notes on GitHub](https://github.com/amitkaps/pagez/releases). This plan says what's next, in order, and what works now. [Pages](pages.md) and [elements](elements.md) state the rules, [the design](design.md) says why, and [the lessons](lessons.md) are what building it taught.

## Next, in order

1. **A dashboard in dev.** `pagez dev` serves a page about the site at `/__pagez/` and prints its address beside the site's, `pagez http://localhost:5173/__pagez/`. It's a readable page in the theme, not an app, and never written to `dist/`. It shows:
   - the pages as a folder tree, recently edited first, with drafts marked
   - the elements each page uses, and the data each imports
   - each page's links in and out, and the pages nothing links to
   - the redirects
   - `pagez check`'s warnings and failures, live
   - each page's render time, and its sizes from the last build, marked with when that build ran, since dev's sizes aren't a build's A public sitemap stays the site's own page. The docs show a `@site-map` element written from `pages`.
2. **Rules composed with markz's.** `pagez rules` reads pages.md and elements.md with markz's [`rules`](https://github.com/amitkaps/markz/blob/main/docs/plan.md), in place of its regexes and its copy of markz's codes, and prints markz's rules after its own. A link prints resolved against the site, where it's stripped today. An error and a warning print in markz's line, `pagez: error: …: error-link-draft: …`, where the id ends the line today. The docs test reads the ids the same way. It waits for markz's subpath.

## Where it is

- **A site of folders.** Every `.md` is a page at its folder's path, `about.md` built as `about/index.html`, with the nearest `style.css` and `frame.html` as its design ([The folder](pages.md#the-folder)). `pagez.md` at the root gives the site's `url`, and every page's follows from it.
- **Pages of a site.** A template gets `pages` and `site`, and a link to a page is checked and written as a relative folder, so `dist/` works under any path. Drafts, `404.md`, redirects as `_redirects` and the build report are there too ([A site](pages.md#a-site)).
- **Elements.** An element is an `@x-tag.html` anywhere in the site or a definition in the page, one per name, rendered in the text and the frame ([elements.md](elements.md)). Its CSS comes before the page's, and its behavior is one module that Vite bundles, with each import checked first. A template runs in a Vite server, and one that throws names its line.
- **Values in prose.** `${…}` prints a path into `page`, and anything more fails at its line and column ([Values in prose](pages.md#values-in-prose)).
- **The head and the frame.** The frame is checked, and the head is written from the page's metadata ([The head and the frame](pages.md#the-head-and-the-frame)).
- **The theme.** A page with no `style.css` and no frame gets one readable column, light or dark, in `@layer theme` ([CSS](pages.md#css)).
- **Through Vite.** `pagez()`, from `@amitkaps/pagez/vite`, and `pagez build|dev|preview` build the folder without writing to it, and `pagez check` lists what to fix in every page. Files are checked, then hashed in `dist/assets/`. An undefined tag warns, as Markz's warnings do, and `pagez rules <id>` prints the rule behind any id.
- **Speed and size.** `pnpm speed` times a change on a site of about 300 pages against `main`, `pnpm hotspots` shows where its time goes, and `pnpm size` holds the theme, the head and the runtime to a budget in `verify` ([development](development.md#speed-and-size)).
- **Tests.** Each page in `tests/pages/` and each site in `tests/sites/` builds to its reviewed snapshot or fails with its reviewed error. Every rule in the docs cites the cases that hold it, and every case is cited by a rule.
- **Ids.** Each error and warning ends with its id, such as `[error-link-draft]`, a row of [the Errors table](pages.md#errors) or [the Warnings table](pages.md#warnings). A test holds the ids in `src/` and the rows to each other, so a mistake can't ship without one.
- **Releases.** 0.1.0 was published by hand. Later versions, from 0.2.0, are staged by the release workflow through npm's trusted publishing.

## Later

- **A single page's exports.** `index.html` written beside the page, or the whole page inlined into one HTML file, for opening from disk or sending as one file. Pagez had both, and dropped them for `dist/` ([lessons](lessons.md#where-the-output-goes)). They come back if a single page turns out to need them.

- **`load()` for data a page chooses.** An element's data is an import beside it ([Data is an import](elements.md#data-is-an-import)). An element that reads a different file on each page would call `load(attrs.src)`, with the path relative to the file that wrote it, and Pagez would know which pages read which file. No site has such an element yet, since two pages that share one element with two files can be two small elements that share a module.

## Open questions

Each one the test pages raise is also an `Open:` note on the page that shows it (`grep -rn "Open:" tests/pages`).

- **The theme's look.** The theme's numbers in `src/theme.css` are a first pass, to judge by eye on the `prose` and `stories` pages, in light, dark and at a phone's width. They set the column's width, the body size, and the heading sizes and their space. The width was 65ch first, which measured about 90 characters a line. Then it was 50ch at 18px, about 72, beside a Svbtle post, which read as too narrow in the theme. Now it's 60ch.
- **A heading's id repeating an element's.** `{@section #ideas}` holding `## Ideas` writes the id twice. Markz warns for two headings with one id, not for a heading and an element (`native-tags`).
- **Where `image` resolves.** Against `url`, as now, which differs from the file's place when the page isn't where the site serves it. Or against the file, then made absolute with `url`.
- **Smart punctuation.** Jekyll writes curly quotes, and Markz keeps straight ones. Whether that's Markz's, Pagez's or the author's.
- **Editor support.** Highlighting an `=html` fence as HTML, and `${…}` in a template as JavaScript. That's Markz's tooling, so it's settled there. prose reads `.html` only for HTML comments, so it would read an element file part by part, as it reads `.svelte`, or an element's prose goes missing.
- **Dev loop.** `dev` reloads on a change to the page, its frame, CSS or elements, a JSON file or a module a template ran, and renders the whole page again. What invalidates what, once there are many pages.
- **The text's indent.** A page's text is flush left inside the frame's indented `<main>`, where the head and the frame keep theirs. Indenting it to the slot's depth would read better in view-source, and would have to leave `<pre>`, `<textarea>` and code as written. CSS and JS are minified, and the HTML isn't, since gzip makes its whitespace nearly free.
- **Wide tables on a phone.** A table wider than the screen pushes the page sideways. CSS alone can't scroll it without costing the table its semantics, so the compiler might wrap each table in a scrolling `<div>`, which is a change to Markz's markup (`prose`).
- **Wrapped code's indent.** A wrapped line of code hangs a fixed 6ch, since CSS can't see the line's own indentation. The compiler knows it, and could mark each line's depth so the wrapped part hangs under the line itself. That's a change to Markz's markup too (`prose`).
- **Re-rendering behavior.** Behavior changes the nodes the build wrote, such as hiding, toggling and text. An element that re-renders a list would lose focus and input state, and would import a diffing renderer, such as uhtml.
- **Data for behavior.** An element that needs rows of data would get them as a JSON `<script>` child. That needs rules for what crosses, such as a `Date` becoming a string, and how big it may get.
- **Markup from a library.** `html` escapes every value, and `raw` isn't exported. So Vega's SVG, a syntax highlighter or KaTeX can't be used in an element. Exporting `raw` waits until a site needs such a library.
- **Meaning.** `<call-out>` means nothing to a screen reader, where `<aside>` is a landmark. When the meaning matters on every use, the template writes the `<aside>`.
- **Child inspection.** Whether an element ever needs its content's structure at build time. It waits until a real element needs it.
- **Moves,** with `connectedMoveCallback`, once connect and disconnect are proven.
- **Element CSS as a file.** A page's element CSS is in a `<style>` in its head, a few hundred bytes on a real site. A large element on many pages would send it with each, and a shared hashed file past some size would let a browser cache it.
