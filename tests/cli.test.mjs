import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("CLI run dry-run prints a planned command", async () => {
  const { stdout } = await execFileAsync("node", [
    "scripts/pwb.mjs",
    "run",
    "--runner",
    "custom-command",
    "--dry-run",
    "--limit",
    "1",
  ]);

  assert.match(stdout, /\[custom-command\] Demo Strong r1:/);
});
