# pagez

pagez — Markdown, as pages.

A folder holds `index.md`, written in [Markz](https://github.com/amitkaps/markz), and what it uses:
a `style.css`, a `frame.html`, images and fonts. Pagez compiles the page, writes its head from its
frontmatter, checks that every file it references is there, and Vite bundles them with hashed
names.

```text
stories/
├── index.md      the page
├── style.css     its design, in place of Pagez's reset and prose
├── frame.html    the document around it, optional
├── img/
└── fonts/
```

```sh
pagez build stories     # writes stories/dist/
pagez dev stories       # serves it while it's written
pagez preview stories   # serves what was built
```

A folder with its own Vite config adds the plugin instead:

```js
import pagez from "@amitkaps/pagez/vite";

export default { plugins: [pagez()] };
```

0.1 builds one page without elements or `${…}`. Elements, many pages and the rest of Sitez come
next, in [the plan](docs/plan.md#next-in-order), and [folders.md](docs/folders.md) is where it's
going.

## Install

```sh
pnpm add -D @amitkaps/pagez vite-plus
```

It needs Node 26 or newer, the Node it's built and tested on.

## Development

```sh
pnpm install
pnpm dev
pnpm verify    # what CI runs
```

Read [the docs](docs/README.md) for its design, plan and lessons. It follows [ship's standard](https://ship.amitkaps.com/docs/standard.md) for how it builds, checks and releases.
