---
title: The page's CSS wins
---

<!-- Expect: the element's CSS is in the head and the page's `<style>` is after it, with a
selector as specific, so the page's border color applies. -->

{@call-out}

A red border, from the page.

{/call-out}

```=html
<style>
  call-out {
    border-color: red;
  }
</style>
```
