/**
 * Tests for selector parsing library
 * Run with: node --test __tests__/selector.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseSelector } from '../lib/selector.js';

describe('parseSelector', () => {
  describe('CSS Selectors', () => {
    it('should detect simple CSS selectors', () => {
      const result = parseSelector('button');
      assert.strictEqual(result.type, 'css');
      assert.strictEqual(result.selector, 'button');
    });

    it('should detect class selectors', () => {
      const result = parseSelector('.btn-submit');
      assert.strictEqual(result.type, 'css');
      assert.strictEqual(result.selector, '.btn-submit');
    });

    it('should detect ID selectors', () => {
      const result = parseSelector('#email-input');
      assert.strictEqual(result.type, 'css');
      assert.strictEqual(result.selector, '#email-input');
    });

    it('should detect attribute selectors', () => {
      const result = parseSelector('button[type="submit"]');
      assert.strictEqual(result.type, 'css');
      assert.strictEqual(result.selector, 'button[type="submit"]');
    });

    it('should detect complex CSS selectors', () => {
      const result = parseSelector('div.container > button.btn-primary:hover');
      assert.strictEqual(result.type, 'css');
    });
  });

  describe('XPath Selectors', () => {
    it('should detect absolute XPath', () => {
      const result = parseSelector('/html/body/button');
      assert.strictEqual(result.type, 'xpath');
      assert.strictEqual(result.selector, '/html/body/button');
    });

    it('should detect relative XPath', () => {
      const result = parseSelector('//button');
      assert.strictEqual(result.type, 'xpath');
      assert.strictEqual(result.selector, '//button');
    });

    it('should detect XPath with text matching', () => {
      const result = parseSelector('//button[text()="Click Me"]');
      assert.strictEqual(result.type, 'xpath');
    });

    it('should detect XPath with contains', () => {
      const result = parseSelector('//button[contains(text(),"Submit")]');
      assert.strictEqual(result.type, 'xpath');
    });

    it('should detect XPath with attributes', () => {
      const result = parseSelector('//input[@type="email"]');
      assert.strictEqual(result.type, 'xpath');
    });

    it('should detect grouped XPath', () => {
      const result = parseSelector('(//button)[1]');
      assert.strictEqual(result.type, 'xpath');
    });
  });

  describe('Security Validation', () => {
    it('should block javascript: injection', () => {
      assert.throws(
        () => parseSelector('//button[@onclick="javascript:alert(1)"]'),
        /XPath injection detected.*javascript:/i
      );
    });

    it('should block <script tag injection', () => {
      assert.throws(
        () => parseSelector('//div[contains(text(),"<script>alert(1)</script>")]'),
        /XPath injection detected.*<script/i
      );
    });

    it('should block onerror= injection', () => {
      assert.throws(
        () => parseSelector('//img[@onerror="alert(1)"]'),
        /XPath injection detected.*onerror=/i
      );
    });

    it('should block onload= injection', () => {
      assert.throws(
        () => parseSelector('//body[@onload="malicious()"]'),
        /XPath injection detected.*onload=/i
      );
    });

    it('should block onclick= injection', () => {
      assert.throws(
        () => parseSelector('//a[@onclick="steal()"]'),
        /XPath injection detected.*onclick=/i
      );
    });

    it('should block eval( injection', () => {
      assert.throws(
        () => parseSelector('//div[eval("malicious")]'),
        /XPath injection detected.*eval\(/i
      );
    });

    it('should block Function( injection', () => {
      assert.throws(
        () => parseSelector('//div[Function("return 1")()]'),
        /XPath injection detected.*Function\(/i
      );
    });

    it('should block constructor( injection', () => {
      assert.throws(
        () => parseSelector('//div[constructor("alert(1)")()]'),
        /XPath injection detected.*constructor\(/i
      );
    });

    it('should be case-insensitive for security checks', () => {
      assert.throws(
        () => parseSelector('//div[@ONERROR="alert(1)"]'),
        /XPath injection detected/i
      );
    });

    it('should block extremely long selectors (DoS prevention)', () => {
      const longSelector = '//' + 'a'.repeat(1001);
      assert.throws(
        () => parseSelector(longSelector),
        /XPath selector too long/i
      );
    });
  });

  describe('Edge Cases', () => {
    it('should throw on empty string', () => {
      assert.throws(
        () => parseSelector(''),
        /Selector must be a non-empty string/
      );
    });

    it('should throw on null', () => {
      assert.throws(
        () => parseSelector(null),
        /Selector must be a non-empty string/
      );
    });

    it('should throw on undefined', () => {
      assert.throws(
        () => parseSelector(undefined),
        /Selector must be a non-empty string/
      );
    });

    it('should throw on non-string input', () => {
      assert.throws(
        () => parseSelector(123),
        /Selector must be a non-empty string/
      );
    });

    it('should handle selectors with special characters', () => {
      const result = parseSelector('button[data-test="submit-form"]');
      assert.strictEqual(result.type, 'css');
    });

    it('should allow safe XPath with parentheses', () => {
      const result = parseSelector('//button[contains(text(),"Save")]');
      assert.strictEqual(result.type, 'xpath');
      // Should not throw
    });
  });

  describe('Real-World Examples', () => {
    it('should handle common button selector', () => {
      const result = parseSelector('//button[contains(text(),"Submit")]');
      assert.strictEqual(result.type, 'xpath');
    });

    it('should handle complex form selector', () => {
      const result = parseSelector('//form[@id="login-form"]//input[@type="email"]');
      assert.strictEqual(result.type, 'xpath');
    });

    it('should handle descendant selector', () => {
      const result = parseSelector('//div[@class="modal"]//button[@class="close"]');
      assert.strictEqual(result.type, 'xpath');
    });

    it('should handle nth-child equivalent', () => {
      const result = parseSelector('(//li)[3]');
      assert.strictEqual(result.type, 'xpath');
    });
  });
});
