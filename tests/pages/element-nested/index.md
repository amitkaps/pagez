---
title: Nested elements
---

<!-- Expect: elements render innermost first. The inline key-word inside the call-out renders,
and so does the key-word that term-list's template writes. call-out is in a file and the other
two are in the page, so the two forms mix. -->

{@call-out}
Press [Ctrl]{@key-word} to begin.
{/call-out}

{@term-list /}

```=html
<template element="key-word"><kbd><slot></slot></kbd></template>
```

```=html
<template element="term-list">
  <ul>
    ${["Ctrl", "Alt"].map((key) => html`<li><key-word>${key}</key-word></li>`)}
  </ul>
</template>
```
