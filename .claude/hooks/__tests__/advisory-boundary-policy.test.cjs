#!/usr/bin/env node
/**
 * Regression tests for advisory workflow autonomy boundaries.
 * Run: node --test claude/hooks/__tests__/advisory-boundary-policy.test.cjs
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const { getSessionTempPath, writeSessionState } = require("../lib/ck-config-utils.cjs");

const REPO_ROOT = path.join(__dirname, "..", "..", "..");
const COOK_AFTER_PLAN_HOOK = path.join(__dirname, "..", "cook-after-plan-reminder.cjs");
const PLAN_REFERENCES = [
  "claude/skills/ck-plan/SKILL.md",
  "claude/skills/ck-plan/references/workflow-modes.md",
  "claude/skills/ck-plan/references/validate-workflow.md",
  "claude/skills/ck-plan/references/red-team-workflow.md",
  "claude/skills/ck-plan/references/task-management.md",
  "claude/skills/ck-plan/references/verification-roles.md",
];

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("advisory boundary policy", () => {
  it("plan completion hook stops at user choice instead of mandatory cook automation", () => {
    const result = spawnSync(process.execPath, [COOK_AFTER_PLAN_HOOK], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      input: JSON.stringify({
        hook_event_name: "SubagentStop",
        matcher: "Plan",
        agent_type: "planner",
      }),
      env: {
        ...process.env,
        CLAUDE_ENV_FILE: "",
        CK_SESSION_ID: "",
      },
    });

    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Planning complete/i);
    assert.match(result.stdout, /implement/i);
    assert.match(result.stdout, /validate/i);
    assert.match(result.stdout, /red-team/i);
    assert.doesNotMatch(result.stdout, /MUST invoke/i);
    assert.doesNotMatch(result.stdout, /\/ck:cook\s+--auto/i);
  });

  it("plan completion hook includes absolute plan path without auto mode", () => {
    const sessionId = `advisory-boundary-${Date.now()}`;
    const planDir = path.join(REPO_ROOT, "plans", "260428-1614-hook-autonomy-boundaries");

    try {
      assert.strictEqual(writeSessionState(sessionId, { activePlan: planDir }), true);

      const result = spawnSync(process.execPath, [COOK_AFTER_PLAN_HOOK], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        input: JSON.stringify({
          hook_event_name: "SubagentStop",
          matcher: "Plan",
          agent_type: "planner",
        }),
        env: {
          ...process.env,
          CLAUDE_ENV_FILE: "",
          CK_SESSION_ID: sessionId,
        },
      });

      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, new RegExp(`${planDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/plan\\.md`));
      assert.doesNotMatch(result.stdout, /\/ck:cook\s+--auto/i);
    } finally {
      fs.rmSync(getSessionTempPath(sessionId), { force: true });
    }
  });

  it("ck-plan advisory references do not default to cook auto mode", () => {
    for (const relativePath of PLAN_REFERENCES) {
      const content = readRepoFile(relativePath);
      assert.doesNotMatch(content, /\/ck:cook\s+--auto/i, `${relativePath} must not recommend default /ck:cook --auto`);
      assert.doesNotMatch(
        content,
        /safe to skip review gates/i,
        `${relativePath} must not equate validation success with implementation approval`
      );
      assert.doesNotMatch(
        content,
        /Output Cook Command/i,
        `${relativePath} must not describe plan output as an implementation handoff`
      );
    }
  });

  it("bootstrap fast/default modes do not imply autonomous cook execution", () => {
    const bootstrapSkill = readRepoFile("claude/skills/bootstrap/SKILL.md");
    const fastWorkflow = readRepoFile("claude/skills/bootstrap/references/workflow-fast.md");
    const parallelWorkflow = readRepoFile("claude/skills/bootstrap/references/workflow-parallel.md");
    const sharedPhases = readRepoFile("claude/skills/bootstrap/references/shared-phases.md");

    assert.doesNotMatch(bootstrapSkill, /default\s+`--auto`/i);
    assert.doesNotMatch(bootstrapSkill, /\| `--fast`[^\n]*`--auto`/i);
    assert.match(bootstrapSkill, /default\s+`--full`/i);
    assert.match(bootstrapSkill, /explicit autonomous implementation/i);

    assert.doesNotMatch(fastWorkflow, /\/ck:cook\s+--auto/i);
    assert.doesNotMatch(fastWorkflow, /Fully autonomous from start to finish/i);
    assert.doesNotMatch(fastWorkflow, /Skips all review gates/i);
    assert.match(fastWorkflow, /keeps review gates/i);

    assert.doesNotMatch(parallelWorkflow, /No user gate\s+—\s+proceed to implementation/i);
    assert.match(parallelWorkflow, /Keep cook review gates/i);

    assert.doesNotMatch(sharedPhases, /auto-commit.*without asking/i);
    assert.match(sharedPhases, /speed mode does not imply git automation/i);
  });

  it("task management docs describe cook as user-approved continuation", () => {
    const taskManagement = readRepoFile("claude/skills/ck-plan/references/task-management.md");

    assert.doesNotMatch(taskManagement, /Cook Handoff Protocol/i);
    assert.doesNotMatch(taskManagement, /planning\s+→\s+cook immediately/i);
    assert.match(taskManagement, /User-Approved Cook Continuation/i);
    assert.match(taskManagement, /asks the user which next step/i);
  });

  it("validate and red-team workflows require a whole-plan consistency sweep before cook", () => {
    const planSkill = readRepoFile("claude/skills/ck-plan/SKILL.md");
    const validateWorkflow = readRepoFile("claude/skills/ck-plan/references/validate-workflow.md");
    const redTeamWorkflow = readRepoFile("claude/skills/ck-plan/references/red-team-workflow.md");
    const verificationRoles = readRepoFile("claude/skills/ck-plan/references/verification-roles.md");

    assert.match(planSkill, /Whole-Plan Consistency Gate/);
    assert.match(planSkill, /Load: `references\/verification-roles\.md`/);
    assert.match(planSkill, /re-read `plan\.md` and every `phase-\*\.md` file/i);
    assert.match(
      planSkill,
      /Do not recommend cook until the whole-plan consistency sweep reports zero unresolved contradictions/i
    );

    for (const [label, content] of [
      ["validate workflow", validateWorkflow],
      ["red-team workflow", redTeamWorkflow],
    ]) {
      assert.match(content, /Whole-Plan Consistency Sweep/, `${label} must run the final whole-plan consistency sweep`);
      assert.match(
        content,
        /re-read `plan\.md` and every `phase-\*\.md` file/i,
        `${label} must reread the full plan after edits`
      );
      assert.match(content, /unresolved contradictions/i, `${label} must block cook when contradictions remain`);
      assert.match(
        content,
        /Never recommend cooking until the whole-plan consistency sweep has no unresolved contradictions/i,
        `${label} must gate implementation on consistency`
      );
    }

    assert.match(verificationRoles, /Whole-Plan Consistency Sweep/);
    assert.match(verificationRoles, /Prevent iterative validate\/red-team edits/i);
    assert.match(verificationRoles, /Search all plan files for old terms/i);
    assert.match(verificationRoles, /Unresolved contradictions: N/);
  });

  it("ck-plan requires reading all generated plan stubs before writing replacements", () => {
    const planSkill = readRepoFile("claude/skills/ck-plan/SKILL.md");
    const planOrganization = readRepoFile("claude/skills/ck-plan/references/plan-organization.md");

    assert.match(planSkill, /Generated-file write guard/);
    assert.match(planSkill, /Read `plan\.md`/);
    assert.match(planSkill, /Read every generated `phase-\*\.md` stub/);
    assert.match(planSkill, /Do not draft or submit a full phase body/);
    assert.match(planSkill, /has not been read in the current session/);

    assert.match(planOrganization, /Read generated files before writing content/);
    assert.match(planOrganization, /find \{plan-dir\}/);
    assert.match(planOrganization, /read `plan\.md` and every listed `phase-\*\.md` stub/i);
    assert.match(planOrganization, /rejects Write calls to existing files that were not read first/i);
  });

  it("red-team workflows require descriptive report artifact names", () => {
    const redTeamWorkflow = readRepoFile("claude/skills/ck-plan/references/red-team-workflow.md");
    const redTeamPersonas = readRepoFile("claude/skills/ck-plan/references/red-team-personas.md");

    assert.match(redTeamWorkflow, /`reports\/` directory/i);
    assert.match(redTeamWorkflow, /from-code-reviewer-to-planner-red-team-security-adversary-plan-review-report\.md/);
    assert.match(redTeamWorkflow, /Never use generic names such as `red-team-review\.md`/);
    assert.match(redTeamWorkflow, /retry immediately with a descriptive filename/i);

    assert.match(redTeamPersonas, /provided reports path/i);
    assert.match(redTeamPersonas, /from-code-reviewer-to-planner-red-team-\{lens-name\}-plan-review-report\.md/);
    assert.match(redTeamPersonas, /Do not invent generic report filenames such as red-team-review\.md/);
  });

  it("advisory agent prompts do not tell reviewers to mutate plan files", () => {
    const codeReviewerPrompt = readRepoFile("claude/agents/code-reviewer.md");

    assert.doesNotMatch(codeReviewerPrompt, /update plan file/i);
    assert.doesNotMatch(codeReviewerPrompt, /Mark tasks complete/i);
    assert.match(codeReviewerPrompt, /report plan status recommendations/i);
    assert.match(codeReviewerPrompt, /Do not edit plan files/i);
  });

  it("global rule injection scopes failed skill script repair to authorized implementation", () => {
    const { buildRulesSection } = require("../lib/context-builder.cjs");
    const rules = buildRulesSection({}).join("\n");

    assert.doesNotMatch(rules, /always fix them and run again/i);
    assert.match(rules, /explicitly authorizes fixing/i);
    assert.match(rules, /report the failure/i);
  });

  it("global context keeps advisory subagents and report-only tasks bounded", () => {
    const { buildModularizationSection, buildSessionSection } = require("../lib/context-builder.cjs");
    const context = [...buildSessionSection({}), ...buildModularizationSection()].join("\n");

    assert.match(context, /delegate only when the current user request authorizes/i);
    assert.match(context, /Advisory subagents report findings/i);
    assert.match(context, /advisory\/report-only tasks should report/i);
  });
});
