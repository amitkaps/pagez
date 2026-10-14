---
title: Every Markdown element
description: What the theme does with each thing Markdown writes, and nothing else.
---

<!-- Expect: no frame and no CSS of its own, so the page is Pagez's theme alone. Headings in the
serif stack and text in the sans one, in one centered column, and tints mixed from the text's
color, in light and dark. The Year column is right-aligned, as Markdown says. The code's long
line scrolls. Open: the table, if it were wider than a phone. -->

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
  if (name) {
    return `Hello, ${name}! This line is long enough to wrap, and its wrapped part is indented under it.`;
  }
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

[A caption under the square.]{@figcaption /}
{/figure}

- [x] A task that's done
- [ ] and one that isn't

##### Fifth level

###### Sixth level

### What Markz writes as elements

Press [Ctrl]{@kbd} + [C]{@kbd}. H[2]{@sub}O and x[2]{@sup}, in
[HTML]{@abbr title="HyperText Markup Language"}, with [small print]{@small} and [a mark]{@mark}.
~~Old~~ [new]{@ins}, [struck]{@s}, [bold]{@b}, [italic]{@i} and [underlined]{@u}. As
[Ada Lovelace]{@cite} wrote, [the engine weaves algebraic patterns]{@q}. A [term]{@dfn} is
defined once. Let [n]{@var} be the count, and the output be [Done.]{@samp} On
[the first of May]{@time datetime="2026-05-01"}, [forty-two]{@data value="42"} came. Arabic
[مرحبا]{@bdi} sits in a line, and [backwards]{@bdo dir="rtl"} runs right to left.

{@dl}
[Term]{@dt /}
[Its definition.]{@dd /}
[Another]{@dt /}
[And its own.]{@dd /}
{/dl}

{@details}
[More]{@summary /}

What was folded away.
{/details}

{@aside}
An aside, which is a block like any other.
{/aside}

{@address}
1 Example Street, Example City
{/address}
