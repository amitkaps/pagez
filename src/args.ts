/** @prose
 * # The command's arguments
 *
 * `pagez build|check|dev|preview [folder] [--port <n>]`, `pagez rules [id]` or `pagez help
 * [command]`, read into what to
 * run, or into what to print and the code to exit with. A mistake is one line and the usage, never
 * a stack. `--port` is for `dev` and `preview`, and serves on that port or fails, so a script gets
 * the port it asked for.
 */
import { parseArgs } from "node:util";

export const USAGE =
  "Usage: pagez build|check|dev|preview [folder] [--port <n>], pagez rules [id], or pagez help [command]";

/** The commands `pagez` runs, each stated once in the usage doc. */
export const COMMANDS = ["build", "check", "dev", "preview", "rules", "help"] as const;

/** What to run, or what to print and exit with. */
export type Args =
  | { command: "build" | "check" | "dev" | "preview"; folder: string; port?: number }
  | { command: "rules"; id?: string }
  | { command: "help"; name?: string }
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
  if (values.help) return { command: "help" };
  const [command, folder = "."] = positionals;
  if (!COMMANDS.includes(command as (typeof COMMANDS)[number])) {
    const said = command === undefined ? "Give a command." : `${command} isn't a command.`;
    return { print: `${said}\n${USAGE}`, code: 1 };
  }
  const given = command as (typeof COMMANDS)[number];
  if (positionals.length > 2) {
    const one =
      given === "rules"
        ? "Give one id."
        : given === "help"
          ? "Give one command."
          : "Give one folder.";
    return { print: `${one}\n${USAGE}`, code: 1 };
  }
  if (values.port !== undefined && given !== "dev" && given !== "preview")
    return { print: `${given} serves nothing, so it takes no --port.\n${USAGE}`, code: 1 };
  if (given === "rules")
    return positionals[1] === undefined
      ? { command: given }
      : { command: given, id: positionals[1] };
  if (given === "help")
    return positionals[1] === undefined
      ? { command: given }
      : { command: given, name: positionals[1] };
  if (values.port === undefined) return { command: given, folder };
  const port = Number(values.port);
  if (!/^\d+$/.test(values.port) || port < 1 || port > 65535) {
    return {
      print: `--port is ${values.port}, and a port is a whole number from 1 to 65535.`,
      code: 1,
    };
  }
  return { command: given, folder, port };
}
