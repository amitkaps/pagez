# Elements

An element is one `@name.html` file that holds its markup, written at build time, its CSS and its behavior. This page is what goes in the file, rule by rule, in the form [pages](pages.md) uses. How a page uses an element is in [pages](pages.md#elements-in-a-page).

The code is `src/elements/`, which imports nothing else from Pagez, so what an element is stays apart from how a page uses it.

## The file

The file has three parts, and each is HTML's own. Where a part sits says when it runs. What is inside `<template>` is what the build writes, and what is outside ships, as `<style>` and `<script>` do in any HTML page.

```html
<!-- blog/@tag-filter.html -->
<template>
  <script>
    const posts = (pages) => pages.filter((p) => p.url.startsWith("/blog/") && p.date);
    const tags = (pages) => [...new Set(posts(pages).flatMap((p) => p.tags ?? []))].sort();
  </script>
  <p>
    <button value="" aria-pressed="true">All</button>
    ${tags(pages).map((t) => html`<button value=${t} aria-pressed="false">${t}</button>`)}
  </p>
  <ul>
    ${posts(pages).map((p) => html`<li data-tags=${(p.tags ?? []).join(" ")}>${p.title}</li>`)}
  </ul>
</template>

<style>
  tag-filter {
    display: block;
    &:not(:defined) p {
      display: none;
    }
  }
</style>

<script>
  export default (el, { signal }) => {
    el.addEventListener("click", (event) => { … }, { signal });
  };
</script>
```

| Part | Runs | Gives |
| --- | --- | --- |
| `<template>` | build | the element's inner HTML, evaluated as an `html` template |
| `<script>` inside `<template>` | build | its names in the template's scope, and nothing in the page |
| top-level `<style>` | ships | the element's CSS, unlayered, before the page's |
| top-level `<script>` | browser | `setup(el, { signal })`, which may return a cleanup function |

An element's scripts are JavaScript, and TypeScript stays for the modules they import.

- [`element-parts`]{#element-parts}: The top level holds at most one `<template>`, one `<style>` and one `<script>`, and anything else there fails. Each part is optional (`element-behavior-only`, `tests/elements/file.test.ts`).
- [`element-name`]{#element-name}: The file's name is the tag. A name is lowercase, starts with a letter, has a hyphen and isn't reserved, or it fails (`error-name-no-hyphen`, `error-name-uppercase`, `error-name-reserved`).
- [`element-attribute`]{#element-attribute}: `<template element="x-tag">` is optional in a file, and must match the file's name, so the two can't drift (`element-file-named`, `error-name-mismatch`).

## The template

Pagez reads the template as raw text and evaluates it as an `html` literal, so `${…}` in an attribute survives. Loops are `.map`, and conditions are `? :` or `&&`.

```html
<p>${attrs.title}</p>
<a href="${page.url}">${page.title}</a>
<ul>
  ${attrs.items.map((p) => html`
  <li>${p.name}</li>
  `)}
</ul>
${attrs.note && html`
<aside>${attrs.note}</aside>
`}
```

The first two write values. The last two write markup, repeated or maybe, so each piece of it is an `html` literal. Its literal parts are markup, and every value in it is escaped. So `<li>` stays a tag and `Tom & Jerry` stays text.

- [`element-markup`]{#element-markup}: A value goes in bare, and markup goes in `html` (`element-nested`, `tests/elements/render.test.ts`).
- [`element-scope`]{#element-scope}: The template has `attrs`, `page`, `pages`, `site` and `html`, and whatever its build script declares or imports. A build script name like one of those fails (`element-in-page`, `blog`, `tests/elements/render.test.ts`).
- [`element-attrs`]{#element-attrs}: `attrs` holds each attribute as a string, or as the value itself when the page writes one, as in `tags=${page.tags}`. A `data="talks.json"` attribute arrives parsed, as `attrs.data` (`element-attr-expression`, `tests/elements/elements.test.ts`).
- [`element-sync`]{#element-sync}: Rendering is synchronous, so a promise fails (`tests/elements/elements.test.ts`).
- [`element-render`]{#element-render}: A template that throws as it renders fails, at its line in the file. So does a value the renderer refuses, at the line of its `${…}`, in a nested template too (`error-template-render`, `error-template-object`).

### The build script

A `<script>` first in the template runs at build time. It's how an element uses code that isn't its own, such as d3, a layout it shares with its browser script, or markup it shares with other elements.

```html
<!-- notes/@notes-treemap.html -->
<template>
  <script>
    import { layout, place } from "./treemap.js";
    const chart = ({ data, year, fill, slider, play }) => { …; return html`…`; };
  </script>
  ${chart(attrs)}
</template>
```

- [`element-build-script`]{#element-build-script}: A template holds at most one `<script>`, and it comes first. What it declares or imports is in the markup's scope, with no `export`, and none of it ships (`element-template-script`, `tests/vite.test.ts`).
- [`element-html-import`]{#element-html-import}: The build script has `html` with no import, and importing it fails. A module it imports that writes markup imports `html` from `@amitkaps/pagez`, which the host resolves to its own, even with another copy of Pagez installed beside the site (`tests/elements/file.test.ts`, `tests/vite.test.ts`).
- [`element-script-end`]{#element-script-end}: `</script>` inside a script's string ends the script, as in any HTML, so it fails, asking for `<\/script>`. `<template>` in a string is safe (`tests/elements/file.test.ts`).

### `html`

At build time `html` records its strings and values and renders nothing. The renderer turns that value into a string, following the HTML tokenizer, so each place a value can go means what HTML makes of it there.

- [`html-text`]{#html-text}: In text, a value is escaped (`& < > " '`). A nested template or Markz's HTML goes in as HTML, an array is each of its items, and `null`, `undefined` and `false` are nothing (`tests/elements/render.test.ts`).
- [`html-attribute`]{#html-attribute}: Right after `name=`, a value is the attribute's. `null`, `undefined` and `false` drop the attribute, `true` leaves it bare, and anything else is quoted and escaped (`tests/elements/render.test.ts`).
- [`html-quoted`]{#html-quoted}: Inside an attribute's value, quoted or not, a value is escaped text (`tests/elements/render.test.ts`).
- [`html-raw-text`]{#html-raw-text}: Inside `<script>` or `<style>`, a value goes in as it is, so a JSON-LD block stays JSON. One holding the element's closing tag fails (`tests/elements/render.test.ts`).
- [`html-comment`]{#html-comment}: In a comment, a value is dropped (`tests/elements/render.test.ts`).
- [`html-fails`]{#html-fails}: A function fails, and so does a value where a tag's or an attribute's name goes. A template in an attribute and a plain object anywhere fail, since each would write `[object Object]` (`tests/elements/render.test.ts`).

### Content goes in `<slot>`

An element's content goes where its `<slot>` is, as a page goes in its `frame.html`. Content renders first, so an element only ever has it as finished HTML.

```html
<!-- @call-out.html -->
<template>
  <aside><strong>Note</strong><slot>Nothing noted.</slot></aside>
</template>
```

- [`element-slot`]{#element-slot}: An element has one unnamed slot. Content with no slot fails, and so do two slots, a named one and `<template shadowrootmode>` (`error-in-page-definition`, `tests/elements/elements.test.ts`).
- [`element-fallback`]{#element-fallback}: The slot's own content is its fallback, shown only when the element has none. A slot in a helper's `html` works too (`element-slot-fallback`).
- [`element-light-dom`]{#element-light-dom}: Content is written into the element in the light DOM, where the page's CSS reaches it, so `::slotted()` matches nothing (`element-in-page`).

## The style

An element's CSS is its own, and the page's has the last word.

- [`element-selectors`]{#element-selectors}: Every top-level selector starts with the tag, and nesting writes the name once. A rule that doesn't start with the tag fails, naming the rule (`style-css-elements`, `tests/elements/file.test.ts`).
- [`element-css-once`]{#element-css-once}: The host ships each element's CSS once, unlayered, before the page's, and only for elements its pages use (`element-in-page`, `element-unused`).
- [`element-css-files`]{#element-css-files}: A `url()` in an element's CSS is from the element's folder (`element-in-folder`, `tests/vite.test.ts`).
- [`element-undefined`]{#element-undefined}: `:not(:defined)` styles an element before its script runs (`third-party-component`).

Nesting isn't scoping. `notes-treemap .frame` also reaches a `.frame` in an element nested inside it, and `@scope` doesn't stop that either.

## The script

The top-level `<script>` default-exports `setup(el, { signal })`. It works on the DOM the build wrote, and reads its children and attributes, so nothing is sent twice. A large library loads inside `setup`, with `await import("d3")`, so only a page where the element connects fetches it.

- [`element-setup`]{#element-setup}: The elements' runtime calls `setup` once per connection with a fresh signal. On disconnect it aborts the signal and calls the cleanup `setup` returned (`element-behavior`, `tests/elements/runtime.test.ts`).
- [`element-one-module`]{#element-one-module}: The runtime and each used element's `setup` are one module, which Vite bundles, with what they import. A library two elements share is in it once (`element-behavior`, `references-shared-import`).
- [`element-script-imports`]{#element-script-imports}: A browser script can't import `html`, Pagez or Node's own modules, and a relative import must be there (`error-browser-import`, `error-package-missing`, `tests/vite.test.ts`).

## Nesting and wrapping

Elements render inside-out. An element's content renders before its template, and the elements its template writes render after it, until none is left.

- [`element-nesting`]{#element-nesting}: An element that ends up inside itself fails, naming the chain. An element that's never closed fails too, and `<x />` is closed (`element-nested`, `tests/elements/elements.test.ts`).
- [`element-plain-tag`]{#element-plain-tag}: A hyphenated tag with no file is plain, and holds whatever elements it holds (`tests/elements/elements.test.ts`).
- [`element-wrap`]{#element-wrap}: The template writes the element's inner HTML, and the build writes the tag around it with its attributes, less `data`. So the tag is always in the page (`element-in-page`, `tests/elements/elements.test.ts`).
- [`element-block`]{#element-block}: A container holds block content in an element that is inline by default, so its `<style>` sets `display: block` (`element-in-page`).
- [`element-inline`]{#element-inline}: An inline element's output can't hold a tag that closes a `<p>`, such as `<div>` or `<ul>`. The build fails, naming the line, the element and the tag (`element-nested`, `error-inline-block`).
