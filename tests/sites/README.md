# Test sites

The sites Pagez must build, or must fail on, one folder each, as [the test pages](../pages/) are
for one page. Each is a folder of pages, with what [folders.md](../../docs/folders.md#the-rules)
says about many pages: a page at its folder's path, the nearest `style.css` and `frame.html`,
`pagez.md` at the root, links between pages, and what a site adds, from `pages` to redirects.

- Each page opens with a `<!-- Expect: … -->` comment, which says what it builds to.
- A folder named `error-…` is a site that must fail, at the place its pages' comments name.

`tests/sites.test.ts` builds every page of each site, its `404.html` and its redirects, and compares each with its snapshot
in `tests/snapshots/sites/<site>/`, at the path it's built at, or an `error-…` site with its
`error.txt`. What only a build shows, such as `dist/`'s folders, is in `tests/vite.test.ts`.

| Site                       | What it covers                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `folders`                  | a page at /, /about/ and in folders, each with its own design, an element from the root |
| `blog`                     | `pages` and `site` in a template, links from the root, a draft, `404.md`, redirects |
| `error-path-twice`         | `about.md` beside `about/index.md`                                                 |
| `error-built-file`         | an `index.html` where a page is built                                              |
| `error-site-file-below`    | a `pagez.md` below the root                                                        |
| `error-page-url`           | a page's `url` beside `pagez.md`'s                                                 |
| `error-link-missing`       | a link in the text to a `.md` that isn't a page                                    |
| `error-frame-link-missing` | a link in a frame to a `.md` that isn't a page                                     |
| `error-link-draft`         | a link to a draft                                                                  |
| `error-link-redirect`      | a link to a redirect                                                               |
| `error-link-site-path`     | a link from the root to neither a page nor a file in `public/`                     |
| `error-redirect-page`      | a redirect from a page's own path                                                  |
| `error-draft-yes`          | `draft: yes`, which YAML reads as a string                                          |
| `error-not-found-url`      | a `404.md` with no `url` in `pagez.md`                                             |
