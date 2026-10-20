/** @prose
 * # The command's arguments
 *
 * What `pagez` makes of what it's given: a command, a folder and a port, or one line saying what's
 * wrong, with the usage.
 */
import { describe, expect, test } from "vite-plus/test";
import { readArgs, USAGE } from "../src/args.ts";

describe("readArgs", () => {
  test("reads a command, its folder, and the current one when there's none", () => {
    expect(readArgs(["build", "site"])).toEqual({ command: "build", folder: "site" });
    expect(readArgs(["dev"])).toEqual({ command: "dev", folder: "." });
    expect(readArgs(["check", "site"])).toEqual({ command: "check", folder: "site" });
  });

  test("reads rules and the id it prints, or none for every rule", () => {
    expect(readArgs(["rules", "folder-page"])).toEqual({ command: "rules", id: "folder-page" });
    expect(readArgs(["rules"])).toEqual({ command: "rules" });
  });

  test("gives dev and preview a port", () => {
    expect(readArgs(["preview", "site", "--port", "4173"])).toEqual({
      command: "preview",
      folder: "site",
      port: 4173,
    });
    expect(readArgs(["dev", "--port=3000"])).toEqual({ command: "dev", folder: ".", port: 3000 });
  });

  test("prints the usage for --help, and exits with 0", () => {
    expect(readArgs(["--help"])).toEqual({ print: USAGE, code: 0 });
  });

  test("prints one line and the usage for a mistake, and exits with 1", () => {
    for (const [args, line] of [
      [["preview", "--prot", "4173"], "Unknown option '--prot'"],
      [["serve"], "serve isn't a command."],
      [[], "Give a command."],
      [["build", "a", "b"], "Give one folder."],
      [["build", "--port", "4173"], "build serves nothing, so it takes no --port."],
      [["check", "--port", "4173"], "check serves nothing, so it takes no --port."],
      [["rules", "a", "b"], "Give one id."],
      [["dev", "--port", "http"], "--port is http, and a port is a whole number from 1 to 65535."],
    ] as const) {
      const read = readArgs([...args]);
      expect(read).toMatchObject({ code: 1 });
      const print = (read as { print: string }).print;
      expect(print.split("\n")[0]).toContain(line);
      expect(print.split("\n").length).toBeLessThanOrEqual(2);
    }
  });
});
