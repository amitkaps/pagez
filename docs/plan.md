# Plan

Pagez 0.1.0 is on npm, and `main` builds one page or a site of folders to `dist/` through Vite. What each release changed is in its [notes on GitHub](https://github.com/amitkaps/pagez/releases). This plan says what's next, in order, and what works now. [Pages](pages.md) and [elements](elements.md) state the rules, [the design](design.md) says why, and [the lessons](lessons.md) are what building it taught.

## Next, in order

1. **Speed and size, measured.** A script writes a large site, a few hundred pages with shared elements, a template that imports a large package, data beside its pages and redirects, since the test sites' three pages never showed the 12 s build. `pnpm speed` builds it with this tree and with `origin/main` in turns, over three processes, and a change counts only when all three show it. `pnpm hotspots` shows where its time goes. `pnpm size` holds what Pagez adds to a page, its theme, the elements' runtime and the head, to a budget in `verify`, so growth shows in the pull request that causes it.

## Where it is

- **A site of folders.** Every `.md` is a page at its folder's path, `about.md` built as `about/index.html`, with the nearest `style.css` and `frame.html` as its design ([The folder](pages.md#the-folder)). `pagez.md` at the root gives the site's `url`, and every page's follows from it.
- **Pages of a site.** A template gets `pages` and `site`, and a link to a page is checked and written as a relative folder, so `dist/` works under any path. Drafts, `404.md`, redirects as `_redirects` and the build report are there too ([A site](pages.md#a-site)).
- **Elements.** An element is an `@x-tag.html` anywhere in the site or a definition in the page, one per name, rendered in the text and the frame ([elements.md](elements.md)). Its CSS comes before the page's, and its behavior is one module that Vite bundles, with each import checked first. A template runs in a Vite server, and one that throws names its line.
- **Values in prose.** `${…}` prints a path into `page`, and anything more fails at its line and column ([Values in prose](pages.md#values-in-prose)).
- **The head and the frame.** The frame is checked, and the head is written from the page's metadata ([The head and the frame](pages.md#the-head-and-the-frame)).
- **The theme.** A page with no `style.css` and no frame gets one readable column, light or dark, in `@layer theme` ([CSS](pages.md#css)).
- **Through Vite.** `pagez()`, from `@amitkaps/pagez/vite`, and `pagez build|dev|preview` build the folder without writing to it, and `pagez check` lists what to fix in every page. Files are checked, then hashed in `dist/assets/`. An undefined tag warns, as Markz's warnings do, and `pagez rules <id>` prints the rule behind any id.
- **Tests.** Each page in `tests/pages/` and each site in `tests/sites/` builds to its reviewed snapshot or fails with its reviewed error. Every rule in the docs cites the cases that hold it, and every case is cited by a rule.
- **Ids.** Each error and warning ends with its id, such as `[error-link-draft]`, a row of [the Errors table](pages.md#errors) or [the Warnings table](pages.md#warnings). A test holds the ids in `src/` and the rows to each other, so a mistake can't ship without one.
- **Releases.** 0.1.0 was published by hand. Later versions are staged by the release workflow through npm's trusted publishing.

## Later

- **A single page's exports.** `index.html` written beside the page, or the whole page inlined into one HTML file, for opening from disk or sending as one file. Pagez had both, and dropped them for `dist/` ([lessons](lessons.md#where-the-output-goes)). They come back if a single page turns out to need them.

## Open questions

Each one the test pages raise is also an `Open:` note on the page that shows it (`grep -rn "Open:" tests/pages`).

- **Where data lives.** Jekyll names data by a `data/` folder, and an element reads a `data="…"` attribute. The lean is to drop both. An attribute is a plain string, and an element that wants data from it calls `load(attrs.src)`, which the host gives every template. Pagez reads the file, checks it, fails at the use's line, and watches it in dev, which the dev loop needs to rebuild only the pages that use it. A path is relative to the file that wrote it, as `<img src>` is, so a path in a shared `frame.html` or in an element's template means one file wherever it renders. `/…` is the root beside `pagez.md`, for the rare file the whole site shares, which overlaps with how Vite reads `/` for `public/`. An element's own data is a static `import`, and small data is an attribute expression, `rows=${page.sales}`. So each way in has one owner: the element, the page's file or the page's metadata. On one site each of the six files in `data/` is used by one page, and `data="notes.json"` is written ten times in one essay. What a folder mostly held, the list of posts, comes from `pages`. The case for `data/` is a site with many files that every page shares, which no site has yet. Rendering stays synchronous, since async changes when a file is read, not how it's named, and an element can't `await import()` a path that's relative to the page.
- **The theme's look.** The theme's numbers in `src/theme.css` are a first pass, to judge by eye on the `prose` and `stories` pages, in light, dark and at a phone's width. They set the column's width, the body size, and the heading sizes and their space. The width was 65ch first, which measured about 90 characters a line. Then it was 50ch at 18px, about 72, beside a Svbtle post, which read as too narrow in the theme. Now it's 60ch.
- **A heading's id repeating an element's.** `{@section #ideas}` holding `## Ideas` writes the id twice. Markz warns for two headings with one id, not for a heading and an element (`native-tags`).
- **Where `image` resolves.** Against `url`, as now, which differs from the file's place when the page isn't where the site serves it. Or against the file, then made absolute with `url`.
- **Smart punctuation.** Jekyll writes curly quotes, and Markz keeps straight ones. Whether that's Markz's, Pagez's or the author's.
- **Editor support.** Highlighting an `=html` fence as HTML, and `${…}` in a template as JavaScript. That's Markz's tooling, so it's settled there. prose reads `.html` only for HTML comments, so it would read an element file part by part, as it reads `.svelte`, or an element's prose goes missing.
- **Dev loop.** `dev` reloads on a change to the page, its frame, CSS or elements, a JSON file or a module a template ran, and renders the whole page again. What invalidates what, once there are many pages.
- **Wide tables on a phone.** A table wider than the screen pushes the page sideways. CSS alone can't scroll it without costing the table its semantics, so the compiler might wrap each table in a scrolling `<div>`, which is a change to Markz's markup (`prose`).
- **Wrapped code's indent.** A wrapped line of code hangs a fixed 6ch, since CSS can't see the line's own indentation. The compiler knows it, and could mark each line's depth so the wrapped part hangs under the line itself. That's a change to Markz's markup too (`prose`).
- **Re-rendering behavior.** Behavior changes the nodes the build wrote, such as hiding, toggling and text. An element that re-renders a list would lose focus and input state, and would import a diffing renderer, such as uhtml.
- **Data for behavior.** An element that needs rows of data would get them as a JSON `<script>` child. That needs rules for what crosses, such as a `Date` becoming a string, and how big it may get.
- **Markup from a library.** `html` escapes every value, and `raw` isn't exported. So Vega's SVG, a syntax highlighter or KaTeX can't be used in an element. Exporting `raw` waits until a site needs such a library.
- **Meaning.** `<call-out>` means nothing to a screen reader, where `<aside>` is a landmark. When the meaning matters on every use, the template writes the `<aside>`.
- **Child inspection.** Whether an element ever needs its content's structure at build time. It waits until a real element needs it.
- **Moves,** with `connectedMoveCallback`, once connect and disconnect are proven.
- **Element CSS as a file.** A page's element CSS is in a `<style>` in its head, a few hundred bytes on a real site. A large element on many pages would send it with each, and a shared hashed file past some size would let a browser cache it.
