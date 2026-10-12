---
title: Defined, not used
---

<!-- Expect: neither element is used, so the page has no element CSS and no script. The in-page
definition isn't emitted either. -->

Nothing but prose here.

```=html
<template element="call-out">
  <aside class="${attrs.type ?? "note"}"><slot></slot></aside>
</template>
<style>
  call-out {
    display: block;
    border-left: 4px solid;
    padding-left: 1rem;
  }
</style>
```
