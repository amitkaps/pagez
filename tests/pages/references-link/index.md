---
title: A relative link
---

<!-- Expect: a link to a relative file is checked as an image is, and Vite's build gives it a hashed
name in dist/assets/. A link to a .md is to another page, checked, and written as the folder it's
built in, ./other/. -->

The [data](./data.csv) behind this page, and [another page](./other.md).
