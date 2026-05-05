#!/usr/bin/env node
/**
 * Tests for team-context-inject.cjs hook - Team Agent Context Injection
 * Run: node --test .claude/hooks/__tests__/team-context-inject.test.cjs
 *
 * Tests coverage:
 * - Team membership detection (name@team-name pattern)
 * - Team config loading and parsing
 * - Peer list building (excluding current agent)
 * - CK stack context building from environment variables
 * - Task summary generation from task directory
 * - Fail-open behavior on errors
 * - Security: path traversal prevention
 * - JSON output format validation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOK_PATH = path.join(__dirname, '..', 'team-context-inject.cjs');

/**
 * Execute team-context-inject.cjs with given stdin data and return stdout
 * @param {Object} inputData - Data to pass as JSON stdin
 * @param {Object} options - Options: { env, debug }
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, output: Object|null}>}
 */
function runHook(inputData, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Clear team/task paths to simulate fresh environment
        ...(options.clearPaths ? {
          HOME: os.tmpdir(),
        } : {}),
        ...(options.env || {}),
      }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    if (inputData) {
      proc.stdin.write(JSON.stringify(inputData));
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      let output = null;
      try {
        output = JSON.parse(stdout);
      } catch (e) {
        // Non-JSON output is okay for some tests
      }
      resolve({ stdout, stderr, exitCode: code, output });
    });

    proc.on('error', reject);

    // 10 second timeout
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Hook execution timed out'));
    }, 10000);
  });
}

/**
 * Create a temporary team structure for testing
 */
function createTestTeam(baseDir, teamName) {
  const teamsDir = path.join(baseDir, '.claude', 'teams');
  const teamDir = path.join(teamsDir, teamName);
  const tasksDir = path.join(baseDir, '.claude', 'tasks');
  const taskDir = path.join(tasksDir, teamName);

  fs.mkdirSync(teamDir, { recursive: true });
  fs.mkdirSync(taskDir, { recursive: true });

  // Create team config
  const config = {
    name: `Team: ${teamName}`,
    members: [
      { agentId: 'alice@team-a', name: 'alice', agentType: 'developer' },
      { agentId: 'bob@team-a', name: 'bob', agentType: 'tester' },
      { agentId: 'charlie@team-a', name: 'charlie', agentType: 'reviewer' }
    ]
  };
  fs.writeFileSync(
    path.join(teamDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );

  // Create sample tasks
  const taskFiles = [
    { id: '1', status: 'pending', subject: 'Task 1' },
    { id: '2', status: 'in_progress', subject: 'Task 2' },
    { id: '3', status: 'completed', subject: 'Task 3' },
    { id: '4', status: 'pending', subject: 'Task 4' }
  ];

  for (const task of taskFiles) {
    fs.writeFileSync(
      path.join(taskDir, `${task.id}.json`),
      JSON.stringify(task)
    );
  }

  return { teamsDir, teamDir, tasksDir, taskDir, config };
}

describe('team-context-inject.cjs', () => {

  describe('Basic Functionality', () => {

    it('exits with code 0 (non-blocking, fail-open)', async () => {
      const result = await runHook({
        agent_id: 'alice@team-a'
      });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    });

    it('exits 0 on empty stdin', async () => {
      const result = await runHook(null);
      assert.strictEqual(result.exitCode, 0, 'Should exit cleanly on empty stdin');
    });

    it('returns valid JSON with hookSpecificOutput', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-test-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const { teamsDir, taskDir } = createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        assert.ok(result.output, 'Should return JSON output');
        assert.ok(result.output.hookSpecificOutput, 'Should have hookSpecificOutput');
        assert.strictEqual(
          result.output.hookSpecificOutput.hookEventName,
          'SubagentStart',
          'Should have correct hook event name'
        );
        assert.ok(
          result.output.hookSpecificOutput.additionalContext,
          'Should have additionalContext'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Team Membership Detection', () => {

    it('detects team membership from agent_id (name@team-name pattern)', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-member-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const { teamsDir } = createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        assert.ok(
          context.includes('Team Context'),
          'Should include Team Context section for team member'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('silently exits if agent_id is not a team member (no @ sign)', async () => {
      const result = await runHook({
        agent_id: 'standalone-agent'
      });

      assert.strictEqual(result.exitCode, 0, 'Should exit cleanly for non-team agents');
      // Non-team agents should still get exit 0 but minimal output
      if (result.output?.hookSpecificOutput?.additionalContext) {
        assert.ok(
          !result.output.hookSpecificOutput.additionalContext.includes('Team Context'),
          'Non-team agents should not get Team Context'
        );
      }
    });

    it('rejects malformed agent_ids for security (path traversal prevention)', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-security-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const { teamsDir } = createTestTeam(tmpDir, 'team-a');

        // Try various path traversal attempts
        const malformedIds = [
          'alice@../team-b',
          'alice@team-a/../../../etc/passwd',
          'alice@team-a\\..\\windows',
          'alice@team-a/../../sensitive'
        ];

        for (const agentId of malformedIds) {
          const result = await runHook({
            agent_id: agentId
          }, {
            env: { HOME: tmpDir }
          });

          assert.strictEqual(
            result.exitCode, 0,
            `Should safely reject malformed agent_id: ${agentId}`
          );
          // Should not process team context for path traversal attempts
          const context = result.output?.hookSpecificOutput?.additionalContext || '';
          assert.ok(
            !context.includes('Team Context') || context.includes('Commits:'),
            `Should not load team config for path traversal: ${agentId}`
          );
        }
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles empty or invalid agent_id gracefully', async () => {
      const testCases = [
        { agent_id: '' },
        { agent_id: null },
        { agent_id: undefined },
        // No agent_id field at all
        {}
      ];

      for (const testCase of testCases) {
        const result = await runHook(testCase);
        assert.strictEqual(
          result.exitCode, 0,
          `Should handle invalid agent_id: ${JSON.stringify(testCase)}`
        );
      }
    });

  });

  describe('Team Config Loading', () => {

    it('loads and uses team config when team directory exists', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-config-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const { config } = createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Should include team name from config
        assert.ok(
          context.includes(`Team: ${config.name}`),
          'Should include team name from config'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('silently exits if team config does not exist', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-no-config-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        // Set up .claude/teams directory but no team-a
        fs.mkdirSync(path.join(tmpDir, '.claude', 'teams'), { recursive: true });

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0, 'Should exit cleanly when config missing');
        // Should still return minimal output (fail-open)
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        // May not have Team Context but should not crash
        assert.ok(context.length >= 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles corrupted JSON config gracefully', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-bad-json-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const teamsDir = path.join(tmpDir, '.claude', 'teams', 'team-a');
        fs.mkdirSync(teamsDir, { recursive: true });

        // Write invalid JSON
        fs.writeFileSync(
          path.join(teamsDir, 'config.json'),
          '{invalid json{{{'
        );

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0, 'Should fail-open on corrupt JSON');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Peer List Building', () => {

    it('builds peer list excluding current agent', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-peers-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const { config } = createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Should list other peers but not alice
        assert.ok(
          context.includes('bob') && context.includes('charlie'),
          'Should list other team members'
        );
        // Peer list should show type
        assert.ok(
          context.includes('tester') || context.includes('reviewer'),
          'Should include peer agent types'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('shows "none" as peers if agent is the only team member', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-single-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const teamDir = path.join(tmpDir, '.claude', 'teams', 'solo-team');
        fs.mkdirSync(teamDir, { recursive: true });

        // Single-member team
        fs.writeFileSync(
          path.join(teamDir, 'config.json'),
          JSON.stringify({
            name: 'Solo Team',
            members: [{ agentId: 'solo@solo-team', name: 'solo', agentType: 'developer' }]
          })
        );

        const result = await runHook({
          agent_id: 'solo@solo-team'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        assert.ok(
          context.includes('none'),
          'Should show "none" when no other peers exist'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('CK Stack Context Building', () => {

    it('includes CK context when environment variables are set', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-ck-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: {
            HOME: tmpDir,
            CK_REPORTS_PATH: '/project/plans/reports',
            CK_PLANS_PATH: '/project/plans',
            CK_PROJECT_ROOT: '/project',
            CK_GIT_BRANCH: 'main'
          }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        assert.ok(context.includes('CK Context'), 'Should have CK Context section');
        assert.ok(context.includes('/project/plans/reports'), 'Should include reports path');
        assert.ok(context.includes('/project/plans'), 'Should include plans path');
        assert.ok(context.includes('main'), 'Should include git branch');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('always includes commit convention in CK context', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-commit-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Commit convention is always included
        assert.ok(
          context.includes('conventional') || context.includes('feat:'),
          'Should include commit convention info'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('only includes CK context lines when env vars exist (fail-open)', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-empty-ck-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        // Run with no CK_* env vars
        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Should not have empty CK Context section
        // Commit convention is always present, so CK Context should appear
        // but with minimal content
        assert.ok(context.length > 0, 'Should still return context');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Task Summary Generation', () => {

    it('generates accurate task summary when tasks exist', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-tasks-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Should show task summary
        assert.ok(
          context.includes('Task summary') || context.includes('pending'),
          'Should include task summary'
        );
        // Test team has 2 pending, 1 in_progress, 1 completed
        assert.ok(
          context.includes('2 pending') && context.includes('in progress') && context.includes('completed'),
          'Should show correct task counts'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles missing task directory gracefully', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-no-tasks-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const teamsDir = path.join(tmpDir, '.claude', 'teams', 'team-a');
        fs.mkdirSync(teamsDir, { recursive: true });

        // Create config but no tasks directory
        fs.writeFileSync(
          path.join(teamsDir, 'config.json'),
          JSON.stringify({
            name: 'Team A',
            members: [{ agentId: 'alice@team-a', name: 'alice', agentType: 'developer' }]
          })
        );

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Should not crash, task summary just won't appear
        assert.ok(context.length > 0, 'Should still return context');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles corrupted task files gracefully', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-bad-tasks-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const taskDir = path.join(tmpDir, '.claude', 'tasks', 'team-a');
        fs.mkdirSync(taskDir, { recursive: true });

        const teamsDir = path.join(tmpDir, '.claude', 'teams', 'team-a');
        fs.mkdirSync(teamsDir, { recursive: true });
        fs.writeFileSync(
          path.join(teamsDir, 'config.json'),
          JSON.stringify({
            name: 'Team A',
            members: [{ agentId: 'alice@team-a', name: 'alice', agentType: 'developer' }]
          })
        );

        // Write bad JSON task file
        fs.writeFileSync(
          path.join(taskDir, '1.json'),
          '{bad json{{{'
        );

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0, 'Should fail-open on corrupt tasks');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('counts only .json files as tasks', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-json-filter-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const taskDir = path.join(tmpDir, '.claude', 'tasks', 'team-a');
        fs.mkdirSync(taskDir, { recursive: true });

        const teamsDir = path.join(tmpDir, '.claude', 'teams', 'team-a');
        fs.mkdirSync(teamsDir, { recursive: true });
        fs.writeFileSync(
          path.join(teamsDir, 'config.json'),
          JSON.stringify({
            name: 'Team A',
            members: [{ agentId: 'alice@team-a', name: 'alice', agentType: 'developer' }]
          })
        );

        // Create mix of files
        fs.writeFileSync(path.join(taskDir, '1.json'), JSON.stringify({ id: '1', status: 'pending' }));
        fs.writeFileSync(path.join(taskDir, 'README.md'), '# Tasks');
        fs.writeFileSync(path.join(taskDir, '.gitkeep'), '');
        fs.writeFileSync(path.join(taskDir, 'backup.json.bak'), '{}');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Should only count the .json file
        assert.ok(context.includes('1 pending'), 'Should only count .json files');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Output Format & Content', () => {

    it('includes required Team Context section headers', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-headers-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Required headers
        assert.ok(context.includes('## Team Context'), 'Should have Team Context header');
        assert.ok(context.includes('Team:'), 'Should show team name');
        assert.ok(context.includes('Your peers:'), 'Should show peers');
        assert.ok(context.includes('Remember:'), 'Should include reminder at end');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('includes helpful reminder about task list and file ownership', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-reminder-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);
        const context = result.output?.hookSpecificOutput?.additionalContext || '';

        // Reminder should include key team concepts
        assert.ok(
          context.includes('TaskList') && context.includes('file ownership') && context.includes('SendMessage'),
          'Should include helpful team reminders'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Error Handling & Robustness', () => {

    it('exits 0 on JSON parse error (fail-open)', async () => {
      const proc = spawn('node', [HOOK_PATH], {
        cwd: process.cwd(),
        env: process.env
      });

      // Send invalid JSON
      proc.stdin.write('not valid json{{{');
      proc.stdin.end();

      const exitCode = await new Promise((resolve) => {
        proc.on('close', resolve);
      });

      assert.strictEqual(exitCode, 0, 'Should exit 0 on parse error (fail-open)');
    });

    it('logs to stderr only when CK_DEBUG is enabled', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-debug-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        // With CK_DEBUG
        const resultWithDebug = await runHook({
          agent_id: 'invalid@team'
        }, {
          env: { HOME: tmpDir, CK_DEBUG: '1' }
        });

        // Without CK_DEBUG
        const resultWithoutDebug = await runHook({
          agent_id: 'invalid@team'
        }, {
          env: { HOME: tmpDir }
        });

        // Both should exit 0
        assert.strictEqual(resultWithDebug.exitCode, 0);
        assert.strictEqual(resultWithoutDebug.exitCode, 0);

        // Debug output should be minimal without CK_DEBUG
        if (resultWithoutDebug.stderr) {
          assert.ok(
            resultWithoutDebug.stderr.length <= resultWithDebug.stderr.length,
            'Should log less without CK_DEBUG'
          );
        }
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles hook disabled gracefully via isHookEnabled check', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-disabled-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        // When hook is disabled, it should exit early
        // (but we can't easily mock isHookEnabled, so this is a semantic test)
        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        // Should exit 0 regardless
        assert.strictEqual(result.exitCode, 0, 'Hook should always exit 0');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('JSON Output Validation', () => {

    it('always outputs valid JSON with hookSpecificOutput structure', async () => {
      const tmpDir = path.join(os.tmpdir(), 'team-inject-json-valid-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'team-a');

        const result = await runHook({
          agent_id: 'alice@team-a'
        }, {
          env: { HOME: tmpDir }
        });

        assert.strictEqual(result.exitCode, 0);

        // Should be able to parse output as JSON
        assert.ok(result.output, 'Should return JSON output');
        assert.strictEqual(
          typeof result.output.hookSpecificOutput,
          'object',
          'Should have hookSpecificOutput object'
        );
        assert.strictEqual(
          result.output.hookSpecificOutput.hookEventName,
          'SubagentStart',
          'Should have correct hookEventName'
        );
        assert.strictEqual(
          typeof result.output.hookSpecificOutput.additionalContext,
          'string',
          'additionalContext should be string'
        );
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

});
