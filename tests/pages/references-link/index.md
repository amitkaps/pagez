---
title: A relative link
---

<!-- Expect: a link to a relative file is checked as an image is, and Vite's build gives it a hashed
name in dist/assets/. A link to a .md is to another page, which isn't checked until a folder
builds many pages. -->

The [data](./data.csv) behind this page, and [another page](./other.md).
