# speed

How fast Pagez builds, and how much it adds to a page. These are scripts, not tests, and [development](../../docs/development.md#speed-and-size) says how to run them.

- `site.ts` writes the large site that the speed scripts build.
- `speed.ts` times this tree against another commit on that site (`pnpm speed`), or profiles one build (`pnpm hotspots`).
- `size.ts` holds the theme, the head and the runtime to their budgets (`pnpm size`).
