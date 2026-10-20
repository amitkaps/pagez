# Folders

This is Pagez's direction. It builds a hierarchy of folders, one page or many. The decisions are below, with what was weighed. [design.md](design.md) is the design, and is rewritten to this as the work lands ([plan.md](plan.md#next-in-order)).

## The idea

Pagez built one folder first: `index.md` and what sits beside it. The idea is that the same rule, applied down a tree of folders, is a site, and it's built that far now ([plan.md](plan.md#where-it-is)).

> Every `.md` is a page, at its folder's path. The nearest `style.css` and `frame.html` above it are its design, and an `@x-tag.html` anywhere in the tree is an element it can use. Everything else it uses sits beside it.

So routing comes from folders, as in SvelteKit, where a folder is a route and a layout applies to everything under it. There's one tree, not one for each kind of file. Words and the code, CSS and files they use live together, in the folder of the page that uses them.

|  | One design | A design per folder |
| --- | --- | --- |
| **One page** | `index.md` and `style.css`, the smallest site | — |
| **Many pages** | `index.md`, `about.md` and `talks.md` share a `style.css` | `essays/` and `stories/`, each with its own `style.css` |

All four are one rule. A single page is the smallest site.

## Files by kind, or one tree

A site can instead separate files by kind. `text/` is what you write, `code/` is what frames, renders and styles it, `data/` is JSON and `public/` is copied as it is. Routing follows `text/`, and one `code/index.html` frames every page. The reasons are that a writer's folder holds only words, which read as they are on GitHub, and a file's extension says where it goes.

```text
By kind                            Pagez
site/                              site/
├── site.md                        ├── pagez.md          the site's url and repo
├── text/                          ├── index.md          → /
│   ├── index.md                   ├── about.md          → /about/
│   ├── about.md                   ├── style.css         every page's design
│   └── blog/                      ├── frame.html        every page's frame
│       ├── index.md               ├── @call-out.html    an element, for any page
│       └── hello.md               ├── blog/
├── code/                          │   ├── index.md      → /blog/
│   ├── index.html                 │   ├── hello.md      → /blog/hello/
│   ├── style.css                  │   ├── hello.svg     hello's figure, beside it
│   ├── @call-out.html             │   └── @post-list.html
│   └── blog/@post-list.html       ├── stories/
├── data/talks.json                │   ├── index.md      → /stories/
└── public/favicon.svg             │   ├── style.css     its own design
                                   │   └── img/  fonts/
                                   ├── public/
                                   │   └── favicon.ico   copied as it is
                                   └── dist/             what Pagez writes
```

## The rules

1. **A page is a `.md`,** at its folder's path. `index.md` is the folder's own URL, and `about.md` is `/about/`. `about.md` beside an `about/index.md` is two files for one URL, and fails.
2. **The nearest design wins.** A page uses the `style.css` and `frame.html` in its folder, or the nearest folder above it, each found on its own. A folder with its own `style.css` has its own design, so `stories/` drops into a site unchanged. Nothing is merged unless it's written:
   - CSS combines by saying so. A `style.css` that builds on its parent's starts with `@import "../style.css";`, so what a page gets is written where it can be read.
   - A frame doesn't combine. It's a whole document, so a section uses the nearest frame or has its own. Markup that two frames share, such as a header, is an element, which is how markup is reused.
3. **An element has one definition.** `@x-tag.html` can sit in any folder, kept with the pages that use it, and is found by name from anywhere. Two definitions of a name anywhere in the tree fail, so a name means one thing across the site, and a section that wants its own variant gives it its own name.
4. **What a page uses sits beside it.** Images, fonts, scripts and JSON are referenced by relative path, checked, and bundled by Vite with hashed names. `data="talks.json"` reads the file beside the page.
5. **Links follow files.** `[hello](blog/hello.md)` becomes `/blog/hello/`, checked against every page, so a broken link or a link to a draft fails the build.
6. **`pagez.md` marks the root,** with the site's `url`, from which every page's address follows, and its `repo`. A single page needs none, and takes its `url` from its frontmatter, as now.
7. **`public/` at the root is copied as it is.** It's for what nothing references but a host or a browser asks for: `robots.txt`, `CNAME`, `favicon.ico`, `.well-known/`. A file a page references, a linked PDF included, is beside the page and bundled instead. `public/` is Vite's own convention, so it adds no rule of Pagez's.
8. **What's skipped:** a file or folder starting with `_` or `.`, `node_modules` and `dist/`. Nothing else is special. A `README.md` is a page like any other, and `_README.md` isn't.
9. **The output is `dist/`,** built through Vite, with hashed and minified CSS, scripts, images and fonts. `vp dev` serves the site while it's written. The source is never written to.
10. **`pages` and `site`** reach every template, so an index can list the pages under it.

A site also has drafts, redirects, `404.md`, the head and its checks, elements, the build report, and checked links, written relative so `dist/` works under any path. A linked file is shipped with its page, not sent to the repository ([Pages of a site](design.md#pages-of-a-site)).

## Evaluation

### What it gains

- **One rule, from one page to a site.** Stories, a set of independent folders and a site with sections are the same thing at different sizes. There's no point where a page has to move into a different tool.
- **A page's files are beside it.** A post's figure sits next to the post, not in `public/` or `code/`, and moving or deleting a page takes its files with it. That's how Hugo's page bundles and SvelteKit's routes work, and how an author thinks of a page.
- **A design per section** comes free from "nearest wins", with nothing to configure. With one frame for every page, a section that looks different would need an element that reads `page`.
- **A section is portable.** `stories/` can leave a site as a folder, or join one, unchanged.
- **Fewer reserved folders.** Sorting by kind reserves `text/`, `code/`, `data/` and `public/`. It needs rules for which extension goes where, and errors for a file in the wrong one. Here only `public/` is reserved.
- **An AI writes one folder,** with everything a page needs in it, which is easier to get right than four parallel trees.

### What it costs

- **Words and code mix.** A `text/` folder holds only Markdown, so a writer, or GitHub's file browser, sees only the writing. A folder here also holds CSS, elements and images. `_` and subfolders like `img/` keep it tidy, but it's the author's to keep.
- **Reserved names grow.** `index.md`, `style.css`, `frame.html`, `pagez.md`, `@x-tag.html` and `404.md` all mean something wherever they are. A `style.css` meant as a plain file can't be.
- **A `README.md` is a page.** A content site doesn't keep one in its folders, and one that does names it `_README.md`, so it needs no rule.
- **Migration.** A site sorted by kind moves from four trees to one.
- **Pagez stops being a single-page compiler.** Each page can still compile alone, with the site's parts (links, `pages`, redirects) as a step around it, so the code keeps the line even if the package doesn't.

### Where the output goes

Every build writes `dist/`, apart from the source, as Jekyll and most static site generators do. Pagez wrote `index.html` beside `index.md` for a while, which made one page work from disk with no build step. For a site that's generated files mixed into every folder of the source, and once a page has images or fonts, a single file stops being simple too. Both are parked as single-page exports (plan.md, Later).

## Settled

The proposal's open questions, each with its reason.

- **`about.md` is `/about/`,** built as `about/index.html`. That's one form for every page, since `blog/index.md` can only be `/blog/`, and it's why `about.md` beside `about/index.md` fails. A URL with no extension says nothing about how it's built, so it survives the next change of tools. A site that served `/about.html` keeps its old links with a redirect.

Also settled are one definition per element, no rule for `README.md`, `public/` at the root, `pagez.md` for the root and `dist/` for the output. A parent's design is taken only where it's written, with `@import` for CSS and an element for shared markup.

## Tests of it

1. **Stories:** one page, its own design. It builds with Pagez today.
2. **A set of folders,** each with its own `style.css` and nothing shared, built to one `dist/`. It builds, as `tests/sites/folders`.
3. **A real site:** many pages, one design, a blog index that lists its posts, and links between pages. Rebuilt as one tree, it shows which site features a real site uses, and whether the folders stay pleasant to work in.

Each test checks the rules on a real case. Where one gets messy, the rule changes before the site moves in.
