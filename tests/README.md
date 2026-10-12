# tests

Pagez's tests, apart from its sources.

- `elementz/` holds elementz's unit tests, one file for each source in `src/elementz/`.
- `pages/` holds the pages Pagez must build, or must fail on, written ahead of the compiler.
- `pages.test.ts` builds each of them, and compares it with its snapshot in `snapshots/`.
