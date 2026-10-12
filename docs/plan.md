# Plan

## Where it is

### The compiler writes the folder

`pagez index.md` writes `index.html` beside it, with its files linked as written and each checked,
so a missing one fails the build. A `style.css` beside the page is linked in place of the reset
and prose, the frame is `frame.html`, and a `<style>` in an `=html` block is raw HTML like any
other. `standalone.ts` and its data URLs are gone. The design changed after rebuilding stories, as
one file was 1 MB of base64 that couldn't be read, cached or shared
([The folder](design.md#the-folder)). 17 test pages build, and 33 are todos. Stories builds
through it, with its Jekyll CSS, images and font as they are, to a 34 KB `index.html` whose every
block sits where the Jekyll page's does, wide and on a phone.

### Stories, rebuilt

amitkaps.com/stories, a Jekyll page of six chapters and 41 images, was rebuilt as one Markz page
in its own, private repository, beside the Jekyll site. It builds to a 1 MB file that opens from
disk, and its CSS went from 208 lines to about 70. What it found is in the open questions, and a
frame may now write social tags Pagez doesn't, such as `twitter:site`.

### The compiler, without elements

`src/page.ts` compiles a page into its parts: Markz's HTML in the frame, the head written from
its metadata, and its CSS, with the reset and prose when there's no frame. Page CSS moves to the
head, each block its own `<style>`, which settled where a URL `@import` goes. `src/standalone.ts`
writes the parts as one file, with each file beside the page inlined as a data URL, and the
`pagez` command runs both. 16 test pages build to their reviewed snapshots or fail with their
reviewed errors, and 33 are todos, waiting for elements, expressions, the bundler and links. The
frame's errors now give their line.

### Reset and prose

`css/reset.css` and `css/prose.css`, exported by the package, from the common modern resets,
good-css, Vizchitra's prose and a draft of its own. Serif headings and sans text in the system's
fonts, one-way flow, a modular scale, an accent color, and print and contrast styles. Tried on the
`stories` test page, whose CSS is now only its look, its sections and its figures, and on the
`prose` test page of every Markdown element, in light, dark and at a phone's width
([Reset and prose](design.md#reset-and-prose)).

### The head moved in

Sitez's `head.ts` is `src/head.ts`: the frame's checks, and the head written from metadata. It
dropped what's Sitez's, the 404 page, redirects and linked stylesheets, and settled a page with no
title, the head's image and the frame's head ([Head](design.md#head)).

### Test pages

`tests/pages/` holds 49 pages Pagez must build, or must fail on, each saying what it expects. Their
`Open:` notes are design questions to settle before the compiler needs them.

### elementz moved in

Sitez's `src/elementz/` is `src/elementz/` here, unchanged, with its tests in `tests/elementz/`.
The package exports its `html`. Sitez keeps its own copy until it renders through Pagez.

### 0.0.0

Started from [ship's standard](https://ship.amitkaps.com/docs/standard.md), with `pnpm new`. The design moved here from Sitez's
`pagez.md`, and nothing of Pagez is built yet.

## Next, in order

The direction is [folders.md](folders.md): Pagez builds a hierarchy of folders, one page or a
site, to `dist/`, and Sitez folds into it. `design.md` is rewritten to it step by step.

1. **`dist/` through Vite.** Pagez as a Vite plugin, which `pagez` runs, building a page to
   `dist/` with its CSS, images and fonts hashed, and `vp dev` serving it. Writing `index.html`
   beside the page goes, and `public/` at the root is copied as it is.
2. **Stories deploys from `dist/`.** Its repository becomes the folder, with a modernised
   `style.css`, smaller images and a subset of its font, and the Jekyll files go.
3. **The rest of the compiler.** Elementz's elements, one definition per name anywhere in the
   tree, `${…}` page paths in prose, and the bundler for the page's scripts. It's done when every
   test page builds to its reviewed snapshot, or fails with its reviewed error, and no todo is
   left.
4. **Many pages.** Every `.md` a page at its folder's path, the nearest `style.css` and
   `frame.html`, `pagez.md` at the root, and Sitez's site features moved in: links between pages,
   `pages` and `site`, drafts, redirects, `404.md` and the build report. Tested on a set of
   folders, each with its own design.
5. **amitkaps.github.io moves to Pagez.** Then Sitez is archived, and the elementz docs move here.
6. **The first release, by hand.** Then npm's trusted publisher is set up, so later releases go
   through the workflow.

## Later

- **A single page's exports.** `index.html` written beside the page, or the whole page inlined into
  one HTML file, for opening from disk or sending as one file. Pagez had both, and dropped them
  for `dist/`. They come back if a single page turns out to need them.

## Open questions

Each one the test pages raise is also an `Open:` note on the page that shows it
(`grep -rn "Open:" tests/pages`).

- **Folders.** The URL of `about.md`, `/about/` or `/about.html`, and where the elementz docs live
  once Sitez goes ([folders.md](folders.md#open-questions)).
- **Prose's look.** The width and the typography aren't right yet, and the numbers in
  [Reset and prose](design.md#reset-and-prose) are a first pass to improve on. What's been tried:
  65ch, which measured about 90 characters a line, then 50ch at 18px, about 72, beside a Svbtle
  post. Still to judge, on the `prose` and `stories` pages: the measure, the body size and how it
  grows, the heading font and scale, the space between paragraphs and around headings, and the
  balance of serif headings with sans text. Each change is checked in light, dark and at a phone's
  width, and against a page that reads well.

- **The measure's model.** Prose centers each block on the measure, which fights a page with a
  side column. Rebuilding amitkaps.com/stories, its figures floated beside a left-aligned column
  needed page CSS to undo the measure on every block. Whether the measure aligns to the start,
  or leaves room for a side column.
- **Space after a heading, and the gutter in a padded section.** A heading straight after another
  gets 1rem, which reads as one block. A page that pads its sections gets that padding and prose's
  gutter both, so a phone's column narrows. Both are part of prose's look.
- **A heading's id repeating an element's.** `{@section #ideas}` holding `## Ideas` writes the id
  twice. Markz warns for two headings with one id, not for a heading and an element
  (`native-tags`).
- **Markz's warnings.** Pagez doesn't print them yet. Whether it prints them, or fails on them.
- **Where `image` resolves.** Against `url`, as now, which differs from the file's place when the
  page isn't where the site serves it. Or against the file, then made absolute with `url`.
- **Smart punctuation.** Jekyll writes curly quotes, and Markz keeps straight ones. Whether that's
  Markz's, Pagez's or the author's.
- **Editor support.** Highlighting an `=html` fence as HTML, and `${…}` in a template as
  JavaScript. That's Markz's tooling, so it's settled there.
- **Dev loop.** Watching and rebuilding, and what invalidates what.
- **Values in prose.** How a list, a number, a boolean and `null` print, and the id of a heading
  that's only an expression, which Markz alone makes `section` (`expressions`).
- **Dotted keys.** Markz reads `author.name` as one key, as YAML does. Whether
  `${page.author.name}` reaches it (`expressions-dotted-key`).
- **A missing value.** Whether `${page.subtitle}` fails when the page has none, or prints nothing
  (`error-expression-missing`).
- **A component from a URL.** Whether its tag warns as undefined, since nothing in the build
  defines it (`third-party-component`).
- **Links.** Whether a link to a relative file, such as `./data.csv`, is checked like an image,
  or left to the author, since a link to another page is Sitez's (`standalone-link`).
- **Wide tables on a phone.** A table wider than the screen pushes the page sideways. CSS alone
  can't scroll it without costing the table its semantics, so the compiler might wrap each table
  in a scrolling `<div>`, which is a change to Markz's markup (`prose`).
- **Wrapped code's indent.** A wrapped line of code hangs a fixed 6ch, since CSS can't see the
  line's own indentation. The compiler knows it, and could mark each line's depth so the wrapped
  part hangs under the line itself. That's a change to Markz's markup too (`prose`).
