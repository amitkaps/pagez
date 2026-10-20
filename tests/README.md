# tests

Pagez's tests, apart from its sources.

- `elements/` holds the elements' unit tests, one file for each source in `src/elements/`.
- `pages/` holds the pages Pagez must build, or must fail on, written ahead of the compiler.
- `pages.test.ts` builds each of them, and compares it with its snapshot in `snapshots/`.
- `sites/` holds folders of many pages, and `sites.test.ts` builds every page of each, to its snapshot in `snapshots/sites/`.
- `speed/` holds the scripts that time a large build and hold a page's size to a budget.
