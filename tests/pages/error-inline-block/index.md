---
title: inline-block
---

<!-- Expect: fails at line 7, since key-note is inline there and writes a <div>, which a browser would close the paragraph for. -->

A [term]{@key-note} in a paragraph.

```=html
<template element="key-note"><div><slot></slot></div></template>
```
