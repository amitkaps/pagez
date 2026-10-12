---
title: A relative script
---

<!-- Expect: chart.js and the data.js it imports are bundled into the page's one inline module,
since a module script's src doesn't load from disk. -->

```=html
<div id="chart"></div>
<script type="module" src="./chart.js"></script>
```
