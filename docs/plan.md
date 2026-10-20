# Plan

Pagez 0.1.0 is on npm, and `main` builds one page or a site of folders to `dist/` through Vite. What each release changed is in its [notes on GitHub](https://github.com/amitkaps/pagez/releases). This plan says what's next, in order, and what works now. [The design](design.md) is the whole of what Pagez becomes, and [the lessons](lessons.md) are what building it taught.

## Next, in order

1. **A real site.** Many pages, one design, a blog index that lists its posts, and links between pages, rebuilt as one tree ([Tests of it](folders.md#tests-of-it)). It shows which of a site's features a real one uses, and turns folders.md's tests into plain rules. Until then, a site can build its own pages as before and one section with Pagez, to a folder of its own.
2. **Usage, as it is.** [usage.md](usage.md) still says Pagez isn't built and writes a file beside the page. It's rewritten to `pagez()` and `pagez build|dev|preview`, with its section for agents. Until then, the README's example is how to use it.

## Where it is

- **A site of folders.** Every `.md` is a page at its folder's path, `about.md` built as `about/index.html`, with the nearest `style.css` and `frame.html` as its design ([The folder](design.md#the-folder)). `pagez.md` at the root gives the site's `url`, and every page's follows from it.
- **Pages of a site.** A template gets `pages` and `site`, and a link to a page is checked and written as a relative folder, so `dist/` works under any path. Drafts, `404.md`, redirects and the build report are there too ([Pages of a site](design.md#pages-of-a-site)).
- **Elements.** An element is an `@x-tag.html` anywhere in the site or a definition in the page, one per name, rendered in the text and the frame ([elements.md](elements.md)). Its CSS comes before the page's, and its behavior is one module that Vite bundles, with each import checked first. A template runs in a Vite server, and one that throws names its line.
- **Values in prose.** `${…}` prints a path into `page`, and anything more fails at its line and column ([Expressions](design.md#expressions)).
- **The head and the frame.** The frame is checked, and the head is written from the page's metadata ([Head](design.md#head)).
- **The theme.** A page with no `style.css` and no frame gets one readable column, light or dark, in `@layer theme` ([The theme](design.md#the-theme)).
- **Through Vite.** `pagez()`, from `@amitkaps/pagez/vite`, and `pagez build|dev|preview` build the folder without writing to it. Files are checked, then hashed in `dist/assets/`, and an undefined tag warns.
- **Tests.** Each page in `tests/pages/` and each site in `tests/sites/` builds to its reviewed snapshot or fails with its reviewed error.
- **Releases.** 0.1.0 was published by hand. Later versions are staged by the release workflow through npm's trusted publishing.

## Later

- **A single page's exports.** `index.html` written beside the page, or the whole page inlined into one HTML file, for opening from disk or sending as one file. Pagez had both, and dropped them for `dist/` ([lessons](lessons.md#where-the-output-goes)). They come back if a single page turns out to need them.

## Open questions

Each one the test pages raise is also an `Open:` note on the page that shows it (`grep -rn "Open:" tests/pages`).

- **Where data lives.** Jekyll names data by a `data/` folder, and an element reads a `data="…"` attribute. The lean is to drop both. An attribute is a plain string, and an element that wants data from it calls `load(attrs.src)`, which the host gives every template. Pagez reads the file, checks it, fails at the use's line, and watches it in dev, which the dev loop needs to rebuild only the pages that use it. A path is relative to the file that wrote it, as `<img src>` is, so a path in a shared `frame.html` or in an element's template means one file wherever it renders. `/…` is the root beside `pagez.md`, for the rare file the whole site shares, which overlaps with how Vite reads `/` for `public/`. An element's own data is a static `import`, and small data is an attribute expression, `rows=${page.sales}`. So each way in has one owner: the element, the page's file or the page's metadata. On one site each of the six files in `data/` is used by one page, and `data="notes.json"` is written ten times in one essay. What a folder mostly held, the list of posts, comes from `pages`. The case for `data/` is a site with many files that every page shares, which no site has yet. Rendering stays synchronous, since async changes when a file is read, not how it's named, and an element can't `await import()` a path that's relative to the page.
- **The theme's look.** The numbers in [The theme](design.md#the-theme) are a first pass, to judge by eye on the `prose` and `stories` pages, in light, dark and at a phone's width. They set the column's width, the body size, and the heading sizes and their space. The width was 65ch first, which measured about 90 characters a line. Then it was 50ch at 18px, about 72, beside a Svbtle post, which read as too narrow in the theme. Now it's 60ch.
- **A heading's id repeating an element's.** `{@section #ideas}` holding `## Ideas` writes the id twice. Markz warns for two headings with one id, not for a heading and an element (`native-tags`).
- **Markz's warnings.** Pagez prints its own, for an undefined tag, and not Markz's yet. Whether it prints them too, or fails on them.
- **Where `image` resolves.** Against `url`, as now, which differs from the file's place when the page isn't where the site serves it. Or against the file, then made absolute with `url`.
- **Smart punctuation.** Jekyll writes curly quotes, and Markz keeps straight ones. Whether that's Markz's, Pagez's or the author's.
- **Editor support.** Highlighting an `=html` fence as HTML, and `${…}` in a template as JavaScript. That's Markz's tooling, so it's settled there.
- **Dev loop.** `dev` reloads on a change to the page, its frame, CSS or elements, a JSON file or a module a template ran, and renders the whole page again. What invalidates what, once there are many pages.
- **Wide tables on a phone.** A table wider than the screen pushes the page sideways. CSS alone can't scroll it without costing the table its semantics, so the compiler might wrap each table in a scrolling `<div>`, which is a change to Markz's markup (`prose`).
- **Wrapped code's indent.** A wrapped line of code hangs a fixed 6ch, since CSS can't see the line's own indentation. The compiler knows it, and could mark each line's depth so the wrapped part hangs under the line itself. That's a change to Markz's markup too (`prose`).
