# Test pages

The pages Pagez must build, one folder each, written before the compiler to pin down what it
does. Each folder holds an `index.md` and whatever sits beside it, such as `@x-tag.html` files, an
`frame.html`, a `style.css`, scripts, images or a `node_modules`.

- A page opens with a `<!-- Expect: … -->` comment, which says what it builds to, or where it
  fails.
- `Open:` in that comment marks what the design hasn't decided yet. `grep -rn "Open:" tests/pages`
  lists them all, and each is settled in [design.md](../../docs/design.md) before the compiler
  needs it.
- A folder named `error-…` is a page that must fail, at the place its comment names.
- A small element used once is defined in its page, as an author would write it. It's in a file
  where the file is the point, or where it's shared or has behavior.
- Two pages that must build to the same output say so, as `element-in-page` and `element-file`
  do.

`tests/pages.test.ts` builds each page and compares it with its snapshot in
`tests/snapshots/<page>/page.html`, or an `error-…` page with its `error.txt`, each reviewed as it
changes. A page that warns has its warnings in `warnings.txt`. What only a build shows, such as what Vite bundles, is in `tests/vite.test.ts`.

## The cases

| Group      | What they cover                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Pages      | `plain`, `no-metadata`, `head`, `raw-html`, `native-tags`, `prose`                               |
| CSS        | `style-css`, `style-css-elements`, `page-css`, `page-css-wins`                                   |
| Real pages | `stories`, a stand-in with the shape of a real Jekyll page                                       |
| Prose      | `expressions`, `expressions-dotted-key`                                                          |
| Elements   | `element-…`: in the page, a file or a folder, slots, nesting, attributes, scripts, behavior      |
| Frames     | `frame`, `frame-elements`                                                                        |
| Tags       | `undefined-tag`, `third-party-component`                                                         |
| References | `references-…`: images and CSS linked and checked, scripts, packages, URLs, shared imports, links |
| Errors     | `error-…`: names, expressions, positions inside definitions, missing files, the frame, the image |
