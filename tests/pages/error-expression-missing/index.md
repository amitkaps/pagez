---
title: expression-missing
---

<!-- Expect: fails at the expression's line and column, since page has no subtitle. A
missing value fails rather than printing nothing, which would hide a typo. -->

The subtitle is ${page.subtitle}.
