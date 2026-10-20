# Design

Pagez is a page compiler. A folder of Markz pages goes in, and their HTML comes out, built to `dist/` through Vite. This page is what it is, why, and what it isn't. [Pages](pages.md) and [elements](elements.md) state the rules, and [the plan](plan.md) says what's built.

> The build produces the page. JavaScript enhances the page.

## What it is

**The unit is the page.** A page holds its content, its metadata and the elements it uses. Elements exist in service of the prose. The ideal page is a text page with some behavior, such as an essay with a toggle, a small interactive figure or a filterable list.

**A folder is one page or a site.** The rule is one sentence, applied down a tree of folders.

> Every `.md` is a page, at its folder's path. The nearest `style.css` and `frame.html` above it are its design, and an `@x-tag.html` anywhere in the tree is an element it can use. Everything else it uses sits beside it.

**An element is one file of plain HTML,** a `<template>`, a `<style>` and a `<script>`. It's Web Components in the light DOM, rendered at build time.

**Markz parses, and Pagez evaluates.** Markz never evaluates, and every node carries its position and source. Pagez overrides Markz's renderer for three nodes only and reuses everything else.

| Markz syntax | Markz HTML renderer | Pagez                                                       |
| ------------ | ------------------- | ----------------------------------------------------------- |
| `${…}`       | prints it as code   | evaluates it as a `page` path, escaped                      |
| `{@tag …}`   | writes the tag      | writes a native tag as Markz does, and renders a custom one |
| ` ```=html ` | emits it verbatim   | emits it verbatim, except an element's definition           |

So a page rendered by Markz alone stays readable. Expressions show as code, and raw HTML passes through.

**Pagez is a library, a plugin and a command.** `compile` returns the page in its frame, its CSS and its one module. `pagez()` hands each page to Vite at the path it's built at, and `pagez build|dev|preview` runs Vite with it. Templates run at build time in a Vite server, `dev`'s own or one the build makes. Markz is bundled into `dist/`, so `vite-plus` is Pagez's only peer dependency.

## Why

**AI is an author, and Pagez is its target.** An HTML page that an AI writes is output. Pagez is a source format and its compiler, so the choice is between editing generated HTML and editing Markz that builds to it. Markz with elements is a small surface, so a model makes fewer mistakes, and the compiler catches the rest at exact positions. An edit is a change to the source that a person can review. The value is in collections kept over time, such as data essays, a book or course material, more than one-off demos.

**Keep Pagez small.** There's no runtime model to understand. There's a compiler that turns prose and elements into HTML, CSS and JS, and the elements' small runtime in the output. Every rule is HTML's, CSS's, JavaScript's or Vite's where one of those has it.

**One tree, not files sorted by kind.** A site can instead sort files by kind, with `text/` for writing, `code/` for frames and CSS, `data/` and `public/`. A writer's folder then holds only words, which read as they are on GitHub. One tree was chosen for what it gains.

- One rule runs from one page to a site, so a page never has to move to a different tool.
- A page's files sit beside it, so moving or deleting a page takes its files with it, as Hugo's page bundles and SvelteKit's routes do.
- A design per section comes free from "nearest wins", and a section such as `stories/` can leave or join a site unchanged.
- Only `public/` is reserved, where sorting by kind needs four folders and rules for which extension goes where.
- An AI writes one folder, with everything a page needs in it.

What it costs is that words and code mix in a folder, and `_` and subfolders such as `img/` are the author's to keep it tidy. Reserved names grow, so a `style.css` meant as a plain file can't be one.

**A page's URL is a folder.** `about.md` is `/about/`, built as `about/index.html`, since `blog/index.md` can only be `/blog/`. A URL with no extension says nothing about how it's built, so it survives the next change of tools. A site that served `/about.html` keeps its old links with a redirect.

**Metadata, never settings.** Frontmatter holds what a page is, such as its title and address, and never how to build it. Each would-be setting is a convention instead. The page's CSS is the nearest `style.css`, its frame the nearest `frame.html`, and an element is found by name. So there's nothing to configure, and a page's file says what it is.

**A file means where it sits.** Nothing is merged unless it's written. A `style.css` that builds on its parent's says so with `@import`, so what a page gets can be read where it's written. A frame is a whole document, so markup two frames share is an element, which is how markup is reused.

**The cascade decides, not a setting.** Each kind of CSS has one place, and a later one wins. Pagez's theme is in a layer, so any unlayered CSS beats it. An element's CSS isn't, and its selectors start with its tag, so `note-card h2` outranks a page's `h2`, as Svelte's and Vue's scoped CSS win with a class. The page has the last word by naming the element. An element's CSS in a layer lost to every unlayered rule ([lessons](lessons.md#css)).

**One theme, all or nothing.** A page with no CSS reads well in the system's fonts, in one column, light or dark. A `style.css` replaces the theme, so it has no custom properties or layers to configure ([lessons](lessons.md#css)). A site with a design of its own brings its CSS, and its first rules would only undo a reset under it.

**Prose refers to values, and elements compute.** Prose `${…}` is a path into `page`, and a template's `${…}` is full JavaScript. A missing value fails, since printing nothing would hide a typo. A value with no one way to read as text, such as a list, is an element's to write.

**One file per element.** A treemap written as a site's scripts was three places to read, its two scripts and about 70 lines of `style.css`, for one idea. Vue and Svelte keep a component in one file for this reason, and an element does it without what they bring.

- **No template language.** The template is JavaScript's template literal, tagged with `html`, so loops are `.map`.
- **HTML marks the time.** A browser never runs a `<template>`'s content, so "written at build time, never shipped" is what it means. A top-level `<script>` runs in the browser, as in any page.
- **Nothing is serialized.** Behavior reads the page's HTML, so there are no props and nothing to hydrate.
- **The tag is always in the page.** The build writes the element around its template's output, where its CSS and `setup` look for it. A leaf can't be a bare `<img>` because of this.
- **Behavior enhances what the build wrote.** On a slow load a script runs after first paint, so markup it inserted would move the page. So the template writes what an element shows, and `setup` wires it.

**Errors point to a place.** Every Markz node carries its position, and an error in an `=html` block is offset from the block's. So every failure names its file and line, a template that throws included, and Pagez fails rather than guess.

**Trust and determinism.** A template's script runs at build time with full Node access, so a page is trusted like a script. The `html` renderer's job is correctness, not defense, since the site's author writes all of its input. Pagez fetches nothing at build time, and is deterministic when the page's code is. Dates, randomness and reading the network in a build script are the author's to avoid.

## What it isn't

Each item is out, with why in a line. What's still open is in [the plan](plan.md#open-questions).

- **Not a framework.** No JSX, decorators, framework template syntax or attribute languages. A loop written in markup, such as `each="…"`, is a template language.
- **Not a browser renderer.** No DOM at build time, hydration, virtual DOM, reactive state or props. The build would need a DOM in Node only to serialize it back to a string. A site that renders in the browser imports a renderer, and one whose state crosses elements imports a signals library.
- **No shadow DOM.** Content is in the light DOM, where the page's CSS reaches it.
- **No async render or streaming.** The page's single pass can't wait, and an element's data is read before it renders.
- **No logic in prose,** and no settings in frontmatter.
- **No custom element for grouping or styling alone.** A native tag does it, and an element earns its place with a template or behavior.
- **No frame that grows into a framework.** No layouts, partials or site logic. Shared markup is an element.
- **No typography or color in a reset.** The theme is one look, and a `style.css` replaces it.
- **No inlined single file.** Each page's images, fonts and CSS are files, hashed, so a browser caches them ([lessons](lessons.md#where-the-output-goes)).
- **Not a link to GitHub.** A link to a file ships it with its page, and isn't rewritten to `pagez.md`'s `repo`. A link to GitHub is written in full.
- **Not an element's second definition.** A name has one definition across the site, and a section that wants a variant gives it its own name.

An element's own ruled-out forms, each with why:

- **Markers on each script,** such as `<script build>` or `render` and `setup`. Position says the same thing with no attribute to learn.
- **Separate files by time or kind,** such as `.html.js`, `.browser.js` or `@name.css`. Each adds a suffix, and an element becomes up to four places to read.
- **Markup without `html`.** Treating every backtick string as markup would make the template something other than JavaScript, and still leave `html` in helpers.
- **`${children}`.** Content can only be placed or tested for emptiness, and the slot and its fallback do both. It would be a second way to say what a frame's `<slot>` says.
- **`export` in the build script.** It listed what the markup used, which the module already says.
- **One class run at both times.** Its code would have to work twice, check whether it had rendered, and couldn't read data files in the browser.
- **A class as the default export, or `define(name, setup)`.** The file is the element and names it once. A second name could disagree with it.
- **Replacing the tag with the element's output.** The name would be gone from the page, so its behavior never runs and its CSS never matches.
- **Passing the kind of use** to the element. An element that renders differently by where it's used is two elements, such as `{@cite}` and `{@cite-block}`.
- **`html` in the browser, `signal` and `effect`, or declarative behavior.** Each is a framework that grows. A site that wants one imports Alpine, htmx or a signals library.
- **A `live` attribute on each use.** Behavior belongs to the element, not the use.

An element costs something too.

- An editor's IntelliSense is weaker in an inline script than in a `.js` file, and `${…}` in the template's HTML isn't highlighted.
- `d3` in the build script sits a few lines from browser code that must not import it. The report's size per element is what catches a copied import.
- The host serves each part as a module of its own, the whole file with the other parts blanked, so an error's line is the file's.

The model has precedent. [Enhance](https://enhance.dev) has the same element model, rendered on a server. [WebC](https://www.11ty.dev/docs/languages/webc/) keeps an element in one `.html` file and bundles its script only where its tag appears. [Lit](https://lit.dev) writes markup with the same `html` tag, and renders in the browser.
