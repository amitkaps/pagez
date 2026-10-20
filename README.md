# pagez

pagez — Markdown, as pages.

A folder holds pages written in [Markz](https://github.com/amitkaps/markz), each `.md` at its folder's path, and what they use: a `style.css`, a `frame.html`, images and fonts. Pagez compiles each page, writes its head from its frontmatter, checks that every file and page it links is there, and Vite bundles them with hashed names. One page is the smallest site.

```text
site/
├── index.md      the page at /
├── about.md      the page at about/
├── style.css     their design, in place of Pagez's theme
├── frame.html    the document around them, optional
├── img/
└── fonts/
```

A folder below uses the nearest `style.css` and `frame.html` above it, or its own.

```sh
pagez build site     # writes site/dist/
pagez dev site       # serves it while it's written
pagez preview site   # serves what was built
```

A folder with its own Vite config adds the plugin instead:

```js
import pagez from "@amitkaps/pagez/vite";

export default { plugins: [pagez()] };
```

0.1 builds one page without elements or `${…}`. Elements, `${…}` and many pages are built since, and what's left comes next, in [the plan](docs/plan.md#next-in-order). [folders.md](docs/folders.md) is where it's going.

## Install

```sh
pnpm add -D @amitkaps/pagez vite-plus
```

It needs Node 26 or newer, the Node it's built and tested on.

Read [the docs](docs/README.md) for its design, plan and lessons. It follows [ship's standard](https://ship.amitkaps.com/docs/standard.md) for how it builds, checks and releases.
