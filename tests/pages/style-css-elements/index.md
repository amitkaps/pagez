---
title: The page's CSS and an element's
---

<!-- Expect: style.css sets the page's tag defaults, and the element's CSS is written before it,
unlayered. The element's `note-card h2` outranks the page's `h2`, so its heading is small, and
the page's `note-card h2` is as specific and later, so its heading is green. No theme. -->

# Notes

{@note-card}
## A card

Its heading is the element's size, in the page's green.

{/note-card}

## After the card

A heading in the page's size and blue.
