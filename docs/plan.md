# Plan

## Where it is

### 0.0.0

Started from [ship's standard](https://ship.amitkaps.com/docs/standard.md), with `pnpm new`. The design moved here from Sitez's
`pagez.md`, and nothing of Pagez is built yet.

## Next, in order

1. **elementz moves in.** Sitez's `src/elementz/`, which imports nothing from the rest of Sitez,
   moves here with its tests.
2. **The head moves in.** Sitez's `head.ts`, which writes the head from metadata.
3. **The compiler and the command.** One Markz file and its `@x-tag.html` files in, one HTML file
   out, with `${…}` page paths, the frame and the head. The library returns the parts, and
   `pagez` writes them inline.
4. **Sitez renders through Pagez.** Sitez depends on Pagez and drops its own copies.
5. **The first release, by hand.** Then npm's trusted publisher is set up, so later releases go
   through the workflow.

## Later

## Open questions

- **Page CSS and JS.** Whether they're the frame's, as in Sitez, or plain `=html` blocks too.
- **Assets.** Whether relative images are copied, inlined, or left as they are.
- **Dev loop.** Watching and rebuilding, and what invalidates what.
- **The Sitez boundary.** Sitez rendering each page through Pagez, with `pages` and `site` added
  to the context, linked output for caching, and a page's element clashing with a site's as an
  error.
