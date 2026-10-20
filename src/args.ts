/** @prose
 * # The command's arguments
 *
 * `pagez build|dev|preview [folder] [--port <n>]`, read into what to run, or into what to print
 * and the code to exit with. A mistake is one line and the usage, never a stack. `--port` is for
 * `dev` and `preview`, and serves on that port or fails, so a script gets the port it asked for.
 */
import { parseArgs } from "node:util";

export const USAGE = "Usage: pagez build|dev|preview [folder] [--port <n>]";

/** What to run, or what to print and exit with. */
export type Args =
  | { command: "build" | "dev" | "preview"; folder: string; port?: number }
  | { print: string; code: 0 | 1 };

export function readArgs(args: string[]): Args {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: { help: { type: "boolean", short: "h" }, port: { type: "string" } },
    });
  } catch (error) {
    return { print: `${(error as Error).message}\n${USAGE}`, code: 1 };
  }
  const { positionals, values } = parsed;
  if (values.help) return { print: USAGE, code: 0 };
  const [command, folder = "."] = positionals;
  if (command !== "build" && command !== "dev" && command !== "preview") {
    const said = command === undefined ? "Give a command." : `${command} isn't a command.`;
    return { print: `${said}\n${USAGE}`, code: 1 };
  }
  if (positionals.length > 2) return { print: `Give one folder.\n${USAGE}`, code: 1 };
  if (values.port === undefined) return { command, folder };
  const port = Number(values.port);
  if (command === "build")
    return { print: `build serves nothing, so it takes no --port.\n${USAGE}`, code: 1 };
  if (!/^\d+$/.test(values.port) || port < 1 || port > 65535) {
    return {
      print: `--port is ${values.port}, and a port is a whole number from 1 to 65535.`,
      code: 1,
    };
  }
  return { command, folder, port };
}
