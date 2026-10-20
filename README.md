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
pagez preview site --port 4173   # on that port, or fails if it's taken
```

A folder with its own Vite config adds the plugin instead:

```js
import pagez from "@amitkaps/pagez/vite";

export default { plugins: [pagez()] };
```

[Usage](docs/usage.md) says how to build with it, and [pages](docs/pages.md) has the rules a page and a site follow. 0.1 builds one page without elements or `${…}`. Elements, `${…}` and many pages are built since, and what's left comes next, in [the plan](docs/plan.md#next-in-order).

## Install

```sh
pnpm add -D @amitkaps/pagez vite-plus
```

It needs Node 26 or newer, the Node it's built and tested on.

Read [the docs](docs/README.md) for its design, plan and lessons. It follows [craftz's rules](https://craftz.amitkaps.com/docs/rules.md) for how it builds, checks and releases.
