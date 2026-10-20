---
title: name-duplicate-page
---

<!-- Expect: fails at the second template's line, naming the first. -->

{@call-out}

Text.

{/call-out}

```=html
<template element="call-out"><p><slot></slot></p></template>
```

```=html
<template element="call-out"><p><slot></slot></p></template>
```
