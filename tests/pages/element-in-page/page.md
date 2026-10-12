---
title: An element in the page
---

<!-- Expect: both call-outs rendered from the definition at the end, with their Markdown in the
slot. The definition's block isn't emitted. The CSS is written once, in @layer elements. No
script, since call-out has no setup. Same output as element-file, which holds the same
definition in a file. -->

# Notes

{@call-out type=note}
Markdown **inside**, in the slot.
{/call-out}

{@call-out type=warning}
A second one. Its CSS is still written once.
{/call-out}

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
