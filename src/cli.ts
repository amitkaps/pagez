#!/usr/bin/env node
/** @prose
 * # The command
 *
 * `pagez build` builds the pages in a folder, each `.md` at its folder's path, to the folder's
 * `dist/`. `pagez dev` serves them while they're written, and `pagez preview` serves what was
 * built.
 *
 * Each takes the folder, or works in the current one. They're Vite's own commands with Pagez's
 * plugin, for a folder with no Vite config of its own. A mistake in a page prints its file and what
 * to change, and exits with 1.
 */
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { build, createServer, preview } from "vite-plus";
import pagez from "./vite.ts";

const USAGE = "Usage: pagez build|dev|preview [folder]";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { help: { type: "boolean", short: "h" } },
});
const [command, folder = "."] = positionals;

if (values.help || !["build", "dev", "preview"].includes(command ?? "") || positionals.length > 2) {
  console.log(USAGE);
  process.exit(values.help ? 0 : 1);
}

const config = { root: resolve(folder), configFile: false as const, plugins: [pagez()] };
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
