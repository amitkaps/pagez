---
title: A template with a script
description: Five words in this one.
---

<!-- Expect: the template's script runs at build time, and its named export is in the
template's scope beside page and attrs. No script reaches the browser. -->

{@word-count /}

```=html
<template element="word-count">
  <script>
    export const words = (text) => text.split(/\s+/).filter(Boolean).length;
  </script>
  <p>${page.title}: ${words(page.description)} words in its description.</p>
</template>
```
