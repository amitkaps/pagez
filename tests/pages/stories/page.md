---
title: Write It Down
description: A short guide to writing a talk, in four parts.
url: https://example.com/write-it-down/
image: cover.svg
---

<!-- Expect: a stand-in with the shape of amitkaps.com/stories, whose source isn't public. It has
prose, grouped sections, figures and page styling, and no behavior. With no frame it gets the
reset and prose, and its own CSS is only its look, its sections and its figures. Its background
is light, so it sets color-scheme: light. No element CSS
and no <script>. Each image is inlined, and the font's URL @import is left as written, first in
the page's own <style>. -->

{@header}
{@nav}
[Home](https://example.com/) · [Plan](#plan) · [Draft](#draft) · [Revise](#revise) · [Share](#share)
{/nav}

{.cursive}
# Write It Down

_A short guide to writing a talk, in four parts._

{@figure .art}
![The guide's cover](./cover.svg)
{/figure}

> A talk takes longer to write than to give.

Writing a talk takes time, so plan for it. Here is a short guide, in four parts. Read it, then
start on your talk.
{/header}

{@section #plan}
{.cursive}
## Plan the talk

### Idea and audience

{@figure .art}
![Idea and audience](./plan-1.svg)
{/figure}

> One idea is enough for a talk.

One idea is enough for a talk. Say who it is for, and why they should care, before writing anything else.

### Time and shape

{@figure .art}
![Time and shape](./plan-2.svg)
{/figure}

> Give the plan its time.

Give the plan its time. A short talk takes longer to prepare than a long one, because there's less room for the parts that don't work.

{/section}

{@section #draft}
{.cursive}
## Draft it

### Many ideas

{@figure .art}
![Many ideas](./draft-1.svg)
{/figure}

> Write down more than you need.

Write down more than you need. Most won't last, and the ones that do are easier to see beside the rest.

### A first order

{@figure .art}
![A first order](./draft-2.svg)
{/figure}

> Put the ideas in an order a listener can follow.

Put the ideas in an order a listener can follow. Repeat the order as you go, so they know where they are.

{/section}

{@section #revise}
{.cursive}
## Revise it

### Cut

{@figure .art}
![Cut](./revise-1.svg)
{/figure}

> Remove what doesn't serve the one idea.

Remove what doesn't serve the one idea. What's left gets more of the audience's attention.

### Contrast

{@figure .art}
![Contrast](./revise-2.svg)
{/figure}

> Put what changed beside what came before it.

Put what changed beside what came before it. A difference is easier to see than a single thing.

{/section}

{@section #share}
{.cursive}
## Share it

### Rehearse

{@figure .art}
![Rehearse](./share-1.svg)
{/figure}

> Say it out loud, more than once.

Say it out loud, more than once. The words that are hard to say are the ones to change.

### Listen

{@figure .art}
![Listen](./share-2.svg)
{/figure}

> Leave room for questions.

Leave room for questions. What the audience asks shows what the talk didn't yet say.

{/section}

{@footer}
A stand-in page for Pagez's tests.
{/footer}

```=html
<style>
  @import url("https://fonts.googleapis.com/css2?family=Pacifico&display=swap");

  :root {
    --prose-font: Georgia, serif;
    color-scheme: light;
  }
  body {
    background: whitesmoke;
  }
  .cursive {
    font-family: Pacifico, Georgia, serif;
  }
  a {
    color: inherit;
    text-decoration: none;
    &:hover {
      border-bottom: 3px solid;
    }
  }
  header,
  section,
  footer {
    display: flow-root;
    padding: 4rem 2rem 2rem;
  }
  #plan {
    background: rgb(51 37 36 / 0.2);
  }
  #draft {
    background: rgb(63 72 74 / 0.2);
  }
  #revise {
    background: rgb(85 102 52 / 0.2);
  }
  #share {
    background: rgb(50 72 85 / 0.2);
  }
  .art img {
    width: 20rem;
    border-radius: 5px;
  }
  @media (min-width: 48em) {
    .art {
      float: right;
      clear: right;
      width: 40%;
    }
  }
</style>
```
