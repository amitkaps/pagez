---
title: A component from a URL
---

<!-- Expect: the script's full URL is left as written, and the browser defines sl-button. Open:
whether sl-button warns as an undefined tag, since nothing in the build defines it. -->

{@sl-button}
Click
{/sl-button}

```=html
<script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/cdn/components/button/button.js"></script>
```
