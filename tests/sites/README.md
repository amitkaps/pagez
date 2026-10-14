# Test sites

The sites Pagez must build, or must fail on, one folder each, as [the test pages](../pages/) are
for one page. Each is a folder of pages, with what [folders.md](../../docs/folders.md#the-rules)
says about many pages: a page at its folder's path, the nearest `style.css` and `frame.html`,
`pagez.md` at the root, and links between pages.

- Each page opens with a `<!-- Expect: … -->` comment, which says what it builds to.
- A folder named `error-…` is a site that must fail, at the place its pages' comments name.

`tests/sites.test.ts` builds every page of each site and compares it with its snapshot in
`tests/snapshots/sites/<site>/`, at the path it's built at, or an `error-…` site with its
`error.txt`. What only a build shows, such as `dist/`'s folders, is in `tests/vite.test.ts`.

| Site                       | What it covers                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `folders`                  | a page at /, /about/ and in folders, each with its own design, an element from the root |
| `error-path-twice`         | `about.md` beside `about/index.md`                                                 |
| `error-built-file`         | an `index.html` where a page is built                                              |
| `error-site-file-below`    | a `pagez.md` below the root                                                        |
| `error-page-url`           | a page's `url` beside `pagez.md`'s                                                 |
| `error-link-missing`       | a link in the text to a `.md` that isn't a page                                    |
| `error-frame-link-missing` | a link in a frame to a `.md` that isn't a page                                     |
