import { getReferredIssues, parseIssueReference, parseMagicWords } from './parser';

describe('Parser Functions', () => {
  describe('getReferredIssues', () => {
    it('should correctly identify closing and non-closing references', () => {
      const title = 'Fixes ABC-123';
      const description = 'This PR closes ABC-456 and references ABC-789';
      const result = getReferredIssues(title, description);

      expect(result.closingReferences).toEqual([
        { identifier: 'ABC', sequence: 456 },
        { identifier: 'ABC', sequence: 123 },
      ]);
      expect(result.nonClosingReferences).toEqual([
        { identifier: 'ABC', sequence: 789 },
      ]);
    });

    it('should handle no references', () => {
      const title = 'No references here';
      const description = 'Nothing to see here';
      const result = getReferredIssues(title, description);

      expect(result.closingReferences).toEqual([]);
      expect(result.nonClosingReferences).toEqual([]);
    });

    it('should handle duplicate references', () => {
      const title = 'Fixes ABC-123';
      const description = 'This PR closes ABC-123 and references ABC-123';
      const result = getReferredIssues(title, description);

      expect(result.closingReferences).toEqual([
        { identifier: 'ABC', sequence: 123 },
      ]);
      expect(result.nonClosingReferences).toEqual([]);
    });
  });

  describe('parseIssueReference', () => {
    it('should parse issue reference from title', () => {
      const data = 'ABC-123: Fix the bug';
      const result = parseIssueReference(data);

      expect(result).toEqual(['ABC-123']);
    });

    it('should return an empty array if no reference is found', () => {
      const data = 'Fix the bug';
      const result = parseIssueReference(data);

      expect(result).toEqual([]);
    });
  });

  describe('parseMagicWords', () => {
    it('should identify closing and non-closing references based on magic words', () => {
      const title = 'This closes ABC-123 and references ABC-456';
      const result = parseMagicWords(title);

      expect(result.closingRefs).toEqual(['ABC-123']);
      expect(result.nonClosingRefs).toEqual(['ABC-456']);
    });

    it('should not consider issues without magic words', () => {
      const title = 'ABC-123 ABC-456';
      const result = parseMagicWords(title);

      expect(result.closingRefs).toEqual([]);
      expect(result.nonClosingRefs).toEqual([]);
    });

    it('should handle mixed case magic words', () => {
      const title = 'This ClOsEs ABC-123 and ReFeReNcEs ABC-456';
      const result = parseMagicWords(title);

      expect(result.closingRefs).toEqual(['ABC-123']);
      expect(result.nonClosingRefs).toEqual(['ABC-456']);
    });

    it('should handle no magic words or references', () => {
      const title = 'No magic words here';
      const result = parseMagicWords(title);

      expect(result.closingRefs).toEqual([]);
      expect(result.nonClosingRefs).toEqual([]);
    });
  });
});
