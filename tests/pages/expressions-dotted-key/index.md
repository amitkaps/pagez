---
title: Dotted keys
author.name: Ada
---

<!-- Expect: Markz reads author.name as one key, as YAML does, and ${page.author.name} reaches it,
since the longest key that matches wins. -->

Written by ${page.author.name}.
