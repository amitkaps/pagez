---
title: A component from a URL
---

<!-- Expect: the script's full URL is left as written, and the browser defines sl-button. Nothing in
the build defines it, so it would warn as an undefined tag, but the page's CSS hides it until it's
defined, which also keeps it from flashing unstyled. -->

{@sl-button}

Click

{/sl-button}

```=html
<style>
  sl-button:not(:defined) {
    visibility: hidden;
  }
</style>
<script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/cdn/components/button/button.js"></script>
```
