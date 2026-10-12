# Folders

A proposal, not yet the design: Pagez builds a hierarchy of folders, one page or many, and Sitez's
site conventions fold into it. It's written to be evaluated before anything changes. The current
design is [design.md](design.md), and Sitez's is
[sitez.amitkaps.com](https://sitez.amitkaps.com/docs/design.md).

## The idea

Pagez builds one folder now: `index.md` and what sits beside it. The proposal is that the same
rule, applied down a tree of folders, is a site.

> Every `.md` is a page, at its folder's path. The nearest `style.css`, `frame.html` and
> `@x-tag.html` above it are its design. Everything else it uses sits beside it.

So routing comes from folders, as in Sitez, and as in SvelteKit, where a folder is a route and a
layout applies to everything under it. What changes from Sitez is that there's one tree, not
four. Words and the code, CSS and files they use live together, in the folder of the page that
uses them.

|                | One design                                                | A design per folder                                     |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| **One page**   | `index.md` and `style.css`, Pagez now                     | —                                                       |
| **Many pages** | `index.md`, `about.md` and `talks.md` share a `style.css` | `essays/` and `stories/`, each with its own `style.css` |

All four are one rule. A single page is the smallest site.

## Sitez's model, and this one

Sitez separates files by kind. `text/` is what you write, `code/` is what frames, renders and
styles it, `data/` is JSON and `public/` is copied as it is. Routing follows `text/`, and one
`code/index.html` frames every page. The reasons were that a writer's folder holds only words,
which read as they are on GitHub, and a file's extension says where it goes.

```text
Sitez                              Folders
site/                              site/
├── site.md                        ├── site.md
├── text/                          ├── index.md          → /
│   ├── index.md                   ├── about.md          → /about/
│   ├── about.md                   ├── style.css         every page's design
│   └── blog/                      ├── frame.html        every page's frame
│       ├── index.md               ├── @call-out.html    every page's element
│       └── hello.md               ├── favicon.svg
├── code/                          ├── blog/
│   ├── index.html                 │   ├── index.md      → /blog/
│   ├── style.css                  │   ├── hello.md      → /blog/hello/
│   ├── @call-out.html             │   ├── hello.svg     hello's figure, beside it
│   └── blog/@post-list.html       │   └── @post-list.html
├── data/talks.json                └── stories/
└── public/favicon.svg                 ├── index.md      → /stories/
                                       ├── style.css     its own design
                                       ├── frame.html
                                       └── img/  fonts/
```

## The rules it would need

1. **A page is a `.md`,** at its folder's path. `index.md` is the folder's own URL, and `about.md`
   is `/about/`. `about.md` beside an `about/index.md` is two files for one URL, and fails, as in
   Sitez.
2. **The nearest design wins.** A page uses the `style.css` and `frame.html` in its folder, or the
   nearest folder above it. A folder with its own `style.css` has its own design, so `stories/`
   drops into a site unchanged.
   - Nothing is merged. A `style.css` that wants its parent's writes `@import "../style.css";`, so
     what a page gets is written where it can be read.
   - Frames don't nest. A section with a different shell has its own `frame.html`.
3. **An element is found by name,** in the page's folder or the nearest above it. So
   `blog/@post-list.html` is the blog's, and `@call-out.html` at the root is everyone's. Whether a
   nearer definition may shadow a farther one, or two definitions of a name fail as in Sitez, is
   open.
4. **What a page uses sits beside it.** Images, fonts, scripts and JSON are referenced by relative
   path, checked, and bundled by Vite with hashed names. `data="talks.json"` reads the file beside
   the page.
5. **Links follow files,** as in Sitez. `[hello](blog/hello.md)` becomes `/blog/hello/`, checked
   against every page, so a broken link or a link to a draft fails the build.
6. **`site.md` marks the root,** with the site's `url`, from which every page's address follows,
   and its `repo`. A single page needs none, and takes its `url` from its frontmatter, as now.
7. **What's skipped:** a file or folder starting with `_` or `.`, `node_modules`, and the output.
8. **`pages` and `site`** reach every template, as in Sitez, so an index can list the pages under
   it.

What Sitez does that comes along unchanged: drafts, redirects, `404.md`, the head and its checks,
elements, the build report, and checked links.

## Evaluation

### What it gains

- **One rule, from one page to a site.** Stories, a set of independent folders and a site with
  sections are the same thing at different sizes. There's no point where a page has to move into
  a different tool.
- **A page's files are beside it.** A post's figure sits next to the post, not in `public/` or
  `code/`, and moving or deleting a page takes its files with it. That's how Hugo's page bundles
  and SvelteKit's routes work, and how an author thinks of a page.
- **A design per section** comes free from "nearest wins", with nothing to configure. Sitez has
  one frame for every page, so a section that looks different needs an element that reads `page`.
- **A section is portable.** `stories/` can leave a site as a folder, or join one, unchanged.
- **Fewer reserved folders.** `text/`, `code/`, `data/` and `public/` go, and their rules: which
  extension goes where, and the errors for a file in the wrong one.
- **An AI writes one folder,** with everything a page needs in it, which is easier to get right
  than four parallel trees.

### What it costs

- **Words and code mix.** Sitez's `text/` holds only Markdown, so a writer, or GitHub's file
  browser, sees only the writing. A folder here also holds CSS, elements and images. `_` and
  subfolders like `img/` keep it tidy, but it's the author's to keep.
- **Reserved names grow.** `index.md`, `style.css`, `frame.html`, `site.md`, `@x-tag.html` and
  `404.md` all mean something wherever they are. A `style.css` meant as a plain file can't be.
- **`README.md` would be a page.** A repository's root has one, and so do folders that explain
  themselves. Either it's skipped by name, or it's a page, which suits a section whose README is
  its index on GitHub too.
- **Files served as they are.** Sitez's `public/` copies `robots.txt`, `CNAME` or a PDF nobody
  references. Here a file is only in the output when something references it, so those need a
  rule: a `public/` kept for them alone, or every unreferenced file copied.
- **Shadowing.** Nearest-wins for elements means `@call-out` can mean two things in one site.
  That's power for a section and a surprise for a reader.
- **Migration.** amitkaps.github.io builds with Sitez 0.4, and moves from four trees to one.
- **Pagez stops being only a single-page compiler.** Each page can still compile alone, with the
  site's parts (links, `pages`, redirects) as a step around it, so the code keeps the line even
  if the package doesn't.

### Where the output goes

Pagez writes `index.html` beside `index.md` now, which makes one page work from disk with no
build step. For a site that's generated files mixed into the source on every folder. So a site
builds to `dist/` through Vite, hashed and minified, and `vp dev` serves it while writing. Whether
a single page still writes beside itself, or builds to `dist/` like a site, is open.

## Open questions

- **Element shadowing.** A nearer `@x-tag.html` overrides a farther one, or two of a name fail.
- **`README.md`.** Skipped, or a page.
- **Files nobody references.** A `public/` folder, or copy everything that isn't a page or source.
- **The URL of `about.md`.** `/about/`, as Sitez serves it, or `/about.html`, which also works
  from disk and on any host.
- **Output beside the page, or `dist/`,** for one page.
- **Package.** Sitez folded into Pagez, or Sitez kept as the name of the multi-page half.
- **A parent's design.** Nearest-wins with an explicit `@import "../style.css"`, or nesting, as
  SvelteKit's layouts do.

## Tests of it

1. **Stories:** one page, its own design. It builds with Pagez today.
2. **A set of folders,** each with its own `style.css` and nothing shared, built to one `dist/`.
3. **amitkaps.github.io:** many pages, one design, a blog index that lists its posts, and links
   between pages. Rebuilt as one tree, it shows which Sitez features a real site uses, and
   whether the folders stay pleasant to work in.

If all three stay simple, Sitez's conventions fold into Pagez. If the third gets messy, the line
between one page and a site is real, and Sitez stays.
