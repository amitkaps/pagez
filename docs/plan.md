# Plan

## Where it is

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
   `pagez` writes them inline.
3. **Sitez renders through Pagez.** Sitez depends on Pagez and drops its own copies.
4. **The first release, by hand.** Then npm's trusted publisher is set up, so later releases go
   through the workflow.

## Later

## Open questions

- **Page CSS and JS.** Whether they're the frame's, as in Sitez, or plain `=html` blocks too.
- **`vite-plus` at run time.** `file.ts` parses scripts with `vite-plus`'s `parseAst`, which is a
  dev dependency here. Once the package exports more than `html`, it's a peer dependency, as in
  Sitez, or a parser of its own.
- **Assets.** Whether relative images are copied, inlined, or left as they are.
- **Dev loop.** Watching and rebuilding, and what invalidates what.
- **The Sitez boundary.** Sitez rendering each page through Pagez, with `pages` and `site` added
  to the context, linked output for caching, and a page's element clashing with a site's as an
  error.
