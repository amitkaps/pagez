/** @prose
 * # The build report
 *
 * What `build` prints when it's done: each page's HTML, gzipped, as it's sent, and the time it took
 * to compile, so a page that grows heavy or slow shows where the cost is, with the elements that
 * give it behavior. What pages share is one `common` row, since the browser downloads it once: the
 * CSS and JavaScript Vite bundled. The last line is the whole build and the version of Pagez that
 * ran. It came from Sitez.
 *
 * ```text
 * page           html   time
 * /            1.2 KB  12 ms
 * /essays/     1.4 KB   9 ms  fold-out
 * common       0.8 KB css, 1.1 KB js
 * 2 pages and 1 redirect in 240 ms → dist · pagez 0.1.0
 * ```
 */

/** A page as the report shows it. */
export interface Reported {
  /** Its path from the root, `/about/`, or `/404.html`. */
  path: string;
  /** Its HTML's size, gzipped, in bytes. */
  html: number;
  /** How long it took to compile, in milliseconds. */
  ms: number;
  behavior: string[];
}

export interface Report {
  pages: Reported[];
  /** The bundled CSS and JavaScript, gzipped, in bytes. */
  css: number;
  js: number;
  redirects: number;
  ms: number;
  out: string;
  version: string;
}

export function report({ pages, css, js, redirects, ms, out, version }: Report): string {
  const rows = [
    ["page", "html", "time", ""],
    ...pages.map((page) => [page.path, size(page.html), time(page.ms), page.behavior.join(", ")]),
  ];
  const widths = [0, 1, 2].map((i) => Math.max(...rows.map((row) => row[i]!.length)));
  const lines = rows.map((row) =>
    [row[0]!.padEnd(widths[0]!), row[1]!.padStart(widths[1]!), row[2]!.padStart(widths[2]!), row[3]]
      .join("  ")
      .trimEnd(),
  );
  const common = [...(css > 0 ? [`${size(css)} css`] : []), ...(js > 0 ? [`${size(js)} js`] : [])];
  if (common.length > 0) lines.push(`${"common".padEnd(widths[0]!)}  ${common.join(", ")}`);
  const counted = [
    plural(pages.length, "page"),
    ...(redirects > 0 ? [plural(redirects, "redirect")] : []),
  ];
  lines.push(`${counted.join(" and ")} in ${time(ms)} → ${out} · pagez ${version}`);
  return lines.join("\n");
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Kilobytes, to one decimal below 10 KB, where a tenth still means something. */
export function size(bytes: number): string {
  const kb = bytes / 1024;
  return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
}

export function time(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}
