# Plan

## Where it is

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

1. **The compiler and the command.** One Markz file and its `@x-tag.html` files in, one HTML file
   out, with `${…}` page paths, the frame and the head. The library returns the parts, and
   `pagez` writes them inline, with what the page references
   ([Standalone](design.md#standalone)). It comes first without elements, on the stories test
   page. It's done when every test page builds to its reviewed snapshot, or fails with its
   reviewed error.
2. **Sitez renders through Pagez.** Sitez depends on Pagez and drops its own copies.
3. **The first release, by hand.** Then npm's trusted publisher is set up, so later releases go
   through the workflow.

## Later

## Open questions

Each one the test pages raise is also an `Open:` note on the page that shows it
(`grep -rn "Open:" tests/pages`).

- **Embedded source.** Whether the output carries its own Markz source, so it can be recovered
  and built again.
- **Editor support.** Highlighting an `=html` fence as HTML, and `${…}` in a template as
  JavaScript. That's Markz's tooling, so it's settled there.
- **Dev loop.** Watching and rebuilding, and what invalidates what.
- **The Sitez boundary.** Sitez rendering each page through Pagez, with `pages` and `site` added
  to the context, linked output for caching, and a page's element clashing with a site's as an
  error.
- **Values in prose.** How a list, a number, a boolean and `null` print, and the id of a heading
  that's only an expression, which Markz alone makes `section` (`expressions`).
- **Dotted keys.** Markz reads `author.name` as one key, as YAML does. Whether
  `${page.author.name}` reaches it (`expressions-dotted-key`).
- **A missing value.** Whether `${page.subtitle}` fails when the page has none, or prints nothing
  (`error-expression-missing`).
- **A component from a URL.** Whether its tag warns as undefined, since nothing in the build
  defines it (`third-party-component`).
- **A URL `@import` in page CSS.** An `@import` must come first in CSS, so joining page CSS
  blocks moves one to the top (`stories`).
- **Links.** Standalone counts an `href` as a reference, which would inline a plain link's file.
  Whether it covers only `<link href>`, or a link to a relative file is left or fails
  (`standalone-link`).
- **Wide tables on a phone.** A table wider than the screen pushes the page sideways. CSS alone
  can't scroll it without costing the table its semantics, so the compiler might wrap each table
  in a scrolling `<div>`, which is a change to Markz's markup (`prose`).
- **Wrapped code's indent.** A wrapped line of code hangs a fixed 6ch, since CSS can't see the
  line's own indentation. The compiler knows it, and could mark each line's depth so the wrapped
  part hangs under the line itself. That's a change to Markz's markup too (`prose`).
