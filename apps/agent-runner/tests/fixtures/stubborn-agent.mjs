// Test fixture: an "agent" that ignores SIGTERM and leaves a grandchild in its process group, to
// prove the runner's cleanup reaches both. Writes `<pid> <grandchild pid>` to $FIXTURE_PIDS.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

process.on("SIGTERM", () => {});
const grandchild = spawn("sleep", ["600"], { stdio: "ignore" });
writeFileSync(process.env.FIXTURE_PIDS, `${process.pid} ${grandchild.pid}`);
process.stdin.resume();
setInterval(() => {}, 1_000);
