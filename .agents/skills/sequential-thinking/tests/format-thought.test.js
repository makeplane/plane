/**
 * Tests for Sequential Thinking Thought Formatter
 *
 * Run with: npm test
 */

const { ThoughtFormatter } = require('../scripts/format-thought');

describe('ThoughtFormatter', () => {
  describe('Simple Format', () => {
    test('formats regular thought', () => {
      const result = ThoughtFormatter.formatSimple({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 5
      });

      expect(result).toBe('Thought 1/5: Test thought');
    });

    test('formats revision thought', () => {
      const result = ThoughtFormatter.formatSimple({
        thought: 'Revised thought',
        thoughtNumber: 2,
        totalThoughts: 5,
        isRevision: true,
        revisesThought: 1
      });

      expect(result).toContain('[REVISION of Thought 1]');
      expect(result).toContain('Revised thought');
    });

    test('formats branch thought', () => {
      const result = ThoughtFormatter.formatSimple({
        thought: 'Branch thought',
        thoughtNumber: 3,
        totalThoughts: 5,
        branchFromThought: 2,
        branchId: 'a'
      });

      expect(result).toContain('[BRANCH A from Thought 2]');
      expect(result).toContain('Branch thought');
    });
  });

  describe('Markdown Format', () => {
    test('formats regular thought', () => {
      const result = ThoughtFormatter.formatMarkdown({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 5
      });

      expect(result).toContain('**Thought 1/5**');
      expect(result).toContain('Test thought');
    });

    test('formats revision thought', () => {
      const result = ThoughtFormatter.formatMarkdown({
        thought: 'Revised thought',
        thoughtNumber: 2,
        totalThoughts: 5,
        isRevision: true,
        revisesThought: 1
      });

      expect(result).toContain('**[REVISION of Thought 1]**');
    });
  });

  describe('Box Format', () => {
    test('formats with border', () => {
      const result = ThoughtFormatter.format({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 5
      });

      expect(result).toContain('┌');
      expect(result).toContain('└');
      expect(result).toContain('💭');
      expect(result).toContain('Test thought');
    });

    test('formats revision with emoji', () => {
      const result = ThoughtFormatter.format({
        thought: 'Revised',
        thoughtNumber: 2,
        totalThoughts: 5,
        isRevision: true,
        revisesThought: 1
      });

      expect(result).toContain('🔄');
      expect(result).toContain('REVISION');
    });

    test('formats branch with emoji', () => {
      const result = ThoughtFormatter.format({
        thought: 'Branch',
        thoughtNumber: 3,
        totalThoughts: 5,
        branchFromThought: 2,
        branchId: 'a'
      });

      expect(result).toContain('🌿');
      expect(result).toContain('BRANCH');
    });
  });

  describe('Text Wrapping', () => {
    test('wraps long text', () => {
      const longText = 'This is a very long thought that should be wrapped across multiple lines when it exceeds the maximum width specified for the formatter';
      const wrapped = ThoughtFormatter.wrapText(longText, 50);

      expect(wrapped.length).toBeGreaterThan(1);
      wrapped.forEach(line => {
        expect(line.length).toBeLessThanOrEqual(50);
      });
    });

    test('does not wrap short text', () => {
      const shortText = 'Short thought';
      const wrapped = ThoughtFormatter.wrapText(shortText, 50);

      expect(wrapped.length).toBe(1);
      expect(wrapped[0]).toBe(shortText);
    });
  });
});
