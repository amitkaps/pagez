# AGENTS.md

pagez — Markdown, as pages.

## craftz

This repository follows [craftz's rules](https://craftz.amitkaps.com/docs/rules.md). Run `pnpm craftz rules` before changing the toolchain, scripts, versions, CI or deploys, and change them in craftz first, never in one repository alone.

- Open a pull request with `pnpm pr "<title>"`, and add `--label <label>` in a package. It commits, runs `pnpm run verify`, pushes and turns on auto-merge. Don't wait for the merge, and add `--wait` to a session's last change. Nobody pushes to `main`.
- `pnpm craftz status` says what's live. `pnpm <tool> help <command>` says what a command does, for the version installed.
- Run tools through `pnpm run …` and `pnpm exec`, not global installs.

## Prose

Explanations go in `@prose` comments, and every Markdown file is prose too.

- Run `pnpm prose rules` before your first edit to a `@prose` comment or a `.md` file, and again after the conversation is summarized. Changing code a `@prose` comment explains counts as an edit.
- After writing, run `pnpm prose style <files>` on the files you changed, and take its advice where it reads better.

## Outline

Every file in this repository with its summary, which `pnpm run verify` writes. Run `pnpm prose outline` when it's missing.

@outline.md

## This repository

- The docs describe Pagez alone, with no other tool's history and no one site's names in them. Package and tool names stay, such as `@amitkaps/pagez` and craftz's URLs, since they're what's published. History keeps its reason and drops its source, and evidence keeps its finding with a neutral example.
- The plan looks forward: what's next, in order, and what works now. What a piece of work taught goes in `docs/lessons.md`, and what it shipped is in git and the release notes.
