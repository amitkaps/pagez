# Test sites

The sites Pagez must build, or must fail on, one folder each, as [the test pages](../pages/) are
for one page. Each is a folder of pages, with what [pages](../../docs/pages.md#the-folder)
says about many pages: a page at its folder's path, the nearest `style.css` and `frame.html`,
`pagez.md` at the root, links between pages, and what a site adds, from `pages` to redirects.

- Each page opens with a `<!-- Expect: … -->` comment, which says what it builds to.
- A folder named `error-…` is a site that must fail, at the place its pages' comments name.

`tests/sites.test.ts` builds every page of each site, its `404.html` and its redirects, and compares each with its snapshot
in `tests/snapshots/sites/<site>/`, at the path it's built at, or an `error-…` site with its
`error.txt`. What only a build shows, such as `dist/`'s folders, is in `tests/vite.test.ts`.

Each site is cited by the rules it holds, in [pages](../../docs/pages.md), and each `error-…` site fails with an id from [the Errors table](../../docs/pages.md#errors), its last word in `error.txt`.
