---
title: Slot fallback
---

<!-- Expect: the leaf has no content, so its slot's fallback shows. The container's content
replaces the fallback. -->

{@empty-note /}

{@empty-note}
Something to say after all.
{/empty-note}

```=html
<template element="empty-note">
  <aside><slot>Nothing to say here.</slot></aside>
</template>
```
