/** @prose
 * # Speed
 *
 * `pnpm speed` asks whether a change moved the build. It builds the large site (`site.ts`) with
 * this tree's Pagez and with `origin/main`'s, each in a fresh process, in turns, three times.
 *
 * The order swaps each round, since whichever runs second finds the disk warm. A change counts
 * only when all three rounds show it beyond 5% the same way, since the machine drifts between
 * runs by more than that. `--against <ref>` times against another commit.
 *
 * The ref's tree comes from `git archive`, with this tree's `node_modules` linked in, and is
 * built once per commit. A ref whose dependencies differ builds with this tree's, so a change of
 * dependency is timed by installing it on both.
 *
 * `pnpm hotspots` (`--profile`) builds the site once with this tree under `--cpu-prof`, and
 * prints the functions that held the most time, by their own time. The profile is left in
 * `node_modules/.cache/pagez/` for DevTools.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { writeSite } from "./site.ts";

const root = join(import.meta.dirname, "../..");
const work = join(tmpdir(), "pagez-speed");
const site = join(work, "site");
const ROUNDS = 3;
const FLOOR = 0.05;

const argv = process.argv.slice(2);
const option = (name: string) => {
  const at = argv.indexOf(name);
  return at === -1 ? undefined : argv[at + 1];
};

/** Runs `command` in `cwd`, and exits with its output when it fails. */
function run(command: string, args: string[], cwd: string): void {
  const done = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (done.status !== 0) {
    console.error(`${command} ${args.join(" ")} failed in ${cwd}\n${done.stdout}${done.stderr}`);
    process.exit(1);
  }
}

/** Builds the site with the command at `cli`, in a fresh process, in milliseconds. */
function build(cli: string, flags: string[] = []): number {
  rmSync(join(site, "dist"), { recursive: true, force: true });
  const started = performance.now();
  run(process.execPath, [...flags, cli, "build", site], root);
  return performance.now() - started;
}

/** The ref's tree, unpacked and built once per commit, as the path to its command. */
function refCli(ref: string): string {
  const sha = spawnSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
    cwd: root,
    encoding: "utf8",
  }).stdout.trim();
  if (!sha) {
    console.error(`no commit "${ref}"`);
    process.exit(1);
  }
  const dir = join(work, sha);
  const cli = join(dir, "dist/cli.js");
  if (!existsSync(cli)) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const tar = spawnSync("git", ["archive", "--format=tar", sha], {
      cwd: root,
      maxBuffer: 1 << 28,
    }).stdout;
    spawnSync("tar", ["-x", "-C", dir], { input: tar });
    symlinkSync(join(root, "node_modules"), join(dir, "node_modules"), "dir");
    run(join(root, "node_modules/.bin/vp"), ["pack"], dir);
  }
  return cli;
}

const percent = (change: number) => `${change > 0 ? "+" : ""}${(change * 100).toFixed(1)}%`;
const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
const median = (values: number[]) => values.toSorted((a, b) => a - b)[values.length >> 1]!;

mkdirSync(work, { recursive: true });
writeSite(site);
run(join(root, "node_modules/.bin/vp"), ["pack"], root);
const here = join(root, "dist/cli.js");

if (argv.includes("--profile")) {
  const dir = join(root, "node_modules/.cache/pagez");
  rmSync(dir, { recursive: true, force: true });
  const ms = build(here, ["--cpu-prof", `--cpu-prof-dir=${dir}`]);
  const file = join(
    dir,
    readdirSync(dir).find((name) => name.endsWith(".cpuprofile"))!,
  );
  console.log(`built the large site in ${seconds(ms)}, profiled\n`);
  console.log(summarize(file));
  console.log(`\n${relative(root, file)} opens in DevTools for the flame chart`);
} else {
  const ref = option("--against") ?? "origin/main";
  const there = refCli(ref);
  const rounds: { here: number; there: number }[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    // Whichever builds second finds the disk warm, so the order swaps each round.
    const [first, second] = i % 2 ? [there, here] : [here, there];
    const a = build(first);
    const b = build(second);
    rounds.push(i % 2 ? { here: b, there: a } : { here: a, there: b });
  }
  const changes = rounds.map((round) => round.here / round.there - 1);
  console.log(`the large site, this tree against ${ref}, ${ROUNDS} rounds\n`);
  for (const [i, round] of rounds.entries()) {
    console.log(
      `round ${i + 1}   this tree ${seconds(round.here)}   ${ref} ${seconds(round.there)}   ${percent(changes[i]!)}`,
    );
  }
  const change = median(changes);
  const shown =
    changes.every((each) => each > FLOOR) || changes.every((each) => each < -FLOOR)
      ? `${change < 0 ? "faster" : "slower"} by ${percent(Math.abs(change)).slice(1)}`
      : `no change beyond ${FLOOR * 100}% in every round`;
  console.log(
    `\nthis tree ${seconds(median(rounds.map((round) => round.here)))}, ${ref} ${seconds(median(rounds.map((round) => round.there)))}: ${shown}`,
  );
}

/** @prose
 * The functions that held the most time in a CPU profile, by their own time, each with its file
 * and line. Node's own time, such as the garbage collector and idle, is listed by its name.
 */
function summarize(file: string): string {
  const profile = JSON.parse(readFileSync(file, "utf8")) as {
    nodes: {
      id: number;
      hitCount?: number;
      callFrame: { functionName: string; url: string; lineNumber: number };
    }[];
    startTime: number;
    endTime: number;
  };
  const hits = profile.nodes.reduce((sum, node) => sum + (node.hitCount ?? 0), 0);
  const per = (profile.endTime - profile.startTime) / 1000 / hits;
  const by = new Map<string, number>();
  for (const { hitCount = 0, callFrame } of profile.nodes) {
    const name = callFrame.functionName || "(anonymous)";
    const at = callFrame.url
      ? ` ${callFrame.url.replace(/^file:\/\//, "").replace(`${root}/`, "")}:${callFrame.lineNumber + 1}`
      : "";
    by.set(`${name}${at}`, (by.get(`${name}${at}`) ?? 0) + hitCount);
  }
  return [...by]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([name, count]) => `${`${(count * per).toFixed(0)} ms`.padStart(8)}  ${name}`)
    .join("\n");
}
