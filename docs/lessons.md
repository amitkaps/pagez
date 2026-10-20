# Lessons

What building pagez taught, for whoever changes it next. Each lesson says what happened and what to do about it. What each piece of work shipped is in git and the release notes, and what works now is in [the plan](plan.md#where-it-is).

## Designing on real pages

- **Test pages came before the compiler.** 49 pages were written first, each saying what it builds to or fails with, and their `Open:` notes were design questions. The compiler then turned them from todos into reviewed snapshots, one piece at a time. Write the test page for a feature before its code, so the question shows before the code needs an answer.
- **Rebuilding a real page settled the design.** A Jekyll page of six chapters and 41 images, rebuilt as one Markz page, took its CSS from 208 lines to about 70. It also showed a frame needs social tags Pagez doesn't write, such as `twitter:site`, so a frame may write them. Judge a change on a real page beside the one it replaces, block for block, wide and on a phone.
- **A section's files were larger than they needed to be.** svgo, WebP where smaller and a font subset took that page's SVGs from 528 KB to 308 KB, its photos from 229 KB to 130 KB and its font from 39 KB to 26 KB. Pagez doesn't do this. Run them on a page's files in its source.
- **A real site found what the test sites didn't.** A site of 66 pages built in 12 s, where its old build took 1.3 s. The plugin read the whole site again in each `resolveId` and `load`, about 470 times a build, which a test site of three pages never showed. Read the site once a build, and time a change on the largest site at hand.

## Where the output goes

- **One standalone file didn't scale.** Pagez first wrote each page as one file, with every image, font and stylesheet inlined as a data URL. The real page built to 1 MB of base64 that couldn't be read, cached or shared. Ship files as files, hashed, so a browser caches them.
- **Output beside the source mixed them.** Then Pagez wrote `index.html` beside `index.md`, which opened from disk with no build step. For a site, that's generated files in every folder of the source. Build to `dist/`, apart from the source ([The folder](pages.md#the-folder)).

## CSS

- **A layer lost to every unlayered rule.** Element CSS was in `@layer elements`, so a page's `h2` restyled every element's headings. Element CSS is unlayered now, before the page's, and its selectors start with the tag. Put only the host's defaults in a layer, never what must win ([CSS](pages.md#css)).
- **Custom properties didn't survive a page's own CSS.** A reset and a prose stylesheet of about 400 lines had eight custom properties, and a `style.css` replaced both. So an element that used `--prose-step-3` lost it on any page with CSS of its own. One theme with nothing to configure replaced them, and a page that wants another look writes its `style.css` ([CSS](pages.md#css)).

## Elements

- **Two copies of a module broke `instanceof`.** A template loads Pagez through Vite's module runner, and the build loads it through Node, so a class's check failed between the two. Mark a value shared across that line with a registered symbol, `Symbol.for`, as `src/elements/html.ts` does.
- **A name of its own outlived its reason.** The element layer was named elementz while it had two hosts. With one, it's Pagez's elements, and the line between them is kept in the code, which imports nothing else from Pagez.
