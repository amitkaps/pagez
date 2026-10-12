---
title: Adjusting prose
---

<!-- Expect: the custom properties change prose's font and measure. The rule in @layer prose
joins prose's own layer, so it still loses to the unlayered rule after it. -->

# Adjusting prose

A page in Georgia, with a narrower measure.

```=html
<style>
  :root {
    --prose-font: Georgia, serif;
    --prose-measure: 32rem;
  }
  @layer prose {
    blockquote {
      font-style: italic;
    }
  }
  blockquote {
    font-style: normal;
  }
</style>
```

> Normal, since the page's rule wins.
