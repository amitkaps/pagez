---
title: Dotted keys
author.name: Ada
---

<!-- Expect: Markz reads author.name as one key, as YAML does. Open: whether ${page.author.name}
reaches it, or fails since page.author doesn't exist. -->

Written by ${page.author.name}.
