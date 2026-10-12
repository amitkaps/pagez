---
title: An attribute from metadata
tags: [essays, food]
---

<!-- Expect: the tags attribute is the list itself, not its text, so the template maps over it. The tag
is written without it, since only a string reaches the browser. -->

{@tag-list tags=${page.tags} /}

```=html
<template element="tag-list">
  <ul>
    ${attrs.tags.map((tag) => html`<li>${tag}</li>`)}
  </ul>
</template>
```
