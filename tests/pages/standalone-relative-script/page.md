---
title: A relative script
---

<!-- Expect: chart.js and the data.js it imports are bundled into the page's one inline module.
Nothing outside the HTML file is loaded. -->

```=html
<div id="chart"></div>
<script type="module" src="./chart.js"></script>
```
