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
2. **The compiler and the command.** One Markz file and its `@x-tag.html` files in, one HTML file
   out, with `${…}` page paths, the frame and the head. The library returns the parts, and
   `pagez` writes them inline, with what the page references
   ([Standalone](design.md#standalone)). It's done when every test page builds to its reviewed
   snapshot, or fails with its reviewed error.
3. **Sitez renders through Pagez.** Sitez depends on Pagez and drops its own copies.
4. **The first release, by hand.** Then npm's trusted publisher is set up, so later releases go
   through the workflow.

## Later

## Open questions

The test pages hold the smaller ones, as `Open:` notes (`grep -rn "Open:" tests/pages`).

- **Page CSS and JS.** Whether they're the frame's, as in Sitez, or plain `=html` blocks too.
- **Dev loop.** Watching and rebuilding, and what invalidates what.
- **The Sitez boundary.** Sitez rendering each page through Pagez, with `pages` and `site` added
  to the context, linked output for caching, and a page's element clashing with a site's as an
  error.
