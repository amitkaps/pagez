# Plan

## Where it is

### Test pages

`tests/pages/` holds 42 pages Pagez must build, or must fail on, each saying what it expects. Their
`Open:` notes are design questions to settle before the compiler needs them.

### elementz moved in

Sitez's `src/elementz/` is `src/elementz/` here, unchanged, with its tests in `tests/elementz/`.
The package exports its `html`. Sitez keeps its own copy until it renders through Pagez.

### 0.0.0

Started from [ship's standard](https://ship.amitkaps.com/docs/standard.md), with `pnpm new`. The design moved here from Sitez's
`pagez.md`, and nothing of Pagez is built yet.

## Next, in order

1. **The head moves in.** Sitez's `head.ts`, which writes the head from metadata.
2. **Reset and prose.** `reset.css` and `prose.css`, tried on the stories test page until only
   its look, its sections and its figures need CSS of their own.
3. **The compiler and the command.** One Markz file and its `@x-tag.html` files in, one HTML file
   out, with `${…}` page paths, the frame and the head. The library returns the parts, and
   `pagez` writes them inline, with what the page references
   ([Standalone](design.md#standalone)). It comes first without elements, on the stories test
   page. It's done when every test page builds to its reviewed snapshot, or fails with its
   reviewed error.
4. **Sitez renders through Pagez.** Sitez depends on Pagez and drops its own copies.
5. **The first release, by hand.** Then npm's trusted publisher is set up, so later releases go
   through the workflow.

## Later

## Open questions

Each one the test pages raise is also an `Open:` note on the page that shows it
(`grep -rn "Open:" tests/pages`).

- **Prose's rules.** The exact measure, scale and defaults, settled on the stories test page.
- **Embedded source.** Whether the output carries its own Markz source, so it can be recovered
  and built again.
- **Editor support.** Highlighting an `=html` fence as HTML, and `${…}` in a template as
  JavaScript. That's Markz's tooling, so it's settled there.
- **Dev loop.** Watching and rebuilding, and what invalidates what.
- **The Sitez boundary.** Sitez rendering each page through Pagez, with `pages` and `site` added
  to the context, linked output for caching, and a page's element clashing with a site's as an
  error.
- **A page with no title.** What its `<title>` is: the first heading, the file's name, or none
  (`no-metadata`).
- **The head's image.** Open Graph needs an absolute URL, so a relative `image` resolves against
  `url` and isn't inlined as Standalone says (`head`).
- **Values in prose.** How a list, a number, a boolean and `null` print, and the id of a heading
  that's only an expression, which Markz alone makes `section` (`expressions`).
- **Dotted keys.** Markz reads `author.name` as one key, as YAML does. Whether
  `${page.author.name}` reaches it (`expressions-dotted-key`).
- **A missing value.** Whether `${page.subtitle}` fails when the page has none, or prints nothing
  (`error-expression-missing`).
- **The frame's head.** Which head tags the frame must have, and which Pagez writes (`frame`).
- **A component from a URL.** Whether its tag warns as undefined, since nothing in the build
  defines it (`third-party-component`).
- **Links.** Standalone counts an `href` as a reference, which would inline a plain link's file.
  Whether it covers only `<link href>`, or a link to a relative file is left or fails
  (`standalone-link`).
