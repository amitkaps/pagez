# Development

How pagez is built and changed. What every repository shares, like the scripts, CI and releases, is in [craftz's rules](https://craftz.amitkaps.com/docs/rules.md), and isn't repeated here.

## Build and test

```sh
pnpm install
pnpm dev
pnpm verify    # what CI runs
```

Pagez has no site yet. Its docs read on GitHub, and `pnpm run prose` renders the repository locally.

## Speed and size

```sh
pnpm speed       # this tree against origin/main, on a large site
pnpm hotspots    # where that build's time goes
pnpm size        # what Pagez adds to a page, against its budget
```

`pnpm speed` writes a site of about 300 pages, with shared elements, data, redirects and a template that imports a large package. It builds that site with this tree and with `origin/main` in turns, each in a fresh process. A change counts only when all three rounds show it beyond 5% the same way. `--against <ref>` times against another commit.

`pnpm hotspots` builds that site once under `--cpu-prof` and prints the functions that held the most time. The profile stays in `node_modules/.cache/pagez/` for DevTools.

`pnpm size` measures the theme, the head and the elements' runtime, gzipped, and fails past each budget in `tests/speed/size.ts`. `verify` runs it, so growth shows in the pull request that causes it, and raising a budget is a choice that pull request explains.
