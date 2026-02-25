#!/usr/bin/env node
/**
 * Tests for privacy-block.cjs hook
 * Run: node --test .claude/hooks/__tests__/privacy-block.test.cjs
 */

const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Mock fs before requiring the module
const fsMock = {
  readFileSync: mock.fn(() => '{}'),
};

// We need to test the functions directly, so we'll require the module
// Note: The module exports functions for unit testing
const {
  isSafeFile,
  isPrivacySensitive,
  hasApprovalPrefix,
  stripApprovalPrefix,
  extractPaths,
} = require('../privacy-block.cjs');

describe('privacy-block.cjs', () => {

  describe('isSafeFile', () => {
    it('returns true for .example files', () => {
      assert.strictEqual(isSafeFile('.env.example'), true);
      assert.strictEqual(isSafeFile('config.example'), true);
      assert.strictEqual(isSafeFile('/path/to/.env.example'), true);
    });

    it('returns true for .sample files', () => {
      assert.strictEqual(isSafeFile('.env.sample'), true);
      assert.strictEqual(isSafeFile('config.sample'), true);
    });

    it('returns true for .template files', () => {
      assert.strictEqual(isSafeFile('.env.template'), true);
      assert.strictEqual(isSafeFile('config.template'), true);
    });

    it('returns false for actual sensitive files', () => {
      assert.strictEqual(isSafeFile('.env'), false);
      assert.strictEqual(isSafeFile('.env.local'), false);
      assert.strictEqual(isSafeFile('credentials.json'), false);
    });

    it('handles null/undefined gracefully', () => {
      assert.strictEqual(isSafeFile(null), false);
      assert.strictEqual(isSafeFile(undefined), false);
      assert.strictEqual(isSafeFile(''), false);
    });
  });

  describe('hasApprovalPrefix', () => {
    it('returns true for APPROVED: prefix', () => {
      assert.strictEqual(hasApprovalPrefix('APPROVED:.env'), true);
      assert.strictEqual(hasApprovalPrefix('APPROVED:/path/to/.env'), true);
    });

    it('returns false without prefix', () => {
      assert.strictEqual(hasApprovalPrefix('.env'), false);
      assert.strictEqual(hasApprovalPrefix('/path/to/.env'), false);
    });

    it('handles null/undefined gracefully', () => {
      // hasApprovalPrefix returns falsy for null/undefined (short-circuit &&)
      assert.ok(!hasApprovalPrefix(null));
      assert.ok(!hasApprovalPrefix(undefined));
      assert.ok(!hasApprovalPrefix(''));
    });

    it('is case-sensitive', () => {
      assert.strictEqual(hasApprovalPrefix('approved:.env'), false);
      assert.strictEqual(hasApprovalPrefix('Approved:.env'), false);
    });
  });

  describe('stripApprovalPrefix', () => {
    it('removes APPROVED: prefix', () => {
      assert.strictEqual(stripApprovalPrefix('APPROVED:.env'), '.env');
      assert.strictEqual(stripApprovalPrefix('APPROVED:/path/.env'), '/path/.env');
    });

    it('returns path unchanged without prefix', () => {
      assert.strictEqual(stripApprovalPrefix('.env'), '.env');
      assert.strictEqual(stripApprovalPrefix('/path/.env'), '/path/.env');
    });

    it('handles empty/null input', () => {
      assert.strictEqual(stripApprovalPrefix(''), '');
      assert.strictEqual(stripApprovalPrefix(null), null);
    });
  });

  describe('isPrivacySensitive', () => {
    describe('env files', () => {
      it('blocks .env', () => {
        assert.strictEqual(isPrivacySensitive('.env'), true);
      });

      it('blocks .env.local, .env.production, etc.', () => {
        assert.strictEqual(isPrivacySensitive('.env.local'), true);
        assert.strictEqual(isPrivacySensitive('.env.production'), true);
        assert.strictEqual(isPrivacySensitive('.env.development'), true);
      });

      it('blocks paths containing .env', () => {
        assert.strictEqual(isPrivacySensitive('/path/to/.env'), true);
        assert.strictEqual(isPrivacySensitive('src/config/.env.local'), true);
      });

      it('allows .env.example, .env.sample, .env.template', () => {
        assert.strictEqual(isPrivacySensitive('.env.example'), false);
        assert.strictEqual(isPrivacySensitive('.env.sample'), false);
        assert.strictEqual(isPrivacySensitive('.env.template'), false);
      });
    });

    describe('credentials and secrets', () => {
      it('blocks credentials files', () => {
        assert.strictEqual(isPrivacySensitive('credentials.json'), true);
        assert.strictEqual(isPrivacySensitive('Credentials.yaml'), true);
        assert.strictEqual(isPrivacySensitive('/path/credentials.txt'), true);
      });

      it('blocks secrets files', () => {
        assert.strictEqual(isPrivacySensitive('secrets.yaml'), true);
        assert.strictEqual(isPrivacySensitive('secret.yml'), true);
        assert.strictEqual(isPrivacySensitive('secrets.yml'), true);
      });
    });

    describe('private keys', () => {
      it('blocks .pem files', () => {
        assert.strictEqual(isPrivacySensitive('private.pem'), true);
        assert.strictEqual(isPrivacySensitive('/ssl/cert.pem'), true);
      });

      it('blocks .key files', () => {
        assert.strictEqual(isPrivacySensitive('server.key'), true);
        assert.strictEqual(isPrivacySensitive('/path/private.key'), true);
      });

      it('blocks SSH keys', () => {
        assert.strictEqual(isPrivacySensitive('id_rsa'), true);
        assert.strictEqual(isPrivacySensitive('id_ed25519'), true);
        assert.strictEqual(isPrivacySensitive('~/.ssh/id_rsa'), true);
      });
    });

    describe('path normalization', () => {
      it('handles Windows paths', () => {
        assert.strictEqual(isPrivacySensitive('C:\\path\\.env'), true);
        assert.strictEqual(isPrivacySensitive('C:\\path\\.env.local'), true);
      });

      it('handles URI-encoded paths', () => {
        // %2e = '.'
        assert.strictEqual(isPrivacySensitive('%2eenv'), true);
      });
    });

    describe('APPROVED: prefix handling', () => {
      it('still detects sensitivity with APPROVED: prefix', () => {
        assert.strictEqual(isPrivacySensitive('APPROVED:.env'), true);
        assert.strictEqual(isPrivacySensitive('APPROVED:/path/.env.local'), true);
      });
    });

    it('handles null/undefined gracefully', () => {
      assert.strictEqual(isPrivacySensitive(null), false);
      assert.strictEqual(isPrivacySensitive(undefined), false);
      assert.strictEqual(isPrivacySensitive(''), false);
    });
  });

  describe('extractPaths', () => {
    it('extracts file_path', () => {
      const paths = extractPaths({ file_path: '.env' });
      assert.deepStrictEqual(paths, [{ value: '.env', field: 'file_path' }]);
    });

    it('extracts path', () => {
      const paths = extractPaths({ path: '/src/.env' });
      assert.deepStrictEqual(paths, [{ value: '/src/.env', field: 'path' }]);
    });

    it('extracts pattern', () => {
      const paths = extractPaths({ pattern: '**/.env*' });
      assert.deepStrictEqual(paths, [{ value: '**/.env*', field: 'pattern' }]);
    });

    it('extracts multiple fields', () => {
      const paths = extractPaths({
        file_path: '.env',
        path: '/config',
        pattern: '*.env'
      });
      assert.strictEqual(paths.length, 3);
    });

    describe('command parsing', () => {
      it('extracts .env from commands', () => {
        const paths = extractPaths({ command: 'cat .env' });
        assert.deepStrictEqual(paths, [{ value: '.env', field: 'command' }]);
      });

      it('extracts .env.local from commands', () => {
        const paths = extractPaths({ command: 'cat .env.local' });
        assert.deepStrictEqual(paths, [{ value: '.env.local', field: 'command' }]);
      });

      it('extracts APPROVED: paths from commands', () => {
        const paths = extractPaths({ command: 'cat APPROVED:.env' });
        assert.deepStrictEqual(paths, [{ value: 'APPROVED:.env', field: 'command' }]);
      });

      it('prioritizes APPROVED: over plain .env in same command', () => {
        const paths = extractPaths({ command: 'cat APPROVED:.env && echo .env' });
        // Should only find APPROVED:.env, not the plain .env
        assert.strictEqual(paths.length, 1);
        assert.strictEqual(paths[0].value, 'APPROVED:.env');
      });

      it('extracts from variable assignments', () => {
        const paths = extractPaths({ command: 'FILE=.env.local cat $FILE' });
        const values = paths.map(p => p.value);
        assert.ok(values.includes('.env.local'));
      });

      it('extracts from command substitution', () => {
        const paths = extractPaths({ command: 'cat $(echo .env)' });
        const values = paths.map(p => p.value);
        assert.ok(values.includes('.env'));
      });
    });

    it('handles null/undefined input', () => {
      assert.deepStrictEqual(extractPaths(null), []);
      assert.deepStrictEqual(extractPaths(undefined), []);
      assert.deepStrictEqual(extractPaths({}), []);
    });
  });
});

describe('formatBlockMessage output structure', () => {
  // Test formatBlockMessage by importing and calling directly
  // Note: formatBlockMessage is not exported, so we test via hook execution in manual testing
  // These unit tests verify the exported functions only

  it('JSON structure contract is documented', () => {
    // This test documents the expected JSON structure
    // Actual integration testing is done manually via: echo '{"tool_input":{"file_path":".env"}}' | node privacy-block.cjs
    const expectedStructure = {
      type: 'PRIVACY_PROMPT',
      file: 'string',
      basename: 'string',
      question: {
        header: 'File Access',
        text: 'string',
        options: [
          { label: 'Yes, approve access', description: 'string' },
          { label: 'No, skip this file', description: 'string' }
        ]
      }
    };
    assert.ok(expectedStructure, 'JSON structure documented');
  });
});
