# Lessons

What building pagez taught, for whoever changes it next. Each lesson says what went wrong and what to do about it. What the code does now is in its `@prose`, and the story is in the pull request. What works now is in [the plan](plan.md#where-it-is).

The first groups follow the principles in [craftz's Practice](https://craftz.amitkaps.com/docs/rules.md#practice), and each says what holds its principle here. pagez's own groups come after them. A lesson that repeats one in its group means the principle needs a check.

## Try it on the real thing

The rule is [Try it on the real thing](https://craftz.amitkaps.com/docs/rules.md#try-it-on-the-real-thing). `pnpm speed` builds a large site, and each feature's test page is written before its code.

- **A real site found what the test sites didn't.** A site of 66 pages built in 12 s, where its old build took 1.3 s, since the plugin read the whole site again about 470 times a build. A three-page test site never showed it. Time a change on the largest site at hand.
- **Rebuilding a real page settled the design.** A Jekyll page of six chapters and 41 images, rebuilt as one Markz page, took its CSS from 208 lines to about 70, and showed a frame needs social tags pagez doesn't write. Judge a change on a real page beside the one it replaces, block for block, wide and on a phone.
- **Writing the test page first showed the question.** 49 pages were written before the compiler, each saying what it builds to or fails with, and their `Open:` notes were design questions. Write the test page for a feature before its code.

## Measure before changing

The rule is [Measure before changing](https://craftz.amitkaps.com/docs/rules.md#measure-before-changing). `pnpm speed` times a change against `main`, and `pnpm hotspots` profiles the large site.

- **Measuring a page settled the framework.** A course listing built with Svelte's islands loaded 206 KB of JavaScript, and the same page without a framework loaded 2 KB. Measure a page before choosing what renders it.
- **The build grew with the square of its pages.** On a site of 305 pages, every page listed the site's files and made its links again. A profile of a large site found it, where timing the small ones never would.
- **A section's files were larger than they needed to be.** svgo, WebP where smaller and a font subset took one page's SVGs from 528 KB to 308 KB and its photos from 229 KB to 130 KB. pagez doesn't do this, so run them on a page's files in its source.

## State it once

The rule is [State it once](https://craftz.amitkaps.com/docs/rules.md#state-it-once). A test holds the Errors and Warnings tables to the ids the source throws, both ways, and another holds the commands to usage's ids.

- **A list kept apart from the code drifted from it.** The usage line in `args.ts`, usage.md and the README each listed the commands, and none had `help`. The Errors table had 35 rows, and the source failed in 78 ways, 14 with no test. A case written for one of them found a module that named its file wrong. Key a list by the ids the code uses, and hold the two to each other.

## Silence is the failure

The rule is [Silence is the failure](https://craftz.amitkaps.com/docs/rules.md#silence-is-the-failure). `pagez check` fails on a Markz warning.

- **A warning nobody had to read was never read.** Markz warned 79 times across the test pages, and nothing printed it, since a build that passes isn't read. A warning fails the check where it's written.

## Parse, don't match text

The rule is [Parse, don't match text](https://craftz.amitkaps.com/docs/rules.md#parse-dont-match-text). Markz's reader reads the docs' rules and tables.

- **A regex per layout read each doc its own way.** `pagez rules` and the docs test each kept regexes for a rule's line and a table's row. They stripped a rule's links, and printed a Markz code in a form of their own. Read a doc with Markz's reader, and print an error in the same line as prose's and craftz's.

## Build only what gets used

The rule is [Build only what gets used](https://craftz.amitkaps.com/docs/rules.md#build-only-what-gets-used).

- **Pages that stood in for the host doubled a moved site.** A site listed two old addresses for each of 45 pages, and pagez wrote 90 pages that refresh. Its host reads `_redirects`, and already sends `/x` and `/x.html` to `/x/`. Write what the host reads, not pages that stand in for it.
- **A name of its own outlived its reason.** The element layer was named elementz while it had two hosts. With one, it's pagez's elements, and the line between them is kept in the code.

## Where the output goes

- **One standalone file didn't scale.** Inlining every image, font and stylesheet as a data URL built one page to 1 MB of base64 that couldn't be read, cached or shared. Ship files as files, hashed, so a browser caches them.
- **Output beside the source mixed them.** `index.html` beside `index.md` opened from disk, but put generated files in every folder of a site. Build to `dist/`, apart from the source ([The folder](pages.md#the-folder)).

## CSS

- **A layer lost to every unlayered rule.** Element CSS in `@layer elements` let a page's `h2` restyle every element's headings. Put only the host's defaults in a layer, never what must win ([CSS](pages.md#css)).
- **Custom properties didn't survive a page's own CSS.** An element that used `--prose-step-3` lost it on any page whose `style.css` replaced the stylesheet that set it. Keep one theme with nothing to configure, and let a page write its own `style.css` for another look ([CSS](pages.md#css)).
- **A bare `style.css` was one file to Vite.** Vite resolved `href="style.css"` to one file for every page, so a folder's own was lost whenever the root had one. No test site had both, so a real one showed it. Link a design file from the page's folder, as `./style.css`, and test one at two levels at once.

## Elements

- **A reserved attribute was the wrong owner for data.** `data="notes.json"` was written eleven times in one essay, and every grid named the one file it always read. Give data to whoever always reads it, which here was an import beside the element.
- **Two copies of a module broke `instanceof`.** A template loads pagez through Vite's module runner, and the build loads it through Node, so a class's check failed between the two. Mark a value shared across that line with `Symbol.for`, as `src/elements/html.ts` does.
