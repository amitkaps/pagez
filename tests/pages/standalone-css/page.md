---
title: Relative CSS references
---

<!-- Expect: the @import is inlined in place, and the url() becomes a data URL. -->

```=html
<style>
  @import "./extra.css";
  body {
    background: url(./dot.svg) repeat;
  }
</style>
```
