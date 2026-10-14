---
title: "Fish & Chips"
author: Ada
tags: [essays, food]
count: 3
---

<!-- Expect: each ${…} in prose is its page value, escaped, so the heading is "Fish &amp; Chips"
and its id is "fish--chips", from what it prints. A number prints as written. The link's
destination prints its value too. The code span and the escaped one stay literal. -->

# ${page.title}

By ${page.author}, read ${page.count} times.

A link to [the author](https://example.com/people/${page.author}).

Code keeps it literal: `${page.title}`, and so does \${page.title}.
