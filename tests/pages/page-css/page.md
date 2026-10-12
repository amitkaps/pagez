---
title: Page CSS
---

<!-- Expect: both <style> blocks move to the head, unlayered, the first before the second. Neither
is in the body. The raw block's other HTML stays where it is. -->

```=html
<style>
  h1 {
    color: teal;
  }
</style>
<p class="note">Raw HTML beside the first style, which stays in the body.</p>
```

# Page CSS

Prose between the two blocks.

```=html
<style>
  .note {
    font-style: italic;
  }
</style>
```
