# AGENTS.md

pagez — Markdown, as pages.

## Standard

This repository follows the standard at [ship](https://ship.amitkaps.com), which sets how every repository builds, checks and deploys. Read [the standard](https://ship.amitkaps.com/docs/standard.md) before changing any of that.

- Change the toolchain, scripts, versions or deploys in ship first, then bring each repository in line. Don't change them in one repository alone.
- Work on a branch and open a pull request. CI runs `pnpm run verify`, which must pass, and the pull request is squash-merged. Nobody pushes to `main`.
- Run tools through `pnpm run …` and `pnpm exec`, not global installs.
- A held check on ship's page is a tool's limit, not a choice. Leave it until its reason goes away.

## Prose

Explanations go in `@prose` comments, written to the rules in [prose's usage](https://prose.amitkaps.com/docs/usage.md#for-agents). Read them before writing prose. They live there and aren't copied here, so every repository writes to the same rules.

## This repository

- Nothing yet beyond the standard. What's particular to pagez goes here.
