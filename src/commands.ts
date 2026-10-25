/** @prose
 * # The commands, printed
 *
 * `pagez help` prints each command from the usage doc the package ships, where each is stated
 * once as an item with its id. `pagez help <command>` prints the section that states it, with its
 * links resolved against the site. Markz reads the items as it reads rules.
 */
import { readFileSync } from "node:fs";
import { readCommands } from "@amitkaps/markz/rules";

export const commands = readCommands(
  "pagez",
  readFileSync(new URL("../docs/usage.md", import.meta.url), "utf8"),
  "https://pagez.amitkaps.com/docs/usage.md",
);
