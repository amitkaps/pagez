# Design

Pagez is a single-page compiler: one Markz page in, one HTML page out, written beside it in the
page's folder. It is the layer between elementz and Sitez
([sitez.md](https://sitez.amitkaps.com/docs/sitez.md#where-sitez-sits)). It's built as far as
[plan.md](plan.md#where-it-is) says, and this is its design, which started as `pagez.md` in
Sitez.

> The build produces the page. JavaScript enhances the page.

**Keep Pagez small.** There is no Pagez runtime model to understand. There is a compiler that
turns prose plus elements into HTML, CSS and JS, and elementz's small runtime in the output.

## Core model

**The unit is the page.** The page holds its content, its metadata and the elements it uses.
Elements exist in service of the prose.

**An element is one file of plain HTML,** made of a `<template>`, a `<style>` and a `<script>`.
That's elementz's element, the same one Sitez uses ([elementz.md](https://sitez.amitkaps.com/docs/elementz.md)).
It is defined in the page, or in its own `@x-tag.html` file beside it.

In short, it's Web Components in the light DOM, rendered at build time.

**The ideal page** is a simple text page with some behavior, such as an essay with a toggle, a
small interactive figure, or a filterable list.

## Scope

- Input is a folder holding a Markz page, such as `index.md`, and what it uses beside it: a
  `style.css`, its images and fonts, and its `@x-tag.html` elements.
- Output is the page's HTML, `index.html`, written into the same folder. The folder is what's
  kept, served and shared, and the Markz page stays its source ([The folder](#the-folder)).
- Site concerns are Sitez's. Routing, navigation, links between pages and shared caching are out.

## The folder

```
stories/
  index.md       the page, its source
  style.css      its CSS, optional
  img/  fonts/   what it references
  @x-tag.html    an element, optional
  index.html     what Pagez writes
```

`pagez index.md` writes `index.html` beside it. The HTML is readable, and so are the files beside
it, which a browser caches and other pages can reuse. The folder works served from anywhere, and
opened from disk.

A reference is written as a relative path, a package name or a full URL, and that says where its
code or file lives.

| Written as      | Example                     | Pagez                                              |
| --------------- | --------------------------- | -------------------------------------------------- |
| A relative path | `./chart.js`, `./photo.jpg` | links a file as written, and bundles a script      |
| A package name  | `import "d3"`               | bundles it from the `node_modules` beside the page |
| A full URL      | `https://esm.sh/d3`         | leaves it as written                               |

- **Files are linked.** An image, a font, a stylesheet or a video keeps its path, so the HTML
  reads as its source does. One that isn't there fails the build: in the Markdown at its line,
  and in raw HTML or CSS naming the reference.
- **Scripts are inlined.** The page's scripts become one inline module. It holds elementz's
  runtime, the `setup` of each element the page uses, and the page's own module scripts, with
  what they import. A library two elements share is in it once. A browser refuses a module
  script's `src` on a page opened from disk, and runs an inline one, and a package in
  `node_modules` isn't served, so a script is the one thing a folder can't just link.
- Pagez fetches nothing at build time, so the build never depends on the network. A full URL is
  the author's choice to depend on it, and it shows in the output.
- A web component from a package is a script like any other. Pagez bundles it, and the browser
  defines it when the page runs. Only elementz's elements render at build time.
- The bundler is Vite+'s Rolldown, so `vite-plus` is a dependency of Pagez, not only of its build.
- **Why not one file.** Pagez first wrote one standalone file, with every image, font and
  stylesheet inlined as a data URL. Rebuilding amitkaps.com/stories that way made a 1 MB file
  that couldn't be read or cached, with its CSS and images no longer shared, for the one benefit
  of sending a single file. A folder keeps all of it, and works from disk too. One file can come
  back as an export of the folder, if sending one turns out to matter (plan.md, Later).

## Markz and Pagez

Markz is purely syntactic. It parses and never evaluates, and every node carries its position and
source.

| Markz syntax | Markz AST                                        | Markz HTML renderer    | Pagez                                                                        |
| ------------ | ------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `${…}`       | expression node (`value` = inner text)           | prints `value` as code | evaluates it as a `page` path and emits it escaped                           |
| `{@tag …}`   | element node (attributes plus Markdown children) | writes the tag         | writes a native tag as Markz does, and renders a custom one through elementz |
| ` ```=html ` | raw node                                         | emits verbatim         | emits verbatim, except an element's definition                               |

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

| Where           | Parsed by               | Scope                                         | Power             |
| --------------- | ----------------------- | --------------------------------------------- | ----------------- |
| Prose `${…}`    | Markz (expression node) | `page`                                        | dotted paths only |
| Template `${…}` | elementz (raw template) | `attrs`, `page`, `html`, the script's exports | full JavaScript   |

- Prose refers to values, and elements compute.
- Anything beyond a dotted path in prose fails, at the node's position.
- `page` is the page's metadata, the name Sitez uses, so an element that reads only `page` works
  in both.

Sitez doesn't evaluate `${…}` in prose ([its design](https://sitez.amitkaps.com/docs/design.md), "Not in v1"). That difference is a page
feature, not part of the element, so elements stay shared.

## Metadata, never settings

Frontmatter holds the page's metadata, such as `title`, `description`, `url` and `image`. It holds
no settings, as Sitez's `site.md` holds none. Each would-be setting is a convention.

- **The page's CSS** is a `style.css` beside the page. Pagez links it, in place of its reset and
  prose ([Pagez's CSS or the page's](#pagezs-css-or-the-pages)).
- **The frame** is a `frame.html` beside the page, with one `<slot>` for the page, as Sitez's
  `code/index.html` is. With none, Pagez writes a minimal document. It's for a shell the page's
  CSS can't give, such as a header and footer or tags of its own in the head, so most pages have
  none. It isn't `index.html`, which is the page Pagez writes. The frame must not grow layouts,
  partials or site logic.
- **Elements** are the page's own definitions and the `@x-tag.html` files beside it, found by
  name. There's nothing to import.
- **Undefined tags** warn only when a hyphenated tag has no definition and no selector in the
  page's CSS. That catches a typo without a list of tags to allow.

Relative paths resolve from the page file.

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
- **`url`** is the page's full address. The canonical link and `og:url` need it, and are left out
  without it.
- **`image`** is a full address, or a path that resolves against `url`. Open Graph needs a full
  address, so a relative `image` with no `url` fails. It isn't checked as a file beside the page
  otherwise say, since only a crawler reads it, at the page's address. With an image,
  `twitter:card` is `summary_large_image`.
- Sitez's frame also needs a title and a description, since every page of a site keeps them when
  it sets none. A single page needs neither in its frame.

## Elements

The element itself is elementz's, with its template, slot, CSS and `setup`
([elementz.md](https://sitez.amitkaps.com/docs/elementz.md)). Elements nest inside-out, as there. What's Pagez's own is how
elements are used, and where their definitions live.

### Use

- An element is used through Markz, `{@x-tag attr=…}`, optionally with Markdown children.
- An attribute's value may be a prose expression (a `page` path), which evaluates to any value.
- Only a string reaches the browser. A list or an object goes to the template and is never
  written on the tag. Build-time values make HTML, and never become props or state in the
  browser.

### Where definitions live

- **In the page,** one `=html` block per element, named by `<template element="x-tag">`. Its
  `<style>` and `<script>` are siblings in the block. Definitions sit anywhere in the page,
  typically at the end, like footnotes. A behavior-only element has an empty
  `<template element="x-tag"></template>`, which writes no markup.
- **In a file,** `@x-tag.html` beside the page. The file's name is the tag, and an `element`
  attribute is optional and must match.
- Moving an element from the page to a file is a cut and paste. The same file works in Sitez.
- An element's block isn't emitted. All other `=html` content stays verbatim.

### Names

These fail, at their source positions:

- an invalid custom element name
- a reserved name
- two definitions for one name
- a name that isn't lowercase
- an `element` attribute that doesn't match its file's name

## CSS

Markdown comes first, so a page with no CSS of its own reads well, in the system's fonts. A page
with a design of its own brings it in `style.css`, and an element brings its own.

### Layers

Pagez's CSS opens with one declaration, which makes the order of the cascade public.

```css
@layer reset, prose, elements;
```

| Layer       | Holds                                              |
| ----------- | -------------------------------------------------- |
| `reset`     | a small normalization, with no typography or color |
| `prose`     | classless typography for what Markdown writes      |
| `elements`  | the CSS of each element the page uses, once        |
| _unlayered_ | the page's `style.css`                             |

- Pagez's CSS is a `<style>` in the head, since it isn't a file beside the page, and `style.css` is
  a `<link>` after it.
- Unlayered CSS beats every layer, so the page's rules win whatever their specificity.
- A page can add to a layer by name. `@layer prose { … }` adjusts the typography, and still
  loses to the page's own CSS.

### Reset and prose

They follow the common modern resets (Josh Comeau's, Andy Bell's), [good-css](https://good-css.com/)
and modern font stacks, with what Markdown needs changed. Each choice is checked on the `stories`
and `prose` test pages, in light, dark and at a phone's width. The structure is settled, but the
width and the typography's numbers are a first pass, still to improve
([Prose's look](plan.md#open-questions)).

- **The reset** has no typography or color. It sets `box-sizing: border-box`, keeps a phone from
  enlarging text on its own, zeroes block margins, keeps media no wider than its container, gives
  form controls the page's font at 16px or more so iOS doesn't zoom, and leaves room above a
  heading linked to by its id. An image stays inline, unlike in those resets, since Markdown puts
  an image in a paragraph.
- **Prose** styles native elements only, with no classes. Its rules are in `:where()`, so their
  order decides between them, and a page's or an element's CSS beats them by layer anyway.
- **Fonts.** Headings are serif and text is sans, in the system's fonts: New York and SF Pro on
  Apple, through `ui-serif` and `ui-sans-serif`, which only Safari reads, then Charter, Sitka or
  Cambria, and `system-ui`. Code is `ui-monospace` and its stack. Every font is sized to the
  text's x-height with `font-size-adjust`, so code needs no smaller size and a fallback font
  matches.
- **Flow.** Space goes above a block and never below, and a first child has none, so spacing is
  in one direction and needs no list of containers. Headings have more above them and less after
  them. Prose sets block margins itself, so a `style.css` can import it without the reset.
- **Scale.** Headings step by `--prose-ratio`, 1.25, from `pow()`. The top two steps grow with the
  screen, within 2.5 times their smallest, so zoomed text still grows. The steps are
  `--prose-step-1` to `--prose-step-4`, for a page's or an element's CSS to use too. Headings
  are balanced and trimmed to their letters with `text-box` where the browser can, and text is
  `pretty`, with hyphens on a narrow screen.
- **Size.** Text is 16px on a phone, growing to 18px on a wide screen, in `rem` so the reader's
  own setting scales it. Every size and space in prose is in `rem`, so it grows too.
- **The measure,** 50ch, is about 72 characters a line, within typography's 45 to 75, and close
  to a Svbtle post's 600px at 18px. A `ch` is
  the width of a "0", which is wider than the average letter and space, so 65ch, the usual
  figure, is about 90 characters, measured. It's on each block, not on its container, and
  centers it. So a section's
  background reaches the screen's edges while its text keeps to the measure, and a page needs no
  wrapper. A content grid with breakout columns was the alternative, but it needs page CSS for
  each full-width section, and a float in a grid is ignored. `--prose-measure` is a registered
  length, so it's worked out once, in the page's font, and a heading lines up with the
  paragraphs.
- **Color.** Prose sets `color-scheme: light dark`, and the minimal document's head says so too,
  so dark mode works with no palette. Tints and rules are mixed from `--prose-accent`, the text's
  own color unless a page sets one, so they follow the scheme and the page's colors. More
  contrast, when asked for, makes them stronger. A page that sets a light background of its own
  sets `color-scheme: light` too, or its text turns light in dark mode.
- **Code blocks wrap** rather than scroll, so a long line is seen whole on a phone. Its wrapped
  part hangs 6ch in, which is deeper than most lines start, so it isn't read as a new line. CSS
  measures that from the box, not from the line's own indentation, so a deeply nested line can
  still mislead.
- **On paper,** a page is light, shows each link's address and keeps a block on one page.
- **Custom properties** change prose in a line: `--prose-font`, `--prose-heading-font`,
  `--prose-mono`, `--prose-leading`, `--prose-measure`, `--prose-gutter`, `--prose-ratio` and
  `--prose-accent`. A custom font is an `@font-face` and one of them, and sans headings are
  `--prose-heading-font: var(--prose-font)`.
- **Left out on purpose:** `font-synthesis: none`, which would leave `_emphasis_` plain in a font
  with no italic; restyled list markers, which cost a list its semantics in Safari; a table that
  becomes cards on a phone, which needs a label on every cell; and focus styles, which the
  browser does well.
- Both are files in the package, `@amitkaps/pagez/reset.css` and `@amitkaps/pagez/prose.css`,
  each small enough to read in a sitting. Their version is Pagez's. Changing them changes every
  page, so they change rarely.

### Pagez's CSS or the page's

- **With no `style.css` and no frame,** the page gets the reset and prose. That's the
  Markdown-first page.
- **With a `style.css`,** the page's CSS is its own design, and replaces the reset and prose. It's
  linked as written, so it reads, caches and is shared like any file, and it can `@import` and
  `url()` the fonts and images beside it. A `style.css` that wants prose as its start imports it
  by URL, or keeps a copy beside it.
- **With a frame,** the frame is the design, and gets neither, as in Sitez. A `style.css` is still
  linked.
- So there's no setting. Sitez dropped its reset because amitkaps.github.io's first rules undid
  it, and a site with a design of its own brings its CSS.
- **A `<style>` in an `=html` block is raw HTML,** written where it is, like any other. A browser
  applies it, unlayered, so a page kept as one Markz file can carry its CSS. HTML wants a
  `<style>` in the head, though, and the page may show unstyled for a moment, so a page that
  cares has a `style.css`. Pagez once moved such blocks to the head as "page CSS", which a
  `style.css` made a second way to do one thing.

### Element CSS

Element CSS is in `@layer elements`, emitted once and only for elements the page uses
([elementz.md](https://sitez.amitkaps.com/docs/elementz.md#css)).

## JavaScript

- `setup` scripts are emitted only for elements the page uses that have one.
- elementz's runtime defines each element, and aborts and cleans up on disconnect.
- Pagez as a library returns the head, the body, and the CSS and JS of the elements used. Its
  command writes them into `index.html`, the CSS as a `<style>` and the JS as one inline module.
  Sitez gives the same parts to Vite, which bundles and hashes them. One core has two consumers,
  and neither is an option.

## Errors

- Markz nodes carry their position and source, so every error points to an exact place.
- An error inside an `=html` definition is offset from the block's position, so a line in a
  template maps back to the page or the `@x-tag.html` file.

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
- Multiple pages, which are Sitez's
- One file with the page's images, fonts and CSS inlined ([Why not one file](#the-folder))

What's still open is in [plan.md](plan.md#open-questions).
