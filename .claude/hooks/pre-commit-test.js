#!/usr/bin/env node
// pre-commit-test.js
// PreToolUse hook: blocks commit if tests haven't been verified.
// Checks for .harness-test-passed marker file (created by dcl-qa after tests pass).

const fs = require("fs");
const path = require("path");

async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let command = "";
  try {
    const parsed = JSON.parse(input);
    command = parsed.command || "";
  } catch {
    return;
  }

  if (!command) return;

  const isGitCommit = /git\s+commit\b/.test(command);
  if (!isGitCommit) return;

  if (/--allow-empty\b/.test(command)) return;
  if (/-m\s+["']?[Mm]erge\b/.test(command)) return;

  const coverageMin = parseInt(process.env.HARNESS_TEST_COVERAGE_MIN || "0", 10);
  if (coverageMin === 0) return;

  const markerPath = path.join(process.cwd(), ".harness-test-passed");

  if (!fs.existsSync(markerPath)) {
    process.stdout.write(JSON.stringify({
      decision: "block",
      message: `⛔ 커밋 전 테스트를 실행하세요 (커버리지 기준: ${coverageMin}%). /dcl-qa 또는 프로젝트 테스트 명령어를 실행하면 마커가 생성됩니다.`
    }));
    return;
  }

  try {
    const markerStat = fs.statSync(markerPath);
    const markerAge = Date.now() - markerStat.mtimeMs;
    if (markerAge > 3600000) {
      process.stdout.write(JSON.stringify({
        decision: "block",
        message: `⛔ 테스트 마커가 1시간 이상 경과했습니다. 테스트를 다시 실행하세요.`
      }));
    }
  } catch {
    // fail-open for edge cases
  }
}

main();
