/** @prose
 * # Reading an element file
 *
 * An element file read into its parts, each part as a module on the file's own lines, and every
 * check that needs only the file, each failing with the line.
 */
import { describe, expect, test } from "vite-plus/test";
import { FileError } from "../../src/elements/errors.ts";
import { readElement, setupModule, templateModule } from "../../src/elements/file.ts";

const file = "/site/code/@tag-filter.html";
const read = (source: string) => readElement(file, ["page", "pages", "site"], source);
const fails = (source: string) => {
  try {
    read(source);
  } catch (error) {
    if (error instanceof FileError) {
      const at =
        error.line && `line ${error.line}${error.column ? `, column ${error.column}` : ""}: `;
      return `${at || ""}${error.message} [${error.id}]`;
    }
    throw error;
  }
  throw new Error("expected it to fail");
};

const full = `<!-- Filters posts by tag. -->
<template element="tag-filter">
  <script>
    const tags = (pages) => pages.flatMap((p) => p.tags ?? []);
  </script>
  <p>\${tags(pages).map((t) => html\`<button>\${t}</button>\`)}</p>
</template>

<style>
  tag-filter {
    display: block;
  }
</style>

<script>
  export default (el, { signal }) => {
    el.addEventListener("click", () => {}, { signal });
  };
</script>
`;

describe("readElement", () => {
  test("reads each part, and the template's script apart from its markup", () => {
    const element = read(full);
    expect(element.name).toBe("tag-filter");
    expect(element.template!.script!.text).toContain("const tags");
    expect(element.template!.markup.text.trim()).toMatch(/^<p>/);
    expect(element.style!.text).toContain("display: block");
    expect(element.script!.text).toContain("export default");
  });

  test("gives each part as a module whose lines are the file's", () => {
    const element = read(full);
    const line = (code: string, text: string) =>
      code.split("\n").findIndex((l) => l.includes(text)) + 1;
    const template = templateModule(element, ["page", "pages", "site"]);
    expect(line(template, 'import { html } from "@amitkaps/pagez";')).toBe(1);
    expect(line(template, "const tags")).toBe(4);
    expect(line(template, "export default ({ attrs, page, pages, site }) => html`")).toBe(5);
    expect(line(template, "<p>")).toBe(6);
    expect(template).not.toContain("display: block");
    expect(line(setupModule(element), "addEventListener")).toBe(17);
  });

  test("takes every part as optional", () => {
    expect(read("").template).toBeUndefined();
    expect(read("<template><b>x</b></template>").template!.script).toBeUndefined();
    expect(read("<style>tag-filter { color: red }</style>").style).toBeDefined();
  });

  test.each([
    [
      "markup outside the template",
      "<p>x</p>",
      "line 1: <p> is outside the <template>.",
      "error-element-file-outside",
    ],
    [
      "text outside the template",
      "<template></template>\nhi",
      "line 2: this text is outside the <template>.",
      "error-element-file-outside",
    ],
    [
      "a second style",
      "<style></style><style></style>",
      "line 1: this is a second <style>.",
      "error-element-file-second-part",
    ],
    [
      "an unclosed template",
      "\n<template><b>x</b>",
      "line 2: <template> is never closed.",
      "error-element-file-unclosed",
    ],
    ["a stray end tag", "</div>", "line 1: </div> closes nothing.", "error-element-file-stray-end"],
    [
      "a template's script after its markup",
      "<template><p>x</p><script>export const a = 1;</script></template>",
      "the template's <script> comes after its markup",
      "error-template-script-after",
    ],
    [
      "two scripts in a template",
      "<template><script></script><p>x</p><script></script></template>",
      "this is a second <script> in the <template>",
      "error-template-two-scripts",
    ],
    [
      "an element name that isn't the file's",
      '<template element="tag-list"></template>',
      'write element="tag-filter" or leave it out',
      "error-name-mismatch",
    ],
    [
      "a named slot",
      '<template>\n<slot name="x"></slot></template>',
      "line 2: an element has one slot, with no name",
      "error-slot-named",
    ],
    [
      "a shadow root",
      '<template shadowrootmode="open"></template>',
      "shadowrootmode makes a shadow root",
      "error-template-shadow-root",
    ],
    [
      "a declaration named like the scope",
      "<template><script>\nconst page = 1;\n</script></template>",
      "line 2: this declares page, which the template already has (attrs, html, page, pages, site).",
      "error-template-own-name",
    ],
    [
      "an export named like the scope",
      "<template><script>\nexport function attrs() {}\n</script></template>",
      "line 2: this declares attrs, which the template already has",
      "error-template-own-name",
    ],
    [
      "a name in a pattern named like the scope",
      "<template><script>\nconst { a, b: [site] } = x;\n</script></template>",
      "line 2: this declares site, which the template already has",
      "error-template-own-name",
    ],
    [
      "an import of html, which the script has",
      '<template><script>\nimport { html } from "@amitkaps/pagez";\n</script></template>',
      "line 2: this imports html, which the template's script already has. Remove it.",
      "error-template-own-name",
    ],
    [
      "a default export in the template's script",
      "<template><script>export default 1;</script></template>",
      "the template's script has a default export",
      "error-template-default-export",
    ],
    [
      "</script> in a string",
      '<script>\nconst a = "</script>";\nexport default () => a;\n</script>',
      "line 2: this </script> is inside the script's code",
      "error-script-end-in-code",
    ],
    [
      "a browser script with no default",
      "<script>\nconst a = 1;\n</script>",
      "the <script> has no default export",
      "error-setup-no-default",
    ],
    [
      "a browser script that exports a class",
      "<script>\nexport default class extends HTMLElement {}\n</script>",
      "line 2: the <script> exports a class",
      "error-setup-class",
    ],
  ])("fails on %s", (_, source, message, id) => {
    expect(fails(source)).toContain(message);
    expect(fails(source)).toMatch(new RegExp(`\\[${id}\\]$`));
  });

  test("reads </script> written <\\/script> in a string, and <template> in one, as code", () => {
    expect(() =>
      read('<script>\nconst a = "<\\/script><template>";\nexport default () => a;\n</script>'),
    ).not.toThrow();
  });
});

describe("an element's CSS", () => {
  test.each([
    ["the tag", "tag-filter { color: red }"],
    [
      "the tag with a descendant, a class and a list",
      "tag-filter li, tag-filter.wide, tag-filter:not(:defined) p { color: red }",
    ],
    ["nesting", "tag-filter { & .frame { color: red } .x, .y { color: blue } }"],
    [
      "rules in @media and @layer",
      "@media (width > 40rem) { tag-filter { color: red } } @layer x { tag-filter p { color: red } }",
    ],
    [
      "at-rules with no selectors",
      "@keyframes spin { from { rotate: 0 } to { rotate: 1turn } } @import url(x.css);",
    ],
    ["a brace in a string and a comment", 'tag-filter::before { content: "}" } /* li { } */'],
  ])("passes %s", (_, css) => {
    expect(() => read(`<style>${css}</style>`)).not.toThrow();
  });

  test.each([
    [
      "another selector",
      "\np { color: red }",
      "line 2: the rule p doesn't start with tag-filter.",
      "error-style-selector",
    ],
    [
      "one in a list",
      "tag-filter, .x { color: red }",
      "the rule .x doesn't start with tag-filter.",
      "error-style-selector",
    ],
    [
      "a longer name",
      "tag-filter-x { color: red }",
      "the rule tag-filter-x doesn't start",
      "error-style-selector",
    ],
    [
      "one inside @media",
      "@media print { li { color: red } }",
      "the rule li doesn't start",
      "error-style-selector",
    ],
  ])("fails on %s", (_, css, message, id) => {
    expect(fails(`<style>${css}</style>`)).toContain(message);
    expect(fails(`<style>${css}</style>`)).toMatch(new RegExp(`\\[${id}\\]$`));
  });
});
