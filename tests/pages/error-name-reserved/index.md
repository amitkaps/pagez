---
title: name-reserved
---

<!-- Expect: fails at the template's line, since font-face is a reserved name. -->

Text.

```=html
<template element="font-face"><p><slot></slot></p></template>
```
