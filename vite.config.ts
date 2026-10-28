/** @prose
 * # The build
 *
 * One Vite+ config packs the package and checks it. `vp pack` writes ESM with its types, and
 * runs publint, which fails the build on a package npm would serve badly.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite-plus";
import { format } from "vite-plus/fmt";

/** @prose
 * # Files as text
 *
 * `src/theme.css` is imported with `?built`, as text that's ready to ship, as prose's page files
 * are. It ships inside `dist/`, so the package is code alone. Its comments are stripped, since its
 * prose is for the repository, and oxfmt formats what's left. The pack and the tests both load it
 * through this plugin, so the tests check what ships.
 */
function stripComments(text: string): string {
  // A string is matched first and kept, so a `/*` inside one isn't read as a comment.
  return text.replace(
    /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\/\*[\s\S]*?\*\//g,
    (match, string?: string) => string ?? " ",
  );
}

// Vite's CSS handling claims any id with `.css` before its end or a `?`, and empties it in the
// tests. So a built file's id ends in `.built` instead.
const BUILT = "\0built:";

const built = {
  name: "built",
  enforce: "pre" as const,
  resolveId(id: string, importer?: string) {
    if (!id.endsWith("?built") || !importer) return null;
    return BUILT + resolve(dirname(importer), id.slice(0, -"?built".length)) + ".built";
  },
  async load(id: string) {
    if (!id.startsWith(BUILT)) return null;
    const file = id.slice(BUILT.length, -".built".length);
    const { code, errors } = await format(file, stripComments(readFileSync(file, "utf8")));
    if (errors.length) throw new Error(`${file}: ${JSON.stringify(errors)}`);
    return `export default ${JSON.stringify(code)};`;
  },
};

// The test pages are inputs, left the way a page's author would write them, and their snapshots
// are Pagez's output, as it writes them.
const ignored = ["tests/pages/**", "tests/sites/**", "tests/snapshots/**"];

export default defineConfig({
  plugins: [built],

  pack: {
    entry: ["src/index.ts", "src/cli.ts", "src/vite.ts"],
    format: ["esm"],
    platform: "node",
    dts: { generator: "oxc" },
    clean: true,
    fixedExtension: false,
    // Readable code without its prose, as prose ships: not minified, so it can be followed in
    // node_modules, with license comments and annotations kept, and no sourcemaps, since they would
    // carry every source file whole, and the source is on GitHub.
    sourcemap: false,
    banner: { js: "/*! @amitkaps/pagez · MIT License · https://github.com/amitkaps/pagez */" },
    outputOptions: { comments: { legal: true, annotation: true, jsdoc: false } },
    publint: { strict: true },
    plugins: [built],
  },

  // Oxfmt and Oxlint — `vp check`. What they leave alone, beside what craftz's rules set.
  fmt: { ignorePatterns: ignored, proseWrap: "never" },
  lint: {
    ignorePatterns: ignored,
    plugins: ["typescript", "unicorn", "import"],
    categories: { correctness: "error" },
    options: { typeAware: true, typeCheck: true },
  },

  test: {
    expect: { requireAssertions: true },
    include: ["tests/**/*.test.ts"],
  },

  /** @prose
   * # Verify
   *
   * `verify` runs `all`, whose tasks run side by side, as
   * [craftz's rules](https://craftz.amitkaps.com/docs/rules.md#scripts-verify) say. The size
   * budget builds its pages with the plugin in `dist/`, so `budget` waits for `build`.
   */
  run: {
    cache: false,
    tasks: {
      budget: { command: "pnpm size", dependsOn: ["build"] },
      all: { command: "true", dependsOn: ["check", "test", "build", "budget", "site"] },
    },
  },
});
