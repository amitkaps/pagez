/** @prose
 * # `${…}` in prose
 *
 * Prose refers to values, and elements compute ([design.md](../docs/design.md#expressions)). So a
 * `${…}` in a page is a path into `page`, the page's metadata, such as `${page.title}`, and nothing
 * else: no call, no operator and no other name. Anything more fails, at the expression.
 *
 * - **A missing value fails,** since a page that prints nothing where it meant a subtitle is a typo
 *   no one sees.
 * - **A dotted key is reached.** Metadata keys are flat, so `author.name: Ada` is one key, as in
 *   YAML, and `${page.author.name}` reads it. At each step the longest key that matches wins.
 * - **Prose prints a string or a number.** A list, a boolean and an empty value have no one way
 *   to read as text, so each fails, and an element writes it. An attribute takes any value, since
 *   it goes to a template.
 */
import type { Metadata } from "./head.ts";

/** What a path names in `page`, or what's wrong with it. */
export type Found = { value: unknown } | { problem: string };

const PATH = /^[A-Za-z_$][\w$]*(?:\.[\w$]+)*$/;

/** The value `code`, what a `${…}` holds, names in `page`. */
export function evaluate(code: string, page: Metadata): Found {
  const path = code.trim();
  const written = `\${${path}}`;
  if (!PATH.test(path)) {
    return {
      problem: `${written} isn't a path into page. Prose reads a value, such as \${page.title}, and an element computes one.`,
    };
  }
  const [first, ...keys] = path.split(".");
  if (first !== "page") {
    return {
      problem: `${written} reads ${first}, and prose sees only page, as in \${page.title}.`,
    };
  }
  let value: unknown = page;
  for (let at = 0; at < keys.length;) {
    const object = value;
    const has = (n: number) =>
      typeof object === "object" &&
      object !== null &&
      Object.hasOwn(object, keys.slice(at, at + n).join("."));
    let n = keys.length - at;
    while (n > 0 && !has(n)) n--;
    if (n === 0) {
      const name = keys.slice(0, at + 1).join(".");
      return {
        problem: `${written}: page has no ${name}. Add it to the metadata, or fix the name.`,
      };
    }
    value = (object as Record<string, unknown>)[keys.slice(at, at + n).join(".")];
    at += n;
  }
  return { value };
}

/** The value as prose prints it, or why it can't. */
export function printed(code: string, page: Metadata): { text: string } | { problem: string } {
  const found = evaluate(code, page);
  if ("problem" in found) return found;
  const { value } = found;
  if (typeof value === "string") return { text: value };
  if (typeof value === "number") return { text: String(value) };
  const what = Array.isArray(value)
    ? "a list"
    : value === null
      ? "empty"
      : typeof value === "boolean"
        ? String(value)
        : "not text";
  return {
    problem: `\${${code.trim()}} is ${what}, which prose doesn't print. An element writes it, given the value as an attribute.`,
  };
}

/** @prose
 * An attribute's value. One that is a `${…}` and nothing else is that value, whatever it is, so a
 * list reaches the template as a list. One with `${…}` among other text is text, and each prints
 * as it would in prose.
 */
export function attributeValue(written: string, page: Metadata): Found {
  const whole = /^\$\{([^}]*)\}$/.exec(written);
  if (whole) return evaluate(whole[1]!, page);
  const found = interpolated(written, page);
  return "problem" in found ? found : { value: found.text };
}

/** Text with each `${…}` in it printed, as in a link's destination. */
export function interpolated(
  written: string,
  page: Metadata,
): { text: string } | { problem: string } {
  let problem: string | undefined;
  const text = written.replace(/\$\{([^}]*)\}/g, (match, code: string) => {
    const result = printed(code, page);
    if ("problem" in result) problem ??= result.problem;
    return "text" in result ? result.text : match;
  });
  return problem ? { problem } : { text };
}
