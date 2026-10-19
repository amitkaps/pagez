# Usage

Pagez isn't built yet, and nothing on npm uses this name. This is what using it will look like, from [the design](design.md).

## Install

```sh
pnpm add @amitkaps/pagez
```

It needs Node 26 or newer, the Node it's built and tested on.

## Use

The command writes one standalone HTML file beside the page.

```sh
pnpm exec pagez essay.md    # writes essay.html
```

The library returns the parts, so a host like Sitez can bundle them itself: the head, the body, and the CSS and JS of the elements the page uses.

## For agents

What an agent using Pagez should know, as a snippet to copy into its instructions. It's written once Pagez is built.
