#!/usr/bin/env node
// pre-commit-env.js
// PreToolUse hook: blocks git add/commit if .env files are involved.

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

  const isGitAdd = /git\s+add\b/.test(command);
  const isGitCommit = /git\s+commit\b/.test(command);

  if (!isGitAdd && !isGitCommit) return;

  if (isGitAdd) {
    const envFilePattern = /(?:^|\s|\/)(\.env(?:\.\w+)?)\b(?!\.example\b)(?!\.template\b)(?!\.sample\b)/;
    if (envFilePattern.test(command)) {
      process.stdout.write(JSON.stringify({
        decision: "block",
        message: "⛔ .env 파일은 커밋할 수 없습니다. .gitignore에 추가하세요."
      }));
      return;
    }
  }

  if (isGitCommit && /\s-a\b/.test(command)) {
    process.stdout.write(JSON.stringify({
      decision: "block",
      message: "⛔ git commit -a는 .env 파일을 포함할 수 있습니다. git add로 파일을 개별 지정하세요."
    }));
  }
}

main();
