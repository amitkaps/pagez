---
title: Undefined tags
---

<!-- Expect: one warning, for x-typo, at its line. sl-badge has a selector in the page's CSS, so it
doesn't warn. Both are written as Markz writes them. -->

{@x-typo}
No definition, and no CSS.
{/x-typo}

{@sl-badge}
Styled by the page.
{/sl-badge}

```=html
<style>
  sl-badge {
    font-weight: bold;
  }
</style>
```
