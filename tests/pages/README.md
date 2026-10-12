# Test pages

The pages Pagez must build, one folder each, written before the compiler to pin down what it
does. Each folder holds a `page.md` and whatever sits beside it, such as `@x-tag.html` files, an
`index.html` frame, scripts, images or a `node_modules`.

- A page opens with a `<!-- Expect: … -->` comment, which says what it builds to, or where it
  fails.
- `Open:` in that comment marks what the design hasn't decided yet. `grep -rn "Open:" tests/pages`
  lists them all, and each is settled in [design.md](../../docs/design.md) before the compiler
  needs it.
- A folder named `error-…` is a page that must fail, at the place its comment names.
- Two pages that must build to the same output say so, as `element-in-page` and `element-file`
  do.

Nothing runs them yet. With the compiler, a test builds each page and compares it with a snapshot
in `tests/snapshots/<page>/`, or an `error-…` page with its `error.txt`, each reviewed as it
changes. That's how Sitez tests its example sites.

## The cases

| Group      | What they cover                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Pages      | `plain`, `no-metadata`, `head`, `raw-html`, `page-css-wins`                                      |
| Prose      | `expressions`, `expressions-dotted-key`                                                          |
| Elements   | `element-…`: defined in the page or a file, slots, nesting, attributes, scripts, behavior, unused |
| Frames     | `frame`, `frame-elements`                                                                        |
| Tags       | `undefined-tag`, `third-party-component`                                                         |
| Standalone | `standalone-…`: relative scripts, images and CSS, packages, URLs, shared imports, links          |
| Errors     | `error-…`: names, expressions, positions inside definitions, missing files, the frame            |
