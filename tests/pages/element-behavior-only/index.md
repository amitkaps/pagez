---
title: Behavior only
---

<!-- Expect: the empty template writes no markup, so copy-code wraps its content as it is. Its
setup is in the page's one module. -->

{@copy-code}
```js
console.log("copy me");
```
{/copy-code}

```=html
<template element="copy-code"></template>
<script>
  export default (el, { signal }) => {
    const button = document.createElement("button");
    button.textContent = "Copy";
    button.addEventListener("click", () => navigator.clipboard.writeText(el.textContent), { signal });
    el.prepend(button);
  };
</script>
```
