# Plan

## Where it is

### Pages of a site

Sitez's site features are Pagez's ([Pages of a site](design.md#pages-of-a-site)). A template gets `pages`, every page the site builds with its `path` and `url`, and `site`, `pagez.md`'s metadata, so an index lists its posts. A link may be a path from the root, `/blog/`, which a frame or a template writes, and it's checked and written as a relative folder like a `.md` link, so `dist/` still works under any path. Drafts are left out of `build` and served by `dev`. `404.md` is `404.html`, with its references made absolute from `pagez.md`'s `url`, since a host serves it at any path. A page's `redirects` each write a page that refreshes to it, and a link to one fails. `build` prints a report of each page's size and time. Links to the repository stayed in Sitez, since a linked file is shipped with its page here. `tests/sites/blog` has all of it.

### Many pages, by folder

Pagez builds a folder of pages, not only its `index.md`: every `.md` is a page at its folder's path, `about.md` built as `about/index.html`, and each uses the nearest `style.css` and `frame.html` ([The folder](design.md#the-folder)). `src/site.ts` reads the folder: its pages, what's skipped, and `pagez.md`, whose `url` makes every page's. A reference is written from the file it's in, a frame's from its folder, and each page's are rewritten from where it's built, so `dist/` works under any path. A link to a `.md` must be a page, and becomes its folder, such as `../essays/first/`. Elements are found anywhere in the site. `tests/sites/` holds a set of folders, each with its own design, built as one site, and the folder's mistakes, each failing at its file.

### One theme, and element CSS that wins

Pagez's reset and prose, about 400 lines in two layers, are one `src/theme.css` of about 150, in `@layer theme`: one readable column of what Markz writes, in the system's font, light or dark, with nothing to configure, since a `style.css` replaces it. It ships inside `dist/` as text, and Markz is bundled there too, as prose does, so Pagez's one dependency is its peer, `vite-plus`. An element's CSS isn't in a layer anymore, and comes before the page's `style.css`. In `@layer elements` it lost to any unlayered rule, so a page's `h2` restyled every element's headings. Now the element's tag outranks the page's tag defaults, and the page has the last word by naming the element ([The cascade](design.md#the-cascade)).

### The rest of the compiler

Every test page builds to its reviewed snapshot or fails with its reviewed error, and none is a todo. Elements render from an `@x-tag.html` anywhere in the folder or a definition in the page, in the text and the frame, with one definition per name. Their CSS is one `@layer elements` block, and their behavior is one module that Vite bundles, with what each `setup` imports checked first. A template runs in a Vite server, `dev`'s own or one the build makes, and one that throws names its line. `${…}` in prose prints a path into `page`, and a missing value, a list or anything more fails at its line and column. A build script's names are the markup's with no `export`, and it has `html` with no import. A link to a file is checked and hashed, and an undefined tag warns.

### Elements, without a name of their own

Sitez's `elementz.md` is `docs/elements.md`, with Pagez as the host and reordered by the file's three parts. The design and the code link to it here, not to sitez.amitkaps.com. `src/elementz/` is `src/elements/`, since a name of its own only fit when Sitez was a second host. It still imports nothing else from Pagez, so what an element is stays apart from how a page uses it. A template value is marked with `pagez.template`.

### 0.1.0, and stories on the site

0.1.0 is on npm, published by hand, and later versions are staged by the release workflow through npm's trusted publishing. amitkaps.github.io installs it, and its `stories/` is the first section with its own design: `index.md`, `style.css`, `frame.html`, and its images and font beside it. The site builds with Sitez, then Pagez builds `stories/` into `dist/stories/`. svgo, WebP where smaller and a font subset took its SVGs from 528 KB to 308 KB, its photos from 229 KB to 130 KB and its font from 39 KB to 26 KB. Every block sits where the Jekyll page's does, and the quotes are curled in the source, since Markz doesn't curl them.

### `dist/` through Vite

`pagez()`, from `@amitkaps/pagez/vite`, builds a folder's `index.md` through Vite, and `pagez build|dev|preview` runs Vite with it. The compiled HTML is handed to Vite in memory, so the folder is never written to, and an `index.html` in it fails. CSS, images, fonts and the favicon come out hashed in `dist/assets/`. Stories, built this way and served, sits block for block where the Jekyll page does. The test pages are `index.md` now, and a mistake is a `PagezError`.

### The compiler writes the folder

`pagez index.md` writes `index.html` beside it, with its files linked as written and each checked, so a missing one fails the build. A `style.css` beside the page is linked in place of the reset and prose, the frame is `frame.html`, and a `<style>` in an `=html` block is raw HTML like any other. `standalone.ts` and its data URLs are gone. The design changed after rebuilding stories, as one file was 1 MB of base64 that couldn't be read, cached or shared ([The folder](design.md#the-folder)). 17 test pages build, and 33 are todos. Stories builds through it, with its Jekyll CSS, images and font as they are, to a 34 KB `index.html` whose every block sits where the Jekyll page's does, wide and on a phone.

### Stories, rebuilt

amitkaps.com/stories, a Jekyll page of six chapters and 41 images, was rebuilt as one Markz page in its own, private repository, beside the Jekyll site. It builds to a 1 MB file that opens from disk, and its CSS went from 208 lines to about 70. What it found is in the open questions, and a frame may now write social tags Pagez doesn't, such as `twitter:site`.

### The compiler, without elements

`src/page.ts` compiles a page into its parts: Markz's HTML in the frame, the head written from its metadata, and its CSS, with the reset and prose when there's no frame. Page CSS moves to the head, each block its own `<style>`, which settled where a URL `@import` goes. `src/standalone.ts` writes the parts as one file, with each file beside the page inlined as a data URL, and the `pagez` command runs both. 16 test pages build to their reviewed snapshots or fail with their reviewed errors, and 33 are todos, waiting for elements, expressions, the bundler and links. The frame's errors now give their line.

### Reset and prose

`css/reset.css` and `css/prose.css`, exported by the package, from the common modern resets, good-css, Vizchitra's prose and a draft of its own. Serif headings and sans text in the system's fonts, one-way flow, a modular scale, an accent color, and print and contrast styles. Tried on the `stories` test page, whose CSS is now only its look, its sections and its figures, and on the `prose` test page of every Markdown element, in light, dark and at a phone's width ([The theme](design.md#the-theme)).

### The head moved in

Sitez's `head.ts` is `src/head.ts`: the frame's checks, and the head written from metadata. It dropped what's Sitez's, the 404 page, redirects and linked stylesheets, and settled a page with no title, the head's image and the frame's head ([Head](design.md#head)).

### Test pages

`tests/pages/` holds 49 pages Pagez must build, or must fail on, each saying what it expects. Their `Open:` notes are design questions to settle before the compiler needs them.

### elementz moved in

Sitez's `src/elementz/` is `src/elementz/` here, unchanged, with its tests in `tests/elementz/`. The package exports its `html`. Sitez keeps its own copy until it renders through Pagez.

### 0.0.0

Started from [ship's standard](https://ship.amitkaps.com/docs/standard.md), with `pnpm new`. The design moved here from Sitez's `pagez.md`, and nothing of Pagez is built yet.

## Next, in order

The direction is [folders.md](folders.md): Pagez builds a hierarchy of folders, one page or a site, to `dist/`, and Sitez folds into it. `design.md` is rewritten to it step by step.

1. **amitkaps.github.io moves to Pagez.** Then Sitez is deprecated and archived. The stories repository is archived once the apex moves to Cloudflare.
2. **Neutral docs.** Pagez compiles Markz to static HTML, and its docs say so with no Sitez and no amitkaps.com in them. Package and tool names stay, such as `@amitkaps/pagez` and ship's URLs, since they're what's published. History keeps its reason and drops its source, so "Sitez 0.3 used a class" becomes why a class was ruled out, and the rest is in git and in [Where it is](#where-it-is). Evidence keeps its finding with a neutral example, so amitkaps.com's treemap becomes an essay with ten charts of one dataset. What depends on the move, folders.md's comparison with Sitez and step 1, becomes plain rules once they're done. The `stories` test page becomes a fixture of the same shape. `elements.md` can go first, since it's stable.

## Later

- **A single page's exports.** `index.html` written beside the page, or the whole page inlined into one HTML file, for opening from disk or sending as one file. Pagez had both, and dropped them for `dist/`. They come back if a single page turns out to need them.

## Open questions

Each one the test pages raise is also an `Open:` note on the page that shows it (`grep -rn "Open:" tests/pages`).

- **Where data lives.** Jekyll and Sitez name data by a `data/` folder, and an element reads a `data="…"` attribute. The lean is to drop both. An attribute is a plain string, and an element that wants data from it calls `load(attrs.src)`, which the host gives every template. Pagez reads the file, checks it, fails at the use's line, and watches it in dev, which the dev loop needs to rebuild only the pages that use it. A path is relative to the file that wrote it, as `<img src>` is, so a path in a shared `frame.html` or in an element's template means one file wherever it renders. `/…` is the root beside `pagez.md`, for the rare file the whole site shares, which overlaps with how Vite reads `/` for `public/`. An element's own data is a static `import`, and small data is an attribute expression, `rows=${page.sales}`. So each way in has one owner: the element, the page's file or the page's metadata. On amitkaps.com each of the six files in `data/` is used by one page, and `data="notes.json"` is written ten times in one essay. What a folder mostly held, the list of posts, comes from `pages`. The case for `data/` is a site with many files that every page shares, which no site has yet. Rendering stays synchronous, since async changes when a file is read, not how it's named, and an element can't `await import()` a path that's relative to the page.
- **The theme's look.** The numbers in [The theme](design.md#the-theme) are a first pass, to judge by eye on the `prose` and `stories` pages, in light, dark and at a phone's width: the column's width, the body size, and the heading sizes and their space. What's been tried for the width: 65ch, which measured about 90 characters a line, then 50ch at 18px, about 72, beside a Svbtle post, which read as too narrow in the theme, then 60ch.
- **A heading's id repeating an element's.** `{@section #ideas}` holding `## Ideas` writes the id twice. Markz warns for two headings with one id, not for a heading and an element (`native-tags`).
- **Markz's warnings.** Pagez prints its own, for an undefined tag, and not Markz's yet. Whether it prints them too, or fails on them.
- **Where `image` resolves.** Against `url`, as now, which differs from the file's place when the page isn't where the site serves it. Or against the file, then made absolute with `url`.
- **Smart punctuation.** Jekyll writes curly quotes, and Markz keeps straight ones. Whether that's Markz's, Pagez's or the author's.
- **Editor support.** Highlighting an `=html` fence as HTML, and `${…}` in a template as JavaScript. That's Markz's tooling, so it's settled there.
- **Dev loop.** `dev` reloads on a change to the page, its frame, CSS or elements, a JSON file or a module a template ran, and renders the whole page again. What invalidates what, once there are many pages.
- **Wide tables on a phone.** A table wider than the screen pushes the page sideways. CSS alone can't scroll it without costing the table its semantics, so the compiler might wrap each table in a scrolling `<div>`, which is a change to Markz's markup (`prose`).
- **Wrapped code's indent.** A wrapped line of code hangs a fixed 6ch, since CSS can't see the line's own indentation. The compiler knows it, and could mark each line's depth so the wrapped part hangs under the line itself. That's a change to Markz's markup too (`prose`).
