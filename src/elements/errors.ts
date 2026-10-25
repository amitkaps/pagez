/** @prose
 * # A mistake in a file
 *
 * A mistake in a page, a frame or an element file, as opposed to a bug in Pagez. Every failure a
 * user can cause is one of these, and it names the file and says what to change.
 *
 * Each has an id, its row in [the Errors table](../../docs/pages.md#errors), such as
 * `error-link-draft`, which says when it fails and the rule it breaks. A test holds the ids here
 * and the table's rows to each other, so a mistake can't ship without its row.
 *
 * A message that opens with where it is, `line 7: …` or `line 7, column 13: …`, gives the error
 * its line and column. It prints in Markz's one line, as every tool built on Markz prints what it
 * finds: `pagez: error: index.md:7:13: error-expression-call: …`.
 */
import { finding } from "@amitkaps/markz/rules";

/** A mistake's id, its row in the Errors table. */
export type ErrorId = `error-${string}`;

/** A warning's id, its row in the Warnings table. A build prints it and passes. */
export type WarningId = "undefined-tag";

/** What's wrong, with its id, for a check that returns it rather than throwing. */
export interface Problem {
  problem: string;
  id: ErrorId;
}

/** A mistake in a file, with its id, and its line and column when its message opens with them. */
export class FileError extends Error {
  /** The file or folder at fault, as an absolute path. */
  declare readonly file: string;
  declare readonly id: ErrorId;
  declare readonly line?: number;
  declare readonly column?: number;

  constructor(id: ErrorId, file: string, message: string, options?: ErrorOptions) {
    const [at, line, column] = /^line (\d+)(?:, column (\d+))?: /.exec(message) ?? [];
    super(message.slice(at?.length ?? 0), options);
    // Not enumerable, so Vite's report of an error shows `file: message` and nothing beside it.
    Object.defineProperty(this, "name", { value: "PagezError" });
    Object.defineProperty(this, "file", { value: file });
    Object.defineProperty(this, "id", { value: id });
    if (line) Object.defineProperty(this, "line", { value: Number(line) });
    if (column) Object.defineProperty(this, "column", { value: Number(column) });
  }
}

/** A mistake as it's printed, `pagez: error: file:line:column: id: message`, with `file` written
 *  as the caller names it. */
export function printedError(error: FileError, file: string = error.file): string {
  const { id: code, line, column, message } = error;
  return finding({ tool: "pagez", level: "error", file, line, column, code, message });
}

/** What's worth fixing in a page that doesn't stop the build, at its line, with its id. */
export interface Warning {
  line: number;
  code: string;
  message: string;
  instead: string;
}

/** A warning as it's printed, `pagez: warning: file:line: id: message; write instead`. */
export const printedWarning = (warning: Warning, file: string): string =>
  finding({ tool: "pagez", level: "warning", file, ...warning });
