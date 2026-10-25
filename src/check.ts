/** @prose
 * # Checking a site
 *
 * `pagez check` compiles every page `build` would, without Vite's bundle or `dist/`, and lists
 * what to fix. Each page that fails prints its failure, one a line, with its id, and each warning
 * prints too. So one run lists every page's mistake, where a build stops at its first.
 *
 * A mistake in the site, or in what its pages share, is the one line, since every page would
 * fail with it.
 */
import { relative } from "node:path";
import { FileError, printedError, printedWarning } from "./elements/errors.ts";
import { checkShared, compile } from "./page.ts";
import { createLoader } from "./parts.ts";
import { readSite } from "./site.ts";

/** What a check found: each page's failure and each warning, a line each. */
export interface Checked {
  /** How many pages were checked, or none when the site itself fails. */
  pages?: number;
  failures: string[];
  warnings: string[];
}

/** @prose
 * The site at `root`, checked, with each file below `from` named from it, and any other by its
 * whole path. A mistake that isn't in a file, such as a crash, still throws.
 */
export async function check(root: string, from: string = process.cwd()): Promise<Checked> {
  const named = (file: string) => {
    const path = relative(from, file);
    return path && !path.startsWith("..") ? path : file;
  };
  const failures = new Set<string>();
  const warnings: string[] = [];
  let site;
  try {
    site = readSite(root);
    checkShared(site);
  } catch (error) {
    if (!(error instanceof FileError)) throw error;
    return { failures: [printedError(error, named(error.file))], warnings };
  }
  const pages = [...site.pages, ...(site.notFound ? [site.notFound] : [])];
  const loader = await createLoader(root);
  try {
    for (const { file } of pages) {
      try {
        const page = await compile(file, { site, loader });
        warnings.push(...page.warnings.map((warning) => printedWarning(warning, named(file))));
      } catch (error) {
        if (!(error instanceof FileError)) throw error;
        failures.add(printedError(error, named(error.file)));
      }
    }
  } finally {
    await loader.close();
  }
  return { pages: pages.length, failures: [...failures], warnings };
}
