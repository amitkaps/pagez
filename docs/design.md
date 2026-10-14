# Design

Pagez is a page compiler: a folder of Markz pages in, their HTML out, built to `dist/` through
Vite. A folder is one page or a site, with Sitez's site features folded in
([folders.md](folders.md)). It's built as
far as [plan.md](plan.md#where-it-is) says. The design started as `pagez.md` in Sitez.

> The build produces the page. JavaScript enhances the page.

**Keep Pagez small.** There is no Pagez runtime model to understand. There is a compiler that
turns prose plus elements into HTML, CSS and JS, and the elements' small runtime in the output.

## Core model

**The unit is the page.** The page holds its content, its metadata and the elements it uses.
Elements exist in service of the prose.

**An element is one file of plain HTML,** made of a `<template>`, a `<style>` and a `<script>`.
Its rules are in [elements.md](elements.md).
It is defined in the page, or in its own `@x-tag.html` file beside it.

In short, it's Web Components in the light DOM, rendered at build time.

**The ideal page** is a simple text page with some behavior, such as an essay with a toggle, a
small interactive figure, or a filterable list.

## Scope

- Input is a folder of Markz pages, each a `.md` at its folder's path, and what they use: their
  `style.css` and `frame.html`, images and fonts, and `@x-tag.html` elements.
- Output is `dist/`: each page's HTML, and their CSS, images and fonts with hashed names, built
  through Vite. The folder is the source, and is never written to ([The folder](#the-folder)).
- A site's pages know of each other: a template gets every page, a link between pages is
  checked, and drafts, redirects and a 404 page are built for it
  ([Pages of a site](#pages-of-a-site)).

## The folder

```
site/
  pagez.md         the site's url and repo, optional
  index.md         the page at /
  about.md         the page at about/
  style.css        their CSS, in place of Pagez's theme, optional
  @x-tag.html      an element, for any page
  essays/
    index.md       the page at essays/
    first.md       the page at essays/first/
    first.svg      its figure, beside it
    frame.html     the document around essays/ and what's below it, optional
    style.css      essays' own CSS, which may @import "../style.css"
  public/          copied as it is
  dist/            what Pagez builds
```

`pagez build` builds the folder to `dist/`, `pagez dev` serves it while it's written, and
`pagez preview` serves what was built. They're Vite's commands with Pagez's plugin, `pagez()` from
`@amitkaps/pagez/vite`, which a folder with a Vite config of its own adds to it. The base is `./`,
so `dist/` works at a site's root or under a path such as `/stories/`. One page, `index.md` and
what it uses, is the smallest site.

- **A page is a `.md`,** at its folder's path. `index.md` is its folder's own, and `about.md` is
  `about/`, built as `about/index.html`, so every page's URL is a folder, which says nothing of how
  it's built. `about.md` beside `about/index.md` is two files for one path, and fails.
- **Its design is the nearest** `style.css` and `frame.html`, each found on its own, in the page's
  folder or the nearest one above it. Nothing is merged unless it's written: a `style.css` that
  builds on its parent's starts with `@import "../style.css";`, and a frame is a whole document,
  so markup two frames share is an element.
- **Each page is compiled in memory** and handed to Vite at the path it's built at, so Vite reads
  its references from there, and an `index.html` there is what Pagez writes, so it fails. A
  reference is written from the file it's in, as a browser reads it, so a figure beside
  `about.md` is `../figure.svg` in `about/index.html`, and a frame's are its own, from its
  folder, wherever the page it frames is built.
- **`pagez.md` at the root** is the site's metadata, not a page. Its `url` is the site's address,
  and each page's is that and its path, so a page that sets its own fails. Its `repo` is where the
  source is. A site needs none, and a page then takes its `url` from its own metadata.
- **What's skipped:** a name starting with `_` or `.`, `node_modules`, `public/` and `dist/`.
  Nothing else is special, so a `README.md` is a page.

A reference is written as a relative path, a package name or a full URL, and that says where its
code or file lives.

| Written as      | Example                     | Pagez                                              |
| --------------- | --------------------------- | -------------------------------------------------- |
| A relative path | `./chart.js`, `./photo.jpg` | checks it's there, and Vite bundles it, hashed     |
| A package name  | `import "d3"`               | bundles it from the `node_modules` beside the page |
| A full URL      | `https://esm.sh/d3`         | leaves it as written                               |

- **Files are checked, then bundled.** An image, a font, a stylesheet or a video is written as a
  relative path, as the source reads. One that isn't there fails the build: in the Markdown at its
  line, and in raw HTML or CSS naming the reference. Vite then gives each a hashed name in
  `dist/assets/`, and inlines one under 4 KB.
- **Scripts are one module.** The elements' scripts become one module, which Vite bundles: the
  elements' runtime, then the `setup` of each element the page uses, with what they import. A
  library two elements share is in it once. A page's own `<script type="module" src>` is left as
  written, and Vite bundles it too.
- **Imports are checked first.** In an element's script, a relative file must be there and a
  package must be in a `node_modules` the element's folder reaches, or the build fails at the
  import's line. A browser script can't import Pagez or Node's own modules.
- **A link to a file,** such as `./data.csv`, is checked, and the build gives it a hashed name,
  since Vite bundles what HTML loads and not what it links to.
- **A link to a page** is to its `.md`, as it reads on GitHub, such as `[hello](essays/first.md)`,
  or to its path from the site's root, `/essays/first/`, which a frame or a template writes,
  since it means one page wherever it renders. It must be a page the site builds, or the build
  fails, at its line in the Markdown and at the frame's line, or naming the page otherwise. It's
  written as the folder the page is built in, from where the linking page is, as
  `./essays/first/`, so `dist/` works under any path. Anything else from the root, such as
  `/favicon.svg`, must be a file in `public/`.
- `dist/` needs a server, as any built site does. Vite marks its stylesheet `crossorigin`, which a
  page opened from disk can't load.
- Pagez fetches nothing at build time, so the build never depends on the network. A full URL is
  the author's choice to depend on it, and it shows in the output.
- A web component from a package is a script like any other. Pagez bundles it, and the browser
  defines it when the page runs. Only Pagez's own elements render at build time.
- The bundler is Vite+'s Rolldown, so `vite-plus` is a peer dependency of Pagez, not only of its
  build. It's the only one: Markz is bundled into `dist/`, as prose bundles it.
- **Why not one file, or beside the page.** Pagez first wrote one standalone file, with every
  image, font and stylesheet inlined as a data URL. Rebuilding amitkaps.com/stories that way made a
  1 MB file that couldn't be read or cached. Then it wrote `index.html` beside `index.md`, which
  mixes output into the source, and more so for a site. `dist/` keeps them apart, as Jekyll and
  most static site generators do. Both are parked as single-page exports (plan.md, Later).

## Pages of a site

What a site adds to a page, from Sitez, where it was built and used first.

- **`pages` and `site`** are in every template's scope, beside `page`. `pages` is every page the
  site builds, sorted by path, each its metadata with its `path` from the root, `/blog/hello/`,
  and its `url` when `pagez.md` has one. `page` has them too. `site` is `pagez.md`'s metadata, so
  `site.author` is the site's own key. So an index lists the pages under it, and links to each
  by its `path`, which works from any page. A page can't set `path`, which is its file's.
- **A draft,** `draft: true`, is left out of `build`, of `pages` and of what a link reaches, so a
  link to one fails rather than shipping broken. `dev` builds it like any page, so it can be
  read as it's written. `draft: yes` is a string to YAML, so it fails rather than publishing.
- **`404.md`** at the root is built as `404.html`, which a host serves at any path that isn't
  there. Its references can't be relative, since they'd be read from that path, so the build
  writes them from the site's root, which `pagez.md`'s `url` gives, and a site with a `404.md`
  needs one. It isn't in `pages`, and a link to it fails.
- **Redirects.** A page that moved lists the paths it used to have, `redirects: [/old-name/]`,
  and each gets a small page, the minimal document, that refreshes to it, names it canonical and
  asks not to be indexed. An old `/name.html` is written as that file. A redirect can't be a
  page's path, and two pages can't list one. `/x.html` can't redirect while a page has `/x/`,
  since a host serves `x.html` at `/x` too, in front of the page. A link to a redirect fails,
  naming where the page is now, so nothing on the site goes through one.
- **The build report.** `build` prints each page's HTML, gzipped, the time it took, and the
  elements that give it behavior, then the CSS and JavaScript the pages share, and the total.
- **Links to the repository** stay out. Sitez sent a link to any other file in the repository to
  its page on GitHub, from `pagez.md`'s `repo`. In Pagez a linked file, such as `./data.csv`, is
  shipped with the page, hashed, which a site of folders needs more, and a link to GitHub is
  written in full.

## Markz and Pagez

Markz is purely syntactic. It parses and never evaluates, and every node carries its position and
source.

| Markz syntax | Markz AST                                        | Markz HTML renderer    | Pagez                                                                             |
| ------------ | ------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------- |
| `${…}`       | expression node (`value` = inner text)           | prints `value` as code | evaluates it as a `page` path and emits it escaped                                |
| `{@tag …}`   | element node (attributes plus Markdown children) | writes the tag         | writes a native tag as Markz does, and renders a custom one from its element file |
| ` ```=html ` | raw node                                         | emits verbatim         | emits verbatim, except an element's definition                                    |

- Pagez overrides the Markz renderer for these three nodes only, and reuses everything else.
- A page rendered by Markz alone stays readable. Expressions show as code, and raw HTML passes
  through.
- A literal `${…}` in prose goes in an inline code span.

## Native tags

Grouping and styling never need a custom element. Markz writes a native tag, such as `section`,
`article` or `figure`, with its classes and attributes, and Pagez leaves it as written. There's no
lookup and no warning.

```md
{@section #see}

## See the idea

{@figure .art}
![A gardener and a sculptor](./gardener.svg)
{/figure}

Start by being a gardener.
{/section}
```

A custom element earns its place when it adds a template, for markup that's reused or derived,
or behavior.

## Expressions

Prose and templates evaluate separately.

| Where           | Parsed by               | Scope                                       | Power             |
| --------------- | ----------------------- | ------------------------------------------- | ----------------- |
| Prose `${…}`    | Markz (expression node) | `page`                                      | dotted paths only |
| Template `${…}` | Pagez (raw template)    | `attrs`, `page`, `html`, the script's names | full JavaScript   |

- Prose refers to values, and elements compute.
- Anything beyond a path into `page` fails, at the expression's line and column. So does a value
  the page doesn't have, since printing nothing would hide a typo.
- A key with a dot, `author.name: Ada`, is one key, as Markz and YAML read it, and
  `${page.author.name}` reaches it. At each step the longest key that matches wins.
- Prose prints a string or a number, escaped. A list, a boolean and an empty value have no one way
  to read as text, so each fails, and an element writes it.
- A link's destination prints its values the same way. An element's attribute that is one
  `${…}` is the value itself, so `{@tag-list tags=${page.tags} /}` gives the template the list.
- A heading that prints a value takes its id from what it prints, so `# ${page.title}` is
  `fish--chips`, where Markz alone makes it `section`.
- `page` is the page's metadata, the name Sitez uses, so an element that reads only `page` works
  in both.

Sitez doesn't evaluate `${…}` in prose ([its design](https://sitez.amitkaps.com/docs/design.md), "Not in v1"). That difference is a page
feature, not part of the element, so elements stay shared.

## Metadata, never settings

Frontmatter holds the page's metadata, such as `title`, `description`, `url` and `image`. It holds
no settings, as Sitez's `site.md` holds none. Each would-be setting is a convention.

- **The page's CSS** is the nearest `style.css`. Pagez links it, in place of its theme
  ([Pagez's CSS or the page's](#pagezs-css-or-the-pages)).
- **The frame** is the nearest `frame.html`, with one `<slot>` for the page, as Sitez's
  `code/index.html` is. With none, Pagez writes a minimal document. It's for a shell the page's
  CSS can't give, such as a header and footer or tags of its own in the head, so most pages have
  none. It isn't `index.html`, which is the page Pagez writes. The frame must not grow layouts,
  partials or site logic.
- **Elements** are the page's own definitions and the `@x-tag.html` files in the site, found by
  name. There's nothing to import.
- **Undefined tags** warn only when a hyphenated tag has no definition and no selector in the
  page's CSS. That catches a typo without a list of tags to allow. A component that a script
  defines gets a rule such as `sl-button:not(:defined) { visibility: hidden; }`, which also keeps
  it from showing unstyled before its script runs. The warning names the tag's line, and `dev`
  and `build` print it.

Relative paths resolve from the file they're written in.

## Head

A page's head is its frame's, with what follows from its metadata added. Each tag has one owner.

- **The frame** writes `charset`, `viewport` and anything else it chooses. It must have a `lang`,
  a `charset`, a `viewport` and one `<slot>`, and fails on a tag Pagez writes. With no frame,
  Pagez's minimal document has the first three and `<main><slot></slot></main>`.
- **Pagez** puts the page's `lang`, `title` and `description` in place of the frame's, or adds
  them. Then it writes the canonical link, `og:title`, `og:description`, `og:url`, `og:image`,
  `og:type` and `twitter:card`, which repeat those values with no choice in them.
- **The title** is the page's `title`, else the frame's `<title>`, else the page's first
  heading, else the file's name. Every page has one.
- **`url`** is the page's full address: `pagez.md`'s and the page's path, or the page's own in a
  site with none. The canonical link and `og:url` need it, and are left out without it.
- **`image`** is a full address, or a path that resolves against `url`. Open Graph needs a full
  address, so a relative `image` with no `url` fails. It isn't checked as a file beside the page
  otherwise say, since only a crawler reads it, at the page's address. With an image,
  `twitter:card` is `summary_large_image`.
- Sitez's frame also needs a title and a description, since every page of a site keeps them when
  it sets none. A single page needs neither in its frame.

## Elements

The element itself, with its template, slot, CSS and `setup`, is in [elements.md](elements.md),
and in `src/elements/`, which imports nothing else from Pagez. Elements nest inside-out, as
there. What's this section's is how elements are used, and where their definitions live.

### Use

- An element is used through Markz, `{@x-tag attr=…}`, optionally with Markdown children.
- An attribute's value may be a prose expression (a `page` path), which evaluates to any value.
- Only text reaches the browser. A string or a number is written on the tag, and a list or an
  object goes to the template alone.
- An element in the frame renders too, and reads the page's `page`. Build-time values make HTML, and never become props or state in the
  browser.

### Where definitions live

- **In the page,** one `=html` block per element, named by `<template element="x-tag">`. Its
  `<style>` and `<script>` are siblings in the block. Definitions sit anywhere in the page,
  typically at the end, like footnotes. A behavior-only element has an empty
  `<template element="x-tag"></template>`, which writes no markup.
- **In a file,** `@x-tag.html` anywhere in the site, kept with the pages that use it. The file's
  name is the tag, and an `element` attribute is optional and must match. `node_modules`,
  `public/`, `dist/` and a name starting with `_` or `.` are skipped.
- Moving an element from the page to a file is a cut and paste. The same file works in Sitez.
- An element's block isn't emitted. All other `=html` content stays verbatim.

### Names

These fail, at their source positions:

- an invalid custom element name
- a reserved name
- two definitions for one name: two files, or the page and a file, or two in the page
- a name that isn't lowercase
- an `element` attribute that doesn't match its file's name

## CSS

Markdown comes first, so a page with no CSS of its own reads well, in the system's fonts. A page
with a design of its own brings it in `style.css`, and an element brings its own.

### The cascade

Each kind of CSS has one place, and a later one wins without a setting.

| Order | CSS                    | Where                          | Beats the one before by |
| ----- | ---------------------- | ------------------------------ | ----------------------- |
| 1     | Pagez's theme          | a `<style>`, in `@layer theme` |                         |
| 2     | the elements' CSS      | a `<style>`, unlayered         | layer                   |
| 3     | the page's `style.css` | a `<link>`, unlayered          | order, at equal weight  |

- **The theme is in a layer,** so any unlayered CSS beats it, whatever its specificity.
- **An element's CSS isn't in a layer.** Its selectors start with its tag, so `note-card h2`
  outranks a page's `h2`, and a page's tag defaults don't reach into its elements. This is how
  Svelte's and Vue's scoped CSS win too, with a class where Pagez has the tag.
- **The page has the last word,** by naming the element. Its `note-card h2` is as specific as the
  element's, and comes after it. So to change an element, a page selects it in `style.css`.
- An element's CSS was in `@layer elements` before. It lost to every unlayered rule, so a
  `style.css` with an `h2` rule, which is most of them, restyled every element's headings.
  Layering the page's CSS was the fix, and few pages would.

### The theme

`src/theme.css`, one file of about 150 lines with its comments, for a page with no `style.css` and
no frame. It's all or nothing: a `style.css` replaces it, so it has nothing to configure, no
custom properties and no layers to add to. It ships inside `dist/` as text, as prose's page files
do, so the package is code alone. A page that wants it as its start copies it from the
repository.

- **It styles what Markz writes,** and the document around it, by tag, with no classes. A test
  holds it to Markz's tags.
- **One readable column.** Text and headings are the system's font, `system-ui`, and code is
  `ui-monospace` in Safari, then Menlo or Consolas, named since Chrome's `monospace` on a Mac is
  Courier. Every font is sized to its x-height with `font-size-adjust: ex-height from-font`, so code
  needs no smaller size. Text is 16px on a phone, growing to 18px on a wide screen, in `rem` so the
  reader's setting scales it. The column is `main`, 60ch, about 85 characters a line, centered, so
  nothing inside an element is narrowed. The browser's own margins and lists stay.
- **Light and dark** from `color-scheme: light dark`, which the minimal document's head says too.
  Tints and rules are mixed from the text's color in `oklch`, so they follow the scheme, and
  a mark and a selection have a color for each, from `light-dark()`, since the browser's yellow
  mark glares in dark mode. A page that sets a
  light background of its own sets `color-scheme: light` too, or its text turns light in dark
  mode.
- **Code, quotes, tables and rules** get a tint or a line, and a code block scrolls.
- It replaced a reset and a prose stylesheet of about 400 lines, with a modular scale, a measure
  on every block, print and contrast styles, and eight custom properties. A `style.css` replaced
  them, so the custom properties could only be set from a `<style>` in the page, and an element
  that used `--prose-step-3` lost it on any page with CSS of its own. It's simpler to judge one
  readable look, and to write a `style.css` for anything else.

### Pagez's CSS or the page's

- **With no `style.css` and no frame,** in its folder or above it, the page gets the theme.
  That's the Markdown-first page, and the minimal document says `color-scheme: light dark`, as
  the theme does.
- **With a `style.css`,** the page's CSS is its own design, and replaces the theme. It's linked
  as written, so it reads, caches and is shared like any file, and it can `@import` and `url()`
  the fonts and images beside it. The minimal document leaves out `color-scheme`, since a page's
  own CSS says whether it has a dark mode.
- **With a frame,** the frame is the design, and doesn't get the theme, as in Sitez. A `style.css`
  is still linked.
- So there's no setting. Sitez dropped its reset because amitkaps.github.io's first rules undid
  it, and a site with a design of its own brings its CSS.
- **A `<style>` in an `=html` block is raw HTML,** written where it is, like any other. A browser
  applies it, unlayered, so a page kept as one Markz file can carry its CSS. HTML wants a
  `<style>` in the head, though, and the page may show unstyled for a moment, so a page that
  cares has a `style.css`. Pagez once moved such blocks to the head as "page CSS", which a
  `style.css` made a second way to do one thing.

### Element CSS

Element CSS is emitted once and only for elements the page uses, unlayered, before the page's
`style.css` ([elements.md](elements.md#the-style)).

## JavaScript

- `setup` scripts are emitted only for elements the page uses that have one.
- The elements' runtime defines each element, and aborts and cleans up on disconnect.
- Pagez as a library, `compile`, returns the page in its frame, its CSS and its one module. The
  plugin hands them to Vite as one HTML page, the CSS as a `<style>` and the JS as an inline
  module, and Vite bundles and hashes them.
- Templates run at build time in a Vite server, `dev`'s own or one the build makes for every
  page, so a build script imports what the site's folder has, and a change shows on the next
  request.

## Errors

- Markz nodes carry their position and source, so every error points to an exact place.
- An error inside an `=html` definition is offset from the block's position, so a line in a
  template maps back to the page or the `@x-tag.html` file.
- A template that throws as it renders names its line, read from the stack.

## Trust and determinism

- A template's script runs at build time with full Node access. A page is trusted like a script.
- Other `=html` content is emitted verbatim. A `<script>` in it runs only in the browser.
- Pagez is deterministic when the page's code is. Dates, randomness, environment variables and
  reading files or the network in a build script are the author's to avoid.

## Why a page compiler

An HTML page that an AI writes is output. Pagez is a source format and its compiler, so the
comparison is editing generated HTML against editing Markz that builds to HTML.

- **AI is an author, and Pagez is its target.** Markz with elements is a small surface, so a model
  makes fewer mistakes, and the compiler catches the rest at exact positions.
- An edit is a change to the source that a person can review, not a regenerated file.
- The value is in collections kept over time, such as data essays, a book or course material,
  more than in one-off demos.
- **The test is real pages.** Rebuild two or three, starting with
  [amitkaps.com/stories](https://amitkaps.com/stories), a Jekyll page of prose, grouped cards and
  page styling with no behavior. If the source stays pleasant to edit and elements get reused,
  the case is made. If the output HTML gets edited by hand, it isn't.

## What it isn't

- Shadow DOM, JSX, decorators, framework template syntax, attribute languages
- Custom elements for grouping or styling alone
- Typography or color in the reset
- A DOM at build time, hydration, a virtual DOM, reactive state, a runtime props system
- Async render, streaming, rendering again in the browser
- Logic in prose
- Settings in frontmatter
- A frame that grows into a site framework
- One file with the page's images, fonts and CSS inlined ([Why not one file](#the-folder))

What's still open is in [plan.md](plan.md#open-questions).
