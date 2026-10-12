---
title: An attribute from metadata
tags: [essays, food]
---

<!-- Expect: the tags attribute is the list itself, not its text, so the template maps over it. -->

{@tag-list tags=${page.tags} /}
