# Lessons

What building pagez taught, for whoever changes it next. Each lesson says what happened and what to do about it. What each piece of work shipped is in git and the release notes, and what works now is in [the plan](plan.md#where-it-is).

## Designing on real pages

- **Measuring a page settled the framework.** A course listing, built with Svelte's islands, loaded 206 KB of JavaScript, and the same page built without a framework loaded 2 KB. So pagez writes HTML at build time, and an element ships only the script its behavior needs. Measure a page before choosing what renders it.
- **Test pages came before the compiler.** 49 pages were written first, each saying what it builds to or fails with, and their `Open:` notes were design questions. The compiler then turned them from todos into reviewed snapshots, one piece at a time. Write the test page for a feature before its code, so the question shows before the code needs an answer.
- **Rebuilding a real page settled the design.** A Jekyll page of six chapters and 41 images, rebuilt as one Markz page, took its CSS from 208 lines to about 70. It also showed a frame needs social tags Pagez doesn't write, such as `twitter:site`, so a frame may write them. Judge a change on a real page beside the one it replaces, block for block, wide and on a phone.
- **A section's files were larger than they needed to be.** svgo, WebP where smaller and a font subset took that page's SVGs from 528 KB to 308 KB, its photos from 229 KB to 130 KB and its font from 39 KB to 26 KB. Pagez doesn't do this. Run them on a page's files in its source.
- **A real site found what the test sites didn't.** A site of 66 pages built in 12 s, where its old build took 1.3 s. The plugin read the whole site again in each `resolveId` and `load`, about 470 times a build, which a test site of three pages never showed. Read the site once a build, and time a change on the largest site at hand.
- **Each page walked the whole folder.** On a site of 305 pages, every page listed the site's files again to find its elements and files, and made the site's links again, so the build grew with the square of its pages. Reading the files and links once a build made it 20% faster. A profile of a large site found it, where timing the small ones never would.
- **A table of cases missed the mistakes no case made.** The Errors table had a row for each `error-…` case, 35 of them, and the source failed in 78 ways. 14 had no test at all, and a case written for one found that a module a template imports named its file wrong. Key a table of failures by the ids the source throws, and hold the two to each other.
- **A warning nobody had to read was never read.** Markz warned 79 times across the test pages, at element lines beside text, and nothing printed it, since a build that passes isn't read. `pagez check` fails on a warning, so one shows where it's written, and the pages were fixed to pass it.
- **A command stated in three places drifted.** The usage line in `args.ts`, the shell block in usage.md and the README each listed the commands, and none had `help`. Each command is now an item with its id in usage.md, `pagez help` prints it, and a test holds the ids to the command's branches.
- **A regex per layout read each doc its own way.** `pagez rules` and the docs test each kept regexes for a rule's line and a table's row. They stripped a rule's links, and printed a Markz code in a form of their own. Markz's reader reads both now, as prose's and craftz's rules are read. An error prints in the same line as theirs, so one pattern finds the id in any tool's output.

## Where the output goes

- **One standalone file didn't scale.** Pagez first wrote each page as one file, with every image, font and stylesheet inlined as a data URL. The real page built to 1 MB of base64 that couldn't be read, cached or shared. Ship files as files, hashed, so a browser caches them.
- **Output beside the source mixed them.** Then Pagez wrote `index.html` beside `index.md`, which opened from disk with no build step. For a site, that's generated files in every folder of the source. Build to `dist/`, apart from the source ([The folder](pages.md#the-folder)).
- **Redirects as pages doubled a moved site.** That site listed two old addresses for each of 45 pages, and Pagez wrote 90 pages that refresh, since a static host can't send a 301 from a file. Its host reads `_redirects`, and already sends `/x` and `/x.html` to `/x/`, so one line for each spelling replaced them. Write what the host reads, not pages that stand in for it.

## CSS

- **A layer lost to every unlayered rule.** Element CSS was in `@layer elements`, so a page's `h2` restyled every element's headings. Element CSS is unlayered now, before the page's, and its selectors start with the tag. Put only the host's defaults in a layer, never what must win ([CSS](pages.md#css)).
- **Custom properties didn't survive a page's own CSS.** A reset and a prose stylesheet of about 400 lines had eight custom properties, and a `style.css` replaced both. So an element that used `--prose-step-3` lost it on any page with CSS of its own. One theme with nothing to configure replaced them, and a page that wants another look writes its `style.css` ([CSS](pages.md#css)).
- **A bare `style.css` was one file to Vite.** Each page linked its nearest `style.css` as `href="style.css"`, and Vite resolved that name to one file for every page, so a folder's own `style.css` was lost whenever the root had one. The test sites had a `style.css` in subfolders and none at the root, so nothing showed it until a real site built. Write a link from the page's folder as `./style.css`, and test a design file at two levels at once.

## Elements

- **A reserved attribute was the wrong owner for data.** `data="notes.json"` was written eleven times in one essay, and every grid named the one file it always read. The file belonged to the element, so an import beside it replaced the attribute, and `data` became a plain string like any other. Give data to whoever always reads it.
- **Two copies of a module broke `instanceof`.** A template loads Pagez through Vite's module runner, and the build loads it through Node, so a class's check failed between the two. Mark a value shared across that line with a registered symbol, `Symbol.for`, as `src/elements/html.ts` does.
- **A name of its own outlived its reason.** The element layer was named elementz while it had two hosts. With one, it's Pagez's elements, and the line between them is kept in the code, which imports nothing else from Pagez.
