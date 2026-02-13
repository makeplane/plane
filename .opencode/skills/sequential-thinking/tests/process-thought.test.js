/**
 * Tests for Sequential Thinking Thought Processor
 *
 * Run with: npm test
 */

const { ThoughtProcessor } = require('../scripts/process-thought');
const fs = require('fs');
const path = require('path');

// Mock history file for testing
const TEST_HISTORY_FILE = path.join(__dirname, '../scripts/.thought-history.json');

describe('ThoughtProcessor', () => {
  let processor;

  beforeEach(() => {
    // Clean up any existing history file
    if (fs.existsSync(TEST_HISTORY_FILE)) {
      fs.unlinkSync(TEST_HISTORY_FILE);
    }
    processor = new ThoughtProcessor();
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(TEST_HISTORY_FILE)) {
      fs.unlinkSync(TEST_HISTORY_FILE);
    }
  });

  describe('Validation', () => {
    test('rejects missing thought', () => {
      const result = processor.processThought({
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid thought: must be a non-empty string');
    });

    test('rejects empty thought string', () => {
      const result = processor.processThought({
        thought: '   ',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid thought: must be a non-empty string');
    });

    test('rejects invalid thoughtNumber', () => {
      const result = processor.processThought({
        thought: 'Test',
        thoughtNumber: 0,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid thoughtNumber: must be a positive number');
    });

    test('rejects missing nextThoughtNeeded', () => {
      const result = processor.processThought({
        thought: 'Test',
        thoughtNumber: 1,
        totalThoughts: 5
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid nextThoughtNeeded: must be a boolean');
    });

    test('accepts valid thought', () => {
      const result = processor.processThought({
        thought: 'Valid thought',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      expect(result.success).toBe(true);
      expect(result.thoughtNumber).toBe(1);
      expect(result.totalThoughts).toBe(5);
    });
  });

  describe('Thought Processing', () => {
    test('tracks thought history', () => {
      processor.processThought({
        thought: 'First thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      processor.processThought({
        thought: 'Second thought',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      const result = processor.processThought({
        thought: 'Third thought',
        thoughtNumber: 3,
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      expect(result.thoughtHistoryLength).toBe(3);
    });

    test('auto-adjusts totalThoughts when exceeded', () => {
      const result = processor.processThought({
        thought: 'Thought 5',
        thoughtNumber: 5,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      expect(result.totalThoughts).toBe(5);
    });

    test('tracks revisions', () => {
      processor.processThought({
        thought: 'Original thought',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      const result = processor.processThought({
        thought: 'Revised thought',
        thoughtNumber: 2,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        isRevision: true,
        revisesThought: 1
      });

      expect(result.success).toBe(true);
      expect(result.thoughtHistoryLength).toBe(2);
    });

    test('tracks branches', () => {
      processor.processThought({
        thought: 'Main thought',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      processor.processThought({
        thought: 'Branch A',
        thoughtNumber: 2,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        branchFromThought: 1,
        branchId: 'branch-a'
      });

      const result = processor.processThought({
        thought: 'Branch B',
        thoughtNumber: 2,
        totalThoughts: 5,
        nextThoughtNeeded: false,
        branchFromThought: 1,
        branchId: 'branch-b'
      });

      expect(result.branches).toContain('branch-a');
      expect(result.branches).toContain('branch-b');
      expect(result.branches.length).toBe(2);
    });
  });

  describe('History Management', () => {
    test('resets history', () => {
      processor.processThought({
        thought: 'First thought',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      processor.resetHistory();

      const history = processor.getHistory();
      expect(history.totalThoughts).toBe(0);
      expect(history.thoughts.length).toBe(0);
    });

    test('persists and loads history', () => {
      processor.processThought({
        thought: 'Persisted thought',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      });

      // Create new processor instance (should load from file)
      const newProcessor = new ThoughtProcessor();
      const history = newProcessor.getHistory();

      expect(history.totalThoughts).toBe(1);
      expect(history.thoughts[0].thought).toBe('Persisted thought');
    });
  });
});
