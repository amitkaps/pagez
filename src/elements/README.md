# elements

The element layer: one `@name.html` file, read into its parts, rendered at build time and run in the browser ([elements.md](../../docs/elements.md)). It moved here from Sitez as `elementz`, and nothing here imports the rest of Pagez. Its tests are in `tests/elements/`.

- `file.ts` reads an element file into its parts, checks it, and writes each part as a module.
- `style.ts` checks that an element's CSS starts with its tag.
- `elements.ts` renders the elements in a piece of HTML, inside-out, each in its tag and with its content in its slot.
- `html.ts` is the template value that `html` makes, and `render.ts` turns it into HTML. The package's entry, `src/index.ts`, exports `html`.
- `markup.ts` finds the tags in a piece of HTML, for the element file, the host's frame and an element's output.
- `runtime.ts` is `define`, all of the elements' code that reaches the browser.
- `errors.ts` is a mistake in a file, which names it.
