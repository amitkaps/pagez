---
title: "Fish & Chips"
author: Ada
tags: [essays, food]
count: 3
draft: false
---

<!-- Expect: each ${…} in prose is its page value, escaped, so the heading is "Fish &amp; Chips".
The code span and the escaped one stay literal. Open: how a list, a number, a boolean and null
print in prose, and what
id the heading gets, which Markz alone makes "section". -->

# ${page.title}

By ${page.author}, filed under ${page.tags}, read ${page.count} times, draft ${page.draft}.

A link to [the author](https://example.com/people/${page.author}).

Code keeps it literal: `${page.title}`, and so does \${page.title}.
