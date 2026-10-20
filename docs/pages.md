# Pages

How to write a page and a site for Pagez, rule by rule. Each rule has an id, and ends with the test cases that hold it, in `tests/pages/` and `tests/sites/`. [Elements](elements.md) has the rules for an element's file, and [the design](design.md) says why they're these.

A rule is a list item that opens with its id as a span, like ``[`folder-page`]{#folder-page}``. The cases it names are in brackets at its end, each a case's folder or a test file. [docs.test.ts](../tests/docs.test.ts) holds each rule to cases that exist. It also holds every case to a rule, every id in the source to its row in [Errors](#errors) or [Warnings](#warnings), and each row to a test that holds it.

## At a glance

| To                      | Write                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| Make a page             | a `.md`, at its folder's path                                       |
| Give pages a design     | a `style.css`, a `frame.html`, or both, in their folder or above it |
| Give a site its address | `url` in a `pagez.md` at the root                                   |
| Use a file              | a relative path, such as `./photo.jpg`                              |
| Link to a page          | its `.md`, such as `[hello](blog/hello.md)`                         |
| Print a value           | `${page.title}`                                                     |
| Use an element          | `{@call-out}` … `{/call-out}`, defined in a `@call-out.html`        |
| Hold a page back        | `draft: true`                                                       |
| Keep an old address     | `redirects: [/old-name/]`                                           |
| Copy a file as it is    | put it in `public/`                                                 |
| Leave a file out        | start its name with `_` or `.`                                      |

## The folder

```text
site/
  pagez.md         the site's url and repo, optional
  index.md         the page at /
  about.md         the page at about/
  style.css        their CSS, in place of Pagez's theme, optional
  @x-tag.html      an element, for any page
  essays/
    index.md       the page at essays/
    first.md       the page at essays/first/
    first.svg      its figure, beside it
    frame.html     the document around essays/ and what's below it, optional
    style.css      essays' own CSS, which may @import "../style.css"
  public/          copied as it is
  dist/            what Pagez builds
```

- [`folder-page`]{#folder-page}: A page is a `.md`, at its folder's path. `index.md` is its folder's own, and `about.md` is `about/`, built as `about/index.html`. So `about.md` beside `about/index.md` is two files for one path, and fails, as does a site with no page (`folders`, `plain`, `error-path-twice`, `error-no-page`).
- [`folder-markz`]{#folder-markz}: A page is Markz. A form Markz reads its own way, such as a bare URL or an element line beside text, warns at its line, and ends with Markz's code, such as `[bare-url]`. [Markz](https://github.com/amitkaps/markz) lists its codes (`markz-warnings`).
- [`folder-design`]{#folder-design}: A page's design is the nearest `style.css` and `frame.html`, each found on its own, in its folder or the nearest one above it (`folders`, `frame`, `style-css`).
- [`folder-merge`]{#folder-merge}: Nothing is merged unless it's written. A `style.css` that builds on its parent's starts with `@import "../style.css";`. Markup two frames share is an element (`folders`, `references-css`).
- [`folder-dist`]{#folder-dist}: The build writes `dist/`, and never writes to the folder. So an `index.html` where a page is built fails, since that's the file Pagez writes (`error-built-file`, `tests/vite.test.ts`).
- [`folder-skipped`]{#folder-skipped}: A name starting with `_` or `.`, `node_modules`, `public/` and `dist/` are skipped. Nothing else is special, so a `README.md` is a page (`folders`).
- [`folder-public`]{#folder-public}: `public/` at the root is copied as it is. It's for files nothing links but a host or a browser asks for, such as `robots.txt` or `favicon.ico` (`blog`).
- [`folder-root`]{#folder-root}: `pagez.md` at the root is the site's metadata, not a page. Its `url` is the site's address, and its `repo` is where the source is, each a full address. One below the root fails (`folders`, `blog`, `error-site-file-below`, `error-site-url`).
- [`folder-url`]{#folder-url}: A page's `url` is `pagez.md`'s and the page's path, so a page that sets another fails. One that sets that address passes, so a section joins a site unchanged. With no `pagez.md`, a page takes its `url` from its own metadata (`folders`, `head`, `error-page-url`).

## Files and links

A reference is written as a relative path, a package name or a full URL, and that says where its file lives. A reference is read from the file it's written in, as a browser reads it.

| Written as | Example | Pagez |
| --- | --- | --- |
| A relative path | `./chart.js`, `./photo.jpg` | checks it's there, and Vite bundles it, hashed |
| A package name | `import "d3"` | bundles it from the `node_modules` beside the page |
| A full URL | `https://esm.sh/d3` | leaves it as written, and fetches nothing |

- [`files-checked`]{#files-checked}: An image, a font, a stylesheet, a video or a script is written as a relative path. One that isn't there fails, at its line in the Markdown, or naming the reference in HTML or CSS (`references-image`, `references-css`, `error-relative-missing`, `error-style-missing`).
- [`files-hashed`]{#files-hashed}: Vite gives each file a hashed name in `dist/assets/`, and inlines one under 4 KB. A file a page links to, such as `./data.csv`, is shipped and hashed too (`references-link`, `tests/vite.test.ts`).
- [`files-from-here`]{#files-from-here}: A reference is written from the file it's in. A figure beside `about.md` is `../figure.svg` in `about/index.html`, and a frame's references are from the frame's folder (`folders`, `element-in-folder`).
- [`files-scripts`]{#files-scripts}: A page's own `<script type="module" src>` is left as written, and Vite bundles it with what it imports (`references-relative-script`).
- [`files-packages`]{#files-packages}: A package is bundled from a `node_modules` the file's folder reaches. One that isn't there fails, at the import's line. A stylesheet can't `@import` a package, since the page's folder doesn't serve `node_modules`, so it imports a URL or a copy beside it (`references-package`, `error-package-missing`, `error-style-import-package`).
- [`files-urls`]{#files-urls}: A full URL is left as written. Pagez fetches nothing at build time, so a URL is the author's choice to depend on the network (`references-url-import`, `third-party-component`).
- [`links-page`]{#links-page}: A link to a page is to its `.md`, as it reads on GitHub. It's written as the folder the page is built in, from the linking page, such as `./essays/first/` (`references-link`, `folders`).
- [`links-root`]{#links-root}: A link from the site's root, such as `/essays/first/`, means one page wherever it renders, so a frame or a template writes it. Anything else from the root must be a file in `public/` (`blog`, `error-link-site-path`, `error-public-missing`).
- [`links-checked`]{#links-checked}: A link must reach a page the site builds. A link to a missing page, a draft, a redirect or `404.md` fails, at its line, and a frame's links are checked for each page (`error-link-missing`, `error-frame-link-missing`, `error-link-draft`, `error-link-redirect`, `error-link-not-found`).
- [`files-server`]{#files-server}: `dist/` needs a server, as any built site does. Its base is `./`, so it works at a site's root or under a path such as `/stories/` (`tests/vite.test.ts`).

## A site

- [`site-pages`]{#site-pages}: Every template has `pages` and `site` beside `page`. `pages` is every page the site builds, sorted by path, each with its metadata, its `path` and its `url` (`blog`).
- [`site-path`]{#site-path}: A page's `path` is from the site's root, such as `/blog/hello/`. It's its file's, so a page can't set it (`blog`, `error-path-set`).
- [`site-meta`]{#site-meta}: `site` is `pagez.md`'s metadata, so `site.author` is the site's own key (`blog`).
- [`site-draft`]{#site-draft}: A page with `draft: true` is left out of `build`, of `pages` and of what a link reaches. `dev` builds it, so it can be read as it's written (`blog`, `error-link-draft`).
- [`site-draft-yes`]{#site-draft-yes}: `draft: yes` fails, since YAML reads it as a string, and a draft written wrong would be published (`error-draft-yes`).
- [`site-404`]{#site-404}: `404.md` at the root is built as `404.html`. Its references are written from the site's root, so a site with one needs `url` in `pagez.md`. It isn't in `pages` (`blog`, `error-not-found-url`).
- [`site-redirects`]{#site-redirects}: A page that moved lists its old paths, `redirects: [/old-name/]`, and `build` writes `dist/_redirects`, which Cloudflare Pages and Netlify read. Each old address is a 301 to the page from `/old-name`, `/old-name/` and `/old-name.html`, so it's listed once, in any of them. Each is a path from the site's root, and anything else fails. A `_redirects` in `public/` comes first, and `dev` and `preview` send them too (`blog`, `tests/vite.test.ts`, `error-redirect-path`, `error-redirects-value`).
- [`site-redirect-taken`]{#site-redirect-taken}: A redirect can't be a page's path in any spelling, since a host reads `_redirects` before the files it serves. So `/x.html` can't redirect while a page has `/x/`. Two pages can't list one, and a page lists it once (`error-redirect-page`, `error-redirect-shadowed`, `error-redirect-twice`, `error-redirect-two-pages`).
- [`site-report`]{#site-report}: `build` prints each page's size, gzipped, its time and the elements that give it behavior. Then it prints the CSS and JavaScript the pages share, and the total (`tests/vite.test.ts`).
- [`site-check`]{#site-check}: `pagez check` compiles every page `build` would, and writes nothing. It prints each page's failure and each warning, a line each, and exits with 1 if there's any, where `build` passes with a warning. A mistake every page shares is one line (`tests/check.test.ts`).
- [`site-rules`]{#site-rules}: `pagez rules <id>` prints a rule, or an error or a warning with its rule, from the docs of the version installed. With no id, it prints every rule (`tests/check.test.ts`).

## Values in prose

`${…}` in prose prints a value from `page`, the page's metadata. A template's `${…}` is full JavaScript, in [elements](elements.md#the-template).

- [`values-path`]{#values-path}: Prose `${…}` is a dotted path into `page`. Anything more fails, at its line and column, and so does a name other than `page` (`expressions`, `error-expression-call`, `error-expression-scope`).
- [`values-missing`]{#values-missing}: A value the page doesn't have fails, since printing nothing would hide a typo (`error-expression-missing`).
- [`values-text`]{#values-text}: Prose prints a string or a number, escaped. A list, a boolean or an empty value fails, and an element writes it (`expressions`, `error-expression-value`).
- [`values-dotted-key`]{#values-dotted-key}: A key with a dot, `author.name: Ada`, is one key, and `${page.author.name}` reaches it. At each step the longest key that matches wins (`expressions-dotted-key`).
- [`values-places`]{#values-places}: A link's destination prints its values too. A heading that prints a value takes its id from what it prints, so `# ${page.title}` is `fish--chips` (`expressions`).
- [`values-literal`]{#values-literal}: A literal `${…}` in prose goes in an inline code span (`expressions`).

## The head and the frame

Frontmatter holds the page's metadata, such as `title`, `description`, `url` and `image`, and no settings. The head is the frame's, with what follows from the metadata added.

- [`frame-document`]{#frame-document}: A frame is a whole document with one `<slot>`, where the page goes. With no frame, Pagez writes a minimal document with `<main><slot></slot></main>` (`frame`, `plain`, `tests/head.test.ts`).
- [`frame-checked`]{#frame-checked}: A frame must have a `lang`, a `charset`, a `viewport` and one `<slot>`. It fails on a tag Pagez writes, such as `og:title` (`error-frame-two-slots`, `tests/head.test.ts`).
- [`frame-elements`]{#frame-elements}: An element in the frame renders too, and reads the page's `page` (`frame-elements`, `blog`).
- [`head-fields`]{#head-fields}: Pagez puts the page's `lang`, `title` and `description` in place of the frame's, or adds them. A frame needs neither title nor description (`head`, `frame`, `tests/head.test.ts`).
- [`head-social`]{#head-social}: Pagez writes the canonical link, `og:title`, `og:description`, `og:url`, `og:image`, `og:type` and `twitter:card`. A frame may write other social tags, such as `twitter:site` (`head`, `tests/head.test.ts`).
- [`head-title`]{#head-title}: The title is the page's `title`, else the frame's `<title>`, else the page's first heading, else the file's name (`no-metadata`, `tests/head.test.ts`).
- [`head-url`]{#head-url}: The canonical link and `og:url` need `url`, and are left out without it. A `url` that isn't a full address fails (`plain`, `no-metadata`, `tests/head.test.ts`).
- [`head-image`]{#head-image}: `image` is a full address, or a path that resolves against `url`. A relative `image` with no `url` fails, and with an image, `twitter:card` is `summary_large_image` (`head`, `error-image-no-url`).

## CSS

A page with no CSS of its own gets Pagez's theme. A page with a design brings its `style.css`, and an element brings its own CSS.

| Order | CSS                    | Where                          |
| ----- | ---------------------- | ------------------------------ |
| 1     | Pagez's theme          | a `<style>`, in `@layer theme` |
| 2     | the elements' CSS      | a `<style>`, unlayered         |
| 3     | the page's `style.css` | a `<link>`, unlayered          |

- [`css-theme`]{#css-theme}: A page with no `style.css` and no frame, in its folder or above it, gets the theme. It's one readable column, light or dark, styled by tag (`plain`, `prose`, `tests/css.test.ts`).
- [`css-style`]{#css-style}: A `style.css` replaces the theme. It's linked as written, after the head's other tags, and can `@import` and `url()` the files beside it (`style-css`, `references-css`).
- [`css-frame`]{#css-frame}: A page with a frame doesn't get the theme, since the frame is its design. A `style.css` is still linked (`frame`).
- [`css-order`]{#css-order}: Each element's CSS comes before the page's, unlayered, and its selectors start with its tag. So it beats the page's tag defaults, and a page restyles an element by naming it (`style-css-elements`, `page-css-wins`).
- [`css-dark`]{#css-dark}: A page that sets a light background of its own sets `color-scheme: light` too, or its text turns light in dark mode (`prose`).
- [`css-raw`]{#css-raw}: A `<style>` in an `=html` block is raw HTML, written where it is, unlayered. A page kept as one file can carry its CSS this way (`page-css`, `stories`).

## Elements in a page

How a page uses an element. What's in an element's file is in [elements](elements.md).

- [`use-markz`]{#use-markz}: An element is used through Markz, `{@x-tag attr=…}`, with or without Markdown inside it (`element-in-page`, `element-slot-fallback`).
- [`use-native`]{#use-native}: A native tag, such as `section`, `article` or `figure`, is written as Markz writes it. Grouping and styling never need a custom element (`native-tags`).
- [`use-attrs`]{#use-attrs}: An attribute that is one `${…}` is the value itself, so `tags=${page.tags}` gives the template the list. Only a string or a number is written on the tag (`element-attr-expression`).
- [`use-in-page`]{#use-in-page}: An element is defined in the page by an `=html` block, named by `<template element="x-tag">`. The block isn't written, and every other `=html` block is written as it is. In `dev`, a definition removed from the page fails until the page reloads (`element-in-page`, `raw-html`, `error-in-page-definition`, `tests/vite.test.ts`).
- [`use-file`]{#use-file}: An element is defined in a file by `@x-tag.html`, anywhere in the site. Moving a definition from the page to a file is a cut and paste (`element-file`, `element-file-named`, `element-in-folder`).
- [`use-one-definition`]{#use-one-definition}: A name has one definition across the site. Two files, the page and a file, or two in the page fail (`error-name-two-files`, `error-name-duplicate-file`, `error-name-duplicate-page`).
- [`use-only-used`]{#use-only-used}: Only the elements a page uses reach it. An unused element writes no CSS and no script (`element-unused`, `element-behavior`).
- [`use-undefined`]{#use-undefined}: A hyphenated tag with no definition and no selector in the page's CSS warns, at its line. So a component a script defines gets a rule such as `sl-button:not(:defined)` (`undefined-tag`, `third-party-component`).

## Errors

A mistake fails the build, and the error names its file and line, or the reference it's about. A template that throws names its line too. The error ends with its id, such as `[error-link-draft]`, and each id is a row here, with when it fails and the rule it breaks.

| Error | Fails when | Rule |
| --- | --- | --- |
| [`error-browser-import`]{#error-browser-import} | an element's browser script imports Pagez | [`element-script-imports`](elements.md#element-script-imports) |
| [`error-browser-node`]{#error-browser-node} | an element's browser script imports one of Node's modules, such as `node:fs` | [`element-script-imports`](elements.md#element-script-imports) |
| [`error-built-file`]{#error-built-file} | an `index.html` is where a page is built | [`folder-dist`](#folder-dist) |
| [`error-draft-yes`]{#error-draft-yes} | `draft: yes`, which YAML reads as a string | [`site-draft-yes`](#site-draft-yes) |
| [`error-element-file-outside`]{#error-element-file-outside} | markup or text in an element file is outside its parts | [`element-parts`](elements.md#element-parts) |
| [`error-element-file-second-part`]{#error-element-file-second-part} | an element file has a second `<style>` or `<script>` | [`element-parts`](elements.md#element-parts) |
| [`error-element-file-stray-end`]{#error-element-file-stray-end} | an end tag in an element file closes nothing | [`element-parts`](elements.md#element-parts) |
| [`error-element-file-unclosed`]{#error-element-file-unclosed} | a part of an element file is never closed | [`element-parts`](elements.md#element-parts) |
| [`error-element-gone`]{#error-element-gone} | `dev` asks for a definition the page no longer has, until the page reloads | [`use-in-page`](#use-in-page) |
| [`error-element-inside-itself`]{#error-element-inside-itself} | an element ends up inside itself | [`element-nesting`](elements.md#element-nesting) |
| [`error-element-unclosed`]{#error-element-unclosed} | an element is never closed | [`element-nesting`](elements.md#element-nesting) |
| [`error-expression-call`]{#error-expression-call} | prose `${…}` calls a function | [`values-path`](#values-path) |
| [`error-expression-missing`]{#error-expression-missing} | prose `${…}` names a value the page doesn't have | [`values-missing`](#values-missing) |
| [`error-expression-scope`]{#error-expression-scope} | prose `${…}` names something other than `page` | [`values-path`](#values-path) |
| [`error-expression-value`]{#error-expression-value} | prose `${…}` prints a list | [`values-text`](#values-text) |
| [`error-frame-charset`]{#error-frame-charset} | a frame has no charset | [`frame-checked`](#frame-checked) |
| [`error-frame-head-tag`]{#error-frame-head-tag} | a frame writes a tag Pagez writes, such as `og:title` | [`frame-checked`](#frame-checked) |
| [`error-frame-lang`]{#error-frame-lang} | a frame's `<html>` has no `lang` | [`frame-checked`](#frame-checked) |
| [`error-frame-no-slot`]{#error-frame-no-slot} | a frame has no slot | [`frame-checked`](#frame-checked) |
| [`error-frame-two-slots`]{#error-frame-two-slots} | a frame has two slots | [`frame-checked`](#frame-checked) |
| [`error-frame-viewport`]{#error-frame-viewport} | a frame has no viewport | [`frame-checked`](#frame-checked) |
| [`error-head-text`]{#error-head-text} | a page's `title`, `description` or `lang` isn't text | [`head-fields`](#head-fields) |
| [`error-head-url`]{#error-head-url} | a page's `url` isn't a full address | [`head-url`](#head-url) |
| [`error-image-no-url`]{#error-image-no-url} | a relative `image` has no `url` to resolve against | [`head-image`](#head-image) |
| [`error-inline-block`]{#error-inline-block} | an element used inline writes a tag that ends a paragraph | [`element-inline`](elements.md#element-inline) |
| [`error-link-draft`]{#error-link-draft} | a link goes to a draft | [`links-checked`](#links-checked) |
| [`error-link-missing`]{#error-link-missing} | a link goes to a `.md` that isn't a page | [`links-checked`](#links-checked) |
| [`error-link-not-found`]{#error-link-not-found} | a link goes to `404.md` | [`links-checked`](#links-checked) |
| [`error-link-redirect`]{#error-link-redirect} | a link goes to a redirect | [`links-checked`](#links-checked) |
| [`error-link-site-path`]{#error-link-site-path} | a link from the root is neither a page nor a file in `public/` | [`links-root`](#links-root) |
| [`error-module-load`]{#error-module-load} | a module a template's script imports doesn't compile | [`element-build-script`](elements.md#element-build-script) |
| [`error-name-duplicate-file`]{#error-name-duplicate-file} | the page and a file define one name | [`use-one-definition`](#use-one-definition) |
| [`error-name-duplicate-page`]{#error-name-duplicate-page} | the page defines one name twice | [`use-one-definition`](#use-one-definition) |
| [`error-name-invalid`]{#error-name-invalid} | a name isn't lowercase with a hyphen, as in `call-out` | [`element-name`](elements.md#element-name) |
| [`error-name-mismatch`]{#error-name-mismatch} | a file's `element` attribute isn't its name | [`element-attribute`](elements.md#element-attribute) |
| [`error-name-reserved`]{#error-name-reserved} | a name is reserved, such as `font-face` | [`element-name`](elements.md#element-name) |
| [`error-name-two-files`]{#error-name-two-files} | two files define one name | [`use-one-definition`](#use-one-definition) |
| [`error-name-uppercase`]{#error-name-uppercase} | a name isn't lowercase | [`element-name`](elements.md#element-name) |
| [`error-no-page`]{#error-no-page} | a site has no page | [`folder-page`](#folder-page) |
| [`error-not-found-url`]{#error-not-found-url} | a site has a `404.md` and no `url` in `pagez.md` | [`site-404`](#site-404) |
| [`error-package-missing`]{#error-package-missing} | an import names a package that isn't installed | [`files-packages`](#files-packages) |
| [`error-page-url`]{#error-page-url} | a page sets a `url` other than the one `pagez.md` gives it | [`folder-url`](#folder-url) |
| [`error-path-set`]{#error-path-set} | a page sets `path` | [`site-path`](#site-path) |
| [`error-path-twice`]{#error-path-twice} | `about.md` is beside `about/index.md` | [`folder-page`](#folder-page) |
| [`error-public-missing`]{#error-public-missing} | an image or a script from the root isn't in `public/` | [`links-root`](#links-root) |
| [`error-redirect-page`]{#error-redirect-page} | a redirect is a page's path | [`site-redirect-taken`](#site-redirect-taken) |
| [`error-redirect-path`]{#error-redirect-path} | a redirect isn't a path from the site's root | [`site-redirects`](#site-redirects) |
| [`error-redirect-shadowed`]{#error-redirect-shadowed} | a redirect is a page's path spelled another way, such as `/x.html` | [`site-redirect-taken`](#site-redirect-taken) |
| [`error-redirect-twice`]{#error-redirect-twice} | a page lists one old address twice, such as `/x/` and `/x.html` | [`site-redirect-taken`](#site-redirect-taken) |
| [`error-redirect-two-pages`]{#error-redirect-two-pages} | two pages list one old address | [`site-redirect-taken`](#site-redirect-taken) |
| [`error-redirects-value`]{#error-redirects-value} | `redirects` isn't a list of paths | [`site-redirects`](#site-redirects) |
| [`error-relative-missing`]{#error-relative-missing} | an image beside the page, or a file a template imports, isn't there | [`files-checked`](#files-checked) |
| [`error-script-end-in-code`]{#error-script-end-in-code} | `</script>` is inside a script's code | [`element-script-end`](elements.md#element-script-end) |
| [`error-setup-class`]{#error-setup-class} | an element's browser script exports a class | [`element-setup`](elements.md#element-setup) |
| [`error-setup-no-default`]{#error-setup-no-default} | an element's browser script has no default export | [`element-setup`](elements.md#element-setup) |
| [`error-site-file-below`]{#error-site-file-below} | a `pagez.md` is below the root | [`folder-root`](#folder-root) |
| [`error-site-url`]{#error-site-url} | `pagez.md`'s `url` or `repo` isn't a full address | [`folder-root`](#folder-root) |
| [`error-slot-missing`]{#error-slot-missing} | an element is given content, and its template has no slot | [`element-slot`](elements.md#element-slot) |
| [`error-slot-named`]{#error-slot-named} | a slot has a name | [`element-slot`](elements.md#element-slot) |
| [`error-slot-two`]{#error-slot-two} | a template writes two slots | [`element-slot`](elements.md#element-slot) |
| [`error-style-import-package`]{#error-style-import-package} | a stylesheet `@import`s a package | [`files-packages`](#files-packages) |
| [`error-style-missing`]{#error-style-missing} | a `url()` in `style.css` isn't there | [`files-checked`](#files-checked) |
| [`error-style-selector`]{#error-style-selector} | a rule in an element's CSS doesn't start with its tag | [`element-selectors`](elements.md#element-selectors) |
| [`error-template-closes`]{#error-template-closes} | a value in `<script>` or `<style>` holds its closing tag | [`html-raw-text`](elements.md#html-raw-text) |
| [`error-template-default-export`]{#error-template-default-export} | a template's script has a default export | [`element-build-script`](elements.md#element-build-script) |
| [`error-template-function`]{#error-template-function} | a template holds a function | [`html-fails`](elements.md#html-fails) |
| [`error-template-in-attribute`]{#error-template-in-attribute} | a template goes in an attribute | [`html-fails`](elements.md#html-fails) |
| [`error-template-name`]{#error-template-name} | a value goes where a tag's or an attribute's name goes | [`html-fails`](elements.md#html-fails) |
| [`error-template-object`]{#error-template-object} | a template writes an object where text goes | [`element-render`](elements.md#element-render) |
| [`error-template-own-name`]{#error-template-own-name} | a template's script declares or imports a name the template has, such as `page` or `html` | [`element-scope`](elements.md#element-scope) |
| [`error-template-promise`]{#error-template-promise} | a template holds a promise | [`element-sync`](elements.md#element-sync) |
| [`error-template-render`]{#error-template-render} | a template throws as it renders | [`element-render`](elements.md#element-render) |
| [`error-template-script-after`]{#error-template-script-after} | a template's script comes after its markup | [`element-build-script`](elements.md#element-build-script) |
| [`error-template-shadow-root`]{#error-template-shadow-root} | a template is a shadow root | [`element-slot`](elements.md#element-slot) |
| [`error-template-two-scripts`]{#error-template-two-scripts} | a template has two scripts | [`element-build-script`](elements.md#element-build-script) |

## Warnings

A warning doesn't stop the build. It names its file and line, and ends with its id, as an error does. Pagez's own are here. A page's Markz warnings end with Markz's code instead ([`folder-markz`](#folder-markz)).

| Warning | Warns when | Rule |
| --- | --- | --- |
| [`undefined-tag`]{#undefined-tag} | a hyphenated tag has no definition, and the page's CSS doesn't select it | [`use-undefined`](#use-undefined) |
