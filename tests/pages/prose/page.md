---
title: Every Markdown element
description: What prose does with each thing Markdown writes, and nothing else.
---

<!-- Expect: no frame and no CSS of its own, so the page is the reset and prose alone. Headings in
the serif stack and text in the sans one, each block on the measure, and tints mixed from the
text's color, in light and dark. The Year column is right-aligned, as Markdown says. Open: the
table, if it were wider than a phone. -->

# Every Markdown element, in prose

A paragraph with _emphasis_, **strong**, a [link](https://example.com), and `inline code`. This
sentence goes on long enough to wrap onto a second line, to show the measure and the leading at
work, as a real paragraph would. A long name in code wraps rather than widening the page:
`a-very-long-function-name-that-would-otherwise-push-the-page-sideways-on-a-phone`.

## A second-level heading that's long enough to wrap, to show balanced wrapping

- An unordered list
- with a second item
  - and a nested one

1. An ordered list
2. with two items

> A quote, set off by a rule at its start.
>
> It has a second paragraph.

### Code

```js
function greet(name) {
  return `Hello, ${name}! This line is long enough that it must scroll sideways on a phone.`;
}
```

#### A table

| Name  | Role     | Year |
| ----- | -------- | ---: |
| Ada   | Engineer | 1843 |
| Grace | Admiral  | 1947 |

---

![A square](./square.svg) An image in a paragraph stays inline.

{@figure}
![A square, in a figure](./square.svg)
{/figure}

##### Fifth level

###### Sixth level

What Markdown doesn't write, in HTML:

```=html
<p>Press <kbd>Ctrl</kbd> + <kbd>C</kbd>. H<sub>2</sub>O and x<sup>2</sup>, in
<abbr title="HyperText Markup Language">HTML</abbr>, with <small>small print</small> and
<mark>a mark</mark>.</p>
<dl>
  <dt>Term</dt>
  <dd>Its definition.</dd>
  <dt>Another</dt>
  <dd>And its own.</dd>
</dl>
<details>
  <summary>More</summary>
  <p>What was folded away.</p>
</details>
```
