/** @prose
 * # A mistake in a file
 *
 * A mistake in a page, a frame or an element file, as opposed to a bug in Pagez. Every failure a
 * user can cause is one of these, and it names the file and says what to change.
 */
export class FileError extends Error {
  /** The file or folder at fault, as an absolute path. */
  declare readonly file: string;

  constructor(file: string, message: string, options?: ErrorOptions) {
    super(message, options);
    // Not enumerable, so Vite's report of an error shows `file: message` and nothing beside it.
    Object.defineProperty(this, "name", { value: "PagezError" });
    Object.defineProperty(this, "file", { value: file });
  }
}
