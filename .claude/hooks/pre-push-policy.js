#!/usr/bin/env node
// pre-push-policy.js
// PreToolUse hook: enforces push policies.
// - Blocks force push
// - Blocks direct push to main/develop

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

  const isGitPush = /git\s+push\b/.test(command);
  if (!isGitPush) return;

  if (/\s--force\b|\s-f\s|\s-f$|\+\w/.test(command)) {
    process.stdout.write(JSON.stringify({
      decision: "block",
      message: "⛔ Force push는 금지입니다."
    }));
    return;
  }

  if (/git\s+push\s+\S+\s+(main|master|develop)\b/.test(command)) {
    process.stdout.write(JSON.stringify({
      decision: "block",
      message: "⛔ main/develop 브랜치에 직접 push할 수 없습니다. feature 브랜치에서 PR을 생성하세요."
    }));
  }
}

main();
