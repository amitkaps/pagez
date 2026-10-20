# Usage

How to install Pagez, build a folder with it, and what an agent writing pages should know. [Pages](pages.md) has the rules a page and a site follow, and [elements](elements.md) has an element's.

## Install

```sh
pnpm add -D @amitkaps/pagez vite-plus
```

It needs Node 26 or newer, the Node it's built and tested on. `vite-plus` is a peer dependency, since Pagez builds through it.

## Build

The smallest site is one page.

```text
site/
├── index.md      the page at /
└── photo.jpg     what it uses, beside it
```

```sh
pagez build site     # writes site/dist/
pagez dev site       # serves it while it's written
pagez preview site   # serves what was built
```

Each command takes the folder, or works in the current one. They're Vite's own commands with Pagez's plugin, and they never write to the folder outside `dist/`. A mistake prints its file, its line and what to change, and exits with 1. `build` then prints each page's size and the CSS and JavaScript the pages share.

`dist/` needs a server, as any built site does. Its base is `./`, so it works at a site's root or under a path.

## In a Vite config

A folder with a Vite config of its own adds the plugin to it.

```js
import pagez from "@amitkaps/pagez/vite";

export default { plugins: [pagez()] };
```

Then `vp build`, `vp dev` and `vp preview` build the folder, as `pagez build|dev|preview` would.

## As a library

`compile` builds one page in memory, for a host that bundles it itself. It returns the page in its frame, its CSS and its one module. `html` is what an element's build script writes markup with, and `FileError` is a failure with its file and line.

```js
import { compile, html, FileError } from "@amitkaps/pagez";
```

## For agents

What an agent writing pages for Pagez should know, as a snippet to copy into its instructions.

```md
## Pagez

This folder is built by Pagez. Read its rules at https://github.com/amitkaps/pagez/blob/main/docs/pages.md and https://github.com/amitkaps/pagez/blob/main/docs/elements.md before writing a page or an element.

- A page is a `.md` in Markz, at its folder's path. What it uses sits beside it, by relative path.
- Frontmatter is metadata, such as `title`, `description` and `image`. It holds no settings.
- The design is the nearest `style.css` and `frame.html`. With neither, the page gets Pagez's theme.
- Link to a page by its `.md`. Every link and file is checked, so a broken one fails the build.
- Use a native tag, `{@section}`, for grouping and styling. Write an `@x-tag.html` element only for markup that's reused or derived, or for behavior.
- Prose `${…}` prints a path into `page`. Anything that computes belongs in an element.
- Run `pagez build` after a change. Fix each failure at the file and line it names.
```
