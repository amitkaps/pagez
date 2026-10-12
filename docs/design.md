# Design

Pagez is a single-page compiler: one Markz file in, one HTML file out. It is the layer between
elementz and Sitez ([sitez.md](https://sitez.amitkaps.com/docs/sitez.md#where-sitez-sits)). It isn't built yet, and this is
its design, which started as `pagez.md` in Sitez.

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

- Input is one Markz file, and the `@x-tag.html` files beside it.
- Output is one standalone HTML file, with its markup, CSS and behavior inline
  ([Standalone](#standalone)).
- Site concerns are Sitez's. Routing, navigation, links between pages and shared caching are out.

## Standalone

The output is one HTML file that works with nothing beside it, opened from disk or offline. How a
reference is written says where its code or file lives, and so whether Pagez inlines it. A
reference is an `import`, a `src`, an `href` or a CSS `url()`.

| Written as      | Example                     | Pagez                                              |
| --------------- | --------------------------- | -------------------------------------------------- |
| A relative path | `./chart.js`, `./photo.jpg` | inlines it, bundling a script with its imports     |
| A package name  | `import "d3"`               | bundles it from the `node_modules` beside the page |
| A full URL      | `https://esm.sh/d3`         | leaves it as written                               |

- The page's scripts become one inline module. It holds elementz's runtime, the `setup` of each
  element the page uses, and the page's own module scripts, with what they import. A library two
  elements share is in it once.
- Inlining is what makes the file work from disk. A browser refuses a module script's `src` on a
  page opened that way, and runs an inline one.
- Pagez fetches nothing at build time, so the build never depends on the network. A full URL is
  the author's choice to depend on it, and it shows in the output.
- A web component from a package is a script like any other. Pagez bundles it, and the browser
  defines it when the page runs. Only elementz's elements render at build time.
- The bundler is Vite+'s Rolldown, so `vite-plus` is a dependency of Pagez, not only of its build.
- A large library or image makes a large page, and nothing is cached between pages. Caching across
  pages is Sitez's, which gives the same parts to Vite.

## Markz and Pagez

Markz is purely syntactic. It parses and never evaluates, and every node carries its position and
source.

| Markz syntax | Markz AST                                        | Markz HTML renderer    | Pagez                                                                        |
| ------------ | ------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `${…}`       | expression node (`value` = inner text)           | prints `value` as code | evaluates it as a `page` path and emits it escaped                           |
| `{@tag …}`   | element node (attributes plus Markdown children) | writes the tag         | writes a native tag as Markz does, and renders a custom one through elementz |
| ` ```=html ` | raw node                                         | emits verbatim         | emits verbatim, except an element's definition and page CSS                  |

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

- **The frame** is an `index.html` beside the page, with one `<slot>` for the page, as Sitez's
  `code/index.html` is. With none, Pagez writes a minimal document. The frame must not grow
  layouts, partials or site logic.
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
  address, so a relative `image` with no `url` fails. It isn't inlined, as Standalone would
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

Markdown comes first, so a page with no CSS of its own reads well, in the system's fonts. The
page's CSS is then only its look, its sections and its elements.

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
| _unlayered_ | the page's own CSS                                 |

- Unlayered CSS beats every layer, so the page's rules win whatever their specificity.
- A page can add to a layer by name. `@layer prose { … }` adjusts the typography, and still
  loses to the page's own CSS.

### Reset and prose

They follow the common modern resets (Josh Comeau's, Andy Bell's) and modern font stacks, with
what Markdown needs changed.

- **The reset** sets `box-sizing: border-box`, keeps a phone from enlarging text on its own,
  takes the body's margin away, keeps media no wider than its container, gives form controls the
  page's font, and leaves room above a heading linked to by its id. An image stays inline, unlike
  in those resets, since Markdown puts an image in a paragraph.
- **Prose** styles native elements only, with no classes. It has a system font stack, a line
  height of 1.6, a modest heading scale, balanced headings and pretty paragraphs. It covers
  quotes, lists, code, tables, figures and rules.
- **The measure,** 65ch, is on each block, not on its container, and centers it. So a section's
  background reaches the screen's edges while its text keeps to the measure, and a page needs no
  wrapper. `--prose-measure` is a registered length, so it's worked out once, in the page's
  font, and a heading lines up with the paragraphs.
- **Color.** Prose sets `color-scheme: light dark`, so dark mode works with no palette. Its tints,
  for code and rules, are mixed from the text's color, so they follow the scheme and a page's own
  colors. A page that sets a light background of its own sets `color-scheme: light` too, or its
  text turns light in dark mode.
- **Custom properties** change prose in a line: `--prose-font`, `--prose-mono`,
  `--prose-leading`, `--prose-measure` and `--prose-gutter`. A custom font is an `@font-face` and
  `--prose-font`.
- Both are files in the package, `@amitkaps/pagez/reset.css` and `@amitkaps/pagez/prose.css`,
  each small enough to read on one screen. Their version is Pagez's. Changing them changes every
  page, so they change rarely.

### With a frame and without

- **Without a frame,** Pagez's minimal document has the reset and prose. That's the Markdown-first
  page.
- **With a frame,** the frame is the page's own design, and Pagez adds only element CSS, as Sitez
  does. A frame that wants prose imports it, as `@import "@amitkaps/pagez/prose.css";`.
- So there's no setting. Sitez dropped its reset because amitkaps.github.io's first rules undid
  it, and a site with a design of its own has a frame.

### Page CSS

- A `<style>` in an `=html` block that isn't an element's definition is page CSS.
- Pagez moves it into the head, unlayered, and joins several blocks in page order.
- Its place in the page doesn't matter. By convention it goes at the end, so prose comes first
  where the Markdown is read as it is, as on GitHub.

### Element CSS

Element CSS is in `@layer elements`, emitted once and only for elements the page uses
([elementz.md](https://sitez.amitkaps.com/docs/elementz.md#css)).

## JavaScript

- `setup` scripts are emitted only for elements the page uses that have one.
- elementz's runtime defines each element, and aborts and cleans up on disconnect.
- Pagez as a library returns the head, the body, and the CSS and JS of the elements used. Its
  command writes them inline as one file. Sitez gives the same parts to Vite, which bundles and
  hashes them. One core has two consumers, and neither is an option.

## Errors

- Markz nodes carry their position and source, so every error points to an exact place.
- An error inside an `=html` definition is offset from the block's position, so a line in a
  template maps back to the page or the `@x-tag.html` file.

## Trust and determinism

- A template's script runs at build time with full Node access. A page is trusted like a script.
- Other `=html` content is emitted verbatim, except page CSS, which moves to the head, and the
  references it inlines ([Standalone](#standalone)). A `<script>` in it runs only in the browser.
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

What's still open is in [plan.md](plan.md#open-questions).
