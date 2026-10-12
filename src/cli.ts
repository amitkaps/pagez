#!/usr/bin/env node
/** @prose
 * # The command
 *
 * `pagez page.md` writes `page.html` beside it, one standalone file. `-o` names another place,
 * and `-o -` writes it to the screen. A mistake in the page prints its file and what to change,
 * and exits with 1.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { FileError } from "./elementz/errors.ts";
import { compile } from "./page.ts";
import { standalone } from "./standalone.ts";

const USAGE = "Usage: pagez page.md [-o page.html]";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string", short: "o" }, help: { type: "boolean", short: "h" } },
});

if (values.help || positionals.length !== 1) {
  console.log(USAGE);
  process.exit(values.help ? 0 : 1);
}

const file = resolve(positionals[0]!);
try {
  const html = standalone(compile(file));
  if (values.out === "-") process.stdout.write(html);
  else writeFileSync(values.out ?? file.replace(/(\.md)?$/, ".html"), html);
} catch (error) {
  if (!(error instanceof FileError)) throw error;
  console.error(`${error.file}: ${error.message}`);
  process.exit(1);
}
