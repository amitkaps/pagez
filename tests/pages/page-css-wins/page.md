---
title: The page's CSS wins
---

<!-- Expect: the element's CSS is in @layer elements and the page's isn't, so the page's border
color applies. -->

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
