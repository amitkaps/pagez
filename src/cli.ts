#!/usr/bin/env node
/** @prose
 * # The command
 *
 * `pagez build` builds the pages in a folder, each `.md` at its folder's path, to the folder's
 * `dist/`. `pagez dev` serves them while they're written, and `pagez preview` serves what was
 * built.
 *
 * Each takes the folder, or works in the current one, and `dev` and `preview` take `--port`
 * (`args.ts`). They're Vite's own commands with Pagez's plugin, for a folder with no Vite config
 * of its own. A mistake in a page prints its file and what to change, and exits with 1.
 *
 * `pagez check` lists every page's mistake and every warning, and exits with 1 if there's any, so
 * a warning is fixed before it ships (`check.ts`). `pagez rules <id>` prints a rule (`rules.ts`).
 */
import { resolve } from "node:path";
import { build, createServer, preview } from "vite-plus";
import { readArgs, USAGE } from "./args.ts";
import { check } from "./check.ts";
import { printedRule } from "./rules.ts";
import pagez from "./vite.ts";

const args = readArgs(process.argv.slice(2));
if ("print" in args) {
  (args.code ? console.error : console.log)(args.print);
  process.exit(args.code);
}
if (args.command === "rules") {
  const rule = printedRule(args.id);
  if (rule === undefined) {
    console.error(
      `${args.id} isn't a rule, an error or a warning. pagez rules lists the rules.\n${USAGE}`,
    );
    process.exit(1);
  }
  console.log(rule);
  process.exit(0);
}
if (args.command === "check") {
  const { pages, failures, warnings } = await check(resolve(args.folder));
  const found = [...failures, ...warnings];
  const counted = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;
  if (found.length === 0) {
    console.log(`${counted(pages ?? 0, "page")}, with nothing to fix.`);
    process.exit(0);
  }
  const total = `${counted(failures.length, "failure")} and ${counted(warnings.length, "warning")}`;
  console.error(
    `${found.join("\n")}${pages === undefined ? "" : `\n\n${counted(pages, "page")}: ${total}.`}`,
  );
  process.exit(1);
}
const { command, folder, port } = args;

const serve = port === undefined ? {} : { port, strictPort: true };
const config = {
  root: resolve(folder),
  configFile: false as const,
  plugins: [pagez()],
  server: serve,
  preview: serve,
};
try {
  if (command === "build") {
    await build(config);
  } else {
    const server = command === "dev" ? await createServer(config) : await preview(config);
    if ("listen" in server) await server.listen();
    server.printUrls();
  }
} catch (error) {
  // A build gathers each page's failure, so one that pages share prints once.
  const { errors } = error as { errors?: Error[] };
  const messages = errors?.length ? errors.map((each) => each.message) : [(error as Error).message];
  console.error([...new Set(messages)].join("\n\n"));
  process.exit(1);
}
