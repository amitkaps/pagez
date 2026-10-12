---
title: in-page-definition
---

<!-- Expect: fails at line 13 of index.md, where the named slot is, as elementz reports it in a file. -->

{@call-out}
Text.
{/call-out}

```=html
<template element="call-out">
  <slot name="body"></slot>
</template>
```
