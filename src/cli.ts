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
 * of its own. A mistake in a page prints its file and what
 * to change, and exits with 1.
 */
import { resolve } from "node:path";
import { build, createServer, preview } from "vite-plus";
import { readArgs } from "./args.ts";
import pagez from "./vite.ts";

const args = readArgs(process.argv.slice(2));
if ("print" in args) {
  (args.code ? console.error : console.log)(args.print);
  process.exit(args.code);
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
