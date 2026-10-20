/** @prose
 * # A mistake in a file
 *
 * A mistake in a page, a frame or an element file, as opposed to a bug in Pagez. Every failure a
 * user can cause is one of these, and it names the file and says what to change.
 *
 * Each has an id, its row in [the Errors table](../../docs/pages.md#errors), such as
 * `error-link-draft`, which says when it fails and the rule it breaks. A test holds the ids here
 * and the table's rows to each other, so a mistake can't ship without its row.
 */

/** A mistake's id, its row in the Errors table. */
export type ErrorId = `error-${string}`;

/** A warning's id, its row in the Warnings table. A build prints it and passes. */
export type WarningId = "undefined-tag";

/** What's wrong, with its id, for a check that returns it rather than throwing. */
export interface Problem {
  problem: string;
  id: ErrorId;
}

/** A mistake in a file, with its id. */
export class FileError extends Error {
  /** The file or folder at fault, as an absolute path. */
  declare readonly file: string;
  declare readonly id: ErrorId;

  constructor(id: ErrorId, file: string, message: string, options?: ErrorOptions) {
    super(message, options);
    // Not enumerable, so Vite's report of an error shows `file: message` and nothing beside it.
    Object.defineProperty(this, "name", { value: "PagezError" });
    Object.defineProperty(this, "file", { value: file });
    Object.defineProperty(this, "id", { value: id });
  }
}

/** A mistake as it's printed, `file: message [id]`, with `file` written as the caller names it. */
export function printedError(error: FileError, file: string = error.file): string {
  return `${file}: ${error.message} [${error.id}]`;
}
