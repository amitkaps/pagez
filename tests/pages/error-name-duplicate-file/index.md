---
title: name-duplicate-file
---

<!-- Expect: fails at the template's line, since @call-out.html defines it too. -->

{@call-out}
Text.
{/call-out}

```=html
<template element="call-out"><p><slot></slot></p></template>
```
