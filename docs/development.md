# Development

How pagez is built and changed. What every repository shares, like the scripts, CI and releases, is in [craftz's rules](https://craftz.amitkaps.com/docs/rules.md), and isn't repeated here.

## Build and test

```sh
pnpm install
pnpm dev
pnpm verify    # what CI runs
```

Pagez has no site yet. Its docs read on GitHub, and `pnpm run prose` renders the repository locally.
