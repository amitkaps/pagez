/** @prose
 * # A large site
 *
 * What `pnpm speed` and `pnpm hotspots` build: a site of a few hundred pages, written into a
 * folder, since the test sites' handful of pages never showed a slow build. It has what a real
 * site's build pays for:
 *
 * - three folders of posts, each with an index that lists its posts from `pages`
 * - shared elements, one with behavior
 * - a template that imports a large package, `happy-dom`
 * - data beside the pages
 * - a frame and a `style.css`
 * - links between pages
 * - redirects
 * - a `404.md`
 *
 * The folder gets a `node_modules` linked to Pagez's own, so the package resolves beside it.
 */
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const FOLDERS = ["essays", "talks", "notes"];

const write = (file: string, text: string) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};

/** Words for a paragraph, the same for the same `n`, so every run builds the same site. */
function words(n: number, count: number): string {
  const all =
    "the a page site build folder element link data frame style talk note essay idea time shape draft".split(
      " ",
    );
  return Array.from({ length: count }, (_, i) => all[(n * 7 + i * 3) % all.length]).join(" ");
}

/** Writes the site into `dir`, emptied first, with `pages` posts across its folders. */
export function writeSite(dir: string, pages: number = 300): void {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  symlinkSync(join(import.meta.dirname, "../../node_modules"), join(dir, "node_modules"), "dir");
  write(join(dir, "pagez.md"), "---\nurl: https://example.com/\nauthor: A. Writer\n---\n");
  write(
    join(dir, "frame.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>A large site</title>
  </head>
  <body>
    <nav>${FOLDERS.map((folder) => `<a href="/${folder}/">${folder}</a>`).join(" · ")}</nav>
    <main><slot></slot></main>
    <footer><site-author></site-author></footer>
  </body>
</html>
`,
  );
  write(
    join(dir, "style.css"),
    "body { margin: 0 auto; max-width: 60ch; }\nfold-out { display: block; }\n",
  );
  write(join(dir, "@site-author.html"), "<template>${site.author}</template>\n");
  write(
    join(dir, "@post-list.html"),
    `<template>
<script>
const posts = (pages, under) =>
  pages.filter((page) => page.path.startsWith(under) && page.path !== under);
</script>
<ul>\${posts(pages, attrs.under).map((post) => html\`<li><a href="\${post.path}">\${post.title}</a></li>\`)}</ul>
</template>
`,
  );
  write(
    join(dir, "@word-count.html"),
    `<template>
<script>
import { Window } from "happy-dom";
const count = (text) => {
  const window = new Window();
  window.document.body.innerHTML = text;
  const words = window.document.body.textContent.split(/\\s+/).filter(Boolean).length;
  window.close();
  return words;
};
</script>
<span>\${count(page.description ?? "")} words</span>
</template>
`,
  );
  write(
    join(dir, "@data-table.html"),
    `<template>
<table>\${attrs.data.map((row) => html\`<tr><td>\${row.name}</td><td>\${row.value}</td></tr>\`)}</table>
</template>
`,
  );
  write(
    join(dir, "@fold-out.html"),
    `<template>
  <button aria-expanded="false">\${attrs.label ?? "More"}</button>
  <div hidden><slot></slot></div>
</template>

<style>
  fold-out button { font: inherit; }
</style>

<script>
  export default (el, { signal }) => {
    const button = el.querySelector("button");
    const text = el.querySelector("div");
    button.addEventListener("click", () => (text.hidden = !text.hidden), { signal });
  };
</script>
`,
  );
  write(
    join(dir, "index.md"),
    `---\ntitle: Home\n---\n\n# Home\n\n${FOLDERS.map((folder) => `- [${folder}](${folder}/index.md)`).join("\n")}\n`,
  );
  write(
    join(dir, "404.md"),
    "---\ntitle: Not found\n---\n\n# Not found\n\nTry [the home page](index.md).\n",
  );
  for (const folder of FOLDERS) {
    write(
      join(dir, folder, "index.md"),
      `---\ntitle: ${folder}\n---\n\n# ${folder}\n\n{@post-list under="/${folder}/" /}\n`,
    );
    const rows = Array.from({ length: 20 }, (_, i) => ({ name: words(i, 2), value: i * 3 }));
    write(join(dir, folder, "rows.json"), JSON.stringify(rows));
  }
  for (let n = 0; n < pages; n++) {
    const folder = FOLDERS[n % FOLDERS.length]!;
    const next = FOLDERS[(n + 1) % FOLDERS.length]!;
    const moved = n % 10 === 0 ? `redirects: [/old-${n}/]\n` : "";
    write(
      join(dir, folder, `post-${n}.md`),
      `---
title: Post ${n}
description: ${words(n, 12)}
${moved}---

# Post ${n}

{@word-count /}

${words(n, 40)}. See [post ${n + 1}](../${next}/post-${(n + 1) % pages}.md).

## Details

{@fold-out label="More"}

${words(n + 1, 30)}.

{/fold-out}

{@data-table data="rows.json" /}

${words(n + 2, 40)}.
`,
    );
  }
}
