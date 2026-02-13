/**
 * Tests for dashboard assets
 * HTML template structure, CSS syntax, JS functions
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const assetsDir = path.join(__dirname, '..', 'assets');
const templatePath = path.join(assetsDir, 'dashboard-template.html');
const cssPath = path.join(assetsDir, 'dashboard.css');
const jsPath = path.join(assetsDir, 'dashboard.js');

describe('dashboard-template.html', () => {
  let htmlContent;

  before(() => {
    assert(fs.existsSync(templatePath), `Template file not found: ${templatePath}`);
    htmlContent = fs.readFileSync(templatePath, 'utf8');
  });

  it('should be valid HTML5', () => {
    assert(htmlContent.includes('<!DOCTYPE html'));
    assert(htmlContent.includes('<html'));
    assert(htmlContent.includes('</html>'));
  });

  it('should have proper head section', () => {
    assert(htmlContent.includes('<head>'));
    assert(htmlContent.includes('<meta charset="UTF-8">'));
    assert(htmlContent.includes('<meta name="viewport"'));
    assert(htmlContent.includes('</head>'));
  });

  it('should have title element', () => {
    assert(htmlContent.includes('<title>'));
    assert(htmlContent.includes('Plans Dashboard'));
  });

  it('should link required CSS files', () => {
    assert(htmlContent.includes('novel-theme.css'));
    assert(htmlContent.includes('dashboard.css'));
  });

  it('should have main content area', () => {
    assert(htmlContent.includes('<main'));
    assert(htmlContent.includes('role="main"'));
    assert(htmlContent.includes('aria-label="Plans Dashboard"'));
  });

  it('should have dashboard header', () => {
    assert(htmlContent.includes('class="dashboard-header"'));
    assert(htmlContent.includes('<h1>Plans Dashboard</h1>'));
  });

  it('should have theme toggle button', () => {
    assert(htmlContent.includes('id="theme-toggle"'));
    assert(htmlContent.includes('aria-label="Toggle theme"'));
  });

  it('should have search input', () => {
    assert(htmlContent.includes('id="plan-search"'));
    assert(htmlContent.includes('type="search"'));
    assert(htmlContent.includes('placeholder="Search plans..."'));
  });

  it('should have sort select', () => {
    assert(htmlContent.includes('id="sort-select"'));
    assert(htmlContent.includes('value="date-desc"'));
    assert(htmlContent.includes('value="name-asc"'));
  });

  it('should have filter pills', () => {
    assert(htmlContent.includes('class="filter-pills"'));
    assert(htmlContent.includes('data-filter="all"'));
    assert(htmlContent.includes('data-filter="completed"'));
    assert(htmlContent.includes('data-filter="in-progress"'));
    assert(htmlContent.includes('data-filter="pending"'));
  });

  it('should have plans grid section', () => {
    assert(htmlContent.includes('class="plans-grid"'));
    assert(htmlContent.includes('aria-label="Plans list"'));
  });

  it('should have template placeholders', () => {
    assert(htmlContent.includes('{{plans-grid}}'));
    assert(htmlContent.includes('{{plan-count}}'));
    assert(htmlContent.includes('{{plans-json}}'));
    assert(htmlContent.includes('{{empty-state}}'));
  });

  it('should have loading skeleton', () => {
    assert(htmlContent.includes('class="loading-skeleton"'));
    assert(htmlContent.includes('class="skeleton-card"'));
  });

  it('should have screen reader announcements', () => {
    assert(htmlContent.includes('id="sr-announce"'));
    assert(htmlContent.includes('aria-live="polite"'));
  });

  it('should embed plans JSON', () => {
    assert(htmlContent.includes('window.__plans'));
  });

  it('should load dashboard.js', () => {
    assert(htmlContent.includes('src="/assets/dashboard.js"'));
  });

  it('should have proper closing tags', () => {
    const openMain = (htmlContent.match(/<main/g) || []).length;
    const closeMain = (htmlContent.match(/<\/main>/g) || []).length;
    assert.strictEqual(openMain, closeMain, 'Mismatched main tags');

    const openBody = (htmlContent.match(/<body/g) || []).length;
    const closeBody = (htmlContent.match(/<\/body>/g) || []).length;
    assert.strictEqual(openBody, closeBody, 'Mismatched body tags');
  });

  it('should have data-theme attribute on html', () => {
    assert(htmlContent.includes('data-theme='));
  });
});

describe('dashboard.css', () => {
  let cssContent;

  before(() => {
    assert(fs.existsSync(cssPath), `CSS file not found: ${cssPath}`);
    cssContent = fs.readFileSync(cssPath, 'utf8');
  });

  it('should have valid CSS syntax', () => {
    // Basic check: should have selectors and properties
    assert(cssContent.includes('{'));
    assert(cssContent.includes('}'));
  });

  it('should define dashboard-view class', () => {
    assert(cssContent.includes('.dashboard-view'));
  });

  it('should define dashboard-header styles', () => {
    assert(cssContent.includes('.dashboard-header'));
  });

  it('should define plan-card styles', () => {
    assert(cssContent.includes('.plan-card'));
  });

  it('should define progress-ring styles', () => {
    assert(cssContent.includes('.progress-ring'));
  });

  it('should define progress-bar styles', () => {
    assert(cssContent.includes('.progress-bar'));
  });

  it('should define empty-state styles', () => {
    assert(cssContent.includes('.empty-state'));
  });

  it('should have responsive media queries', () => {
    assert(cssContent.includes('@media'));
  });

  it('should define animations', () => {
    assert(cssContent.includes('@keyframes'));
  });

  it('should have accessibility classes', () => {
    assert(cssContent.includes('.visually-hidden'));
  });

  it('should have focus styles', () => {
    assert(cssContent.includes(':focus'));
    assert(cssContent.includes(':focus-visible'));
  });

  it('should support reduced motion', () => {
    assert(cssContent.includes('prefers-reduced-motion'));
  });

  it('should define color variables or hex values', () => {
    // Check for color definitions
    assert(cssContent.includes('var(--') || cssContent.includes('#') || cssContent.includes('rgb'));
  });

  it('should not have CSS syntax errors (basic check)', () => {
    // Check for unclosed braces
    const openBraces = (cssContent.match(/{/g) || []).length;
    const closeBraces = (cssContent.match(/}/g) || []).length;
    assert.strictEqual(openBraces, closeBraces, 'Unmatched CSS braces');
  });

  it('should define filter pills styling', () => {
    assert(cssContent.includes('.filter-pill'));
  });

  it('should define search box styling', () => {
    assert(cssContent.includes('.search-box'));
  });

  it('should define status count styling', () => {
    assert(cssContent.includes('.status-count'));
  });
});

describe('dashboard.js', () => {
  let jsContent;

  before(() => {
    assert(fs.existsSync(jsPath), `JS file not found: ${jsPath}`);
    jsContent = fs.readFileSync(jsPath, 'utf8');
  });

  it('should be valid JavaScript', () => {
    // Check for syntax errors by looking for basic patterns
    assert(jsContent.includes('function') || jsContent.includes('const') || jsContent.includes('let'));
  });

  it('should have IIFE pattern for encapsulation', () => {
    assert(jsContent.includes('(function()'));
    assert(jsContent.includes('})()'));
  });

  it('should initialize state object', () => {
    assert(jsContent.includes('const state'));
    assert(jsContent.includes('sort:'));
    assert(jsContent.includes('filter:'));
    assert(jsContent.includes('search:'));
  });

  it('should have init function', () => {
    assert(jsContent.includes('function init()'));
  });

  it('should bind events', () => {
    assert(jsContent.includes('function bindEvents()'));
  });

  it('should apply filters and sort', () => {
    assert(jsContent.includes('function applyFiltersAndSort()'));
  });

  it('should render grid', () => {
    assert(jsContent.includes('renderGrid'));
    assert(jsContent.includes('.plans-grid'));
  });

  it('should parse URL parameters', () => {
    assert(jsContent.includes('parseURL'));
    assert(jsContent.includes('URLSearchParams'));
  });

  it('should update URL', () => {
    assert(jsContent.includes('updateURL'));
    assert(jsContent.includes('history.replaceState'));
  });

  it('should handle search input', () => {
    assert(jsContent.includes('plan-search'));
    assert(jsContent.includes('addEventListener'));
  });

  it('should handle sort select', () => {
    assert(jsContent.includes('sort-select'));
    assert(jsContent.includes('change'));
  });

  it('should handle filter pills', () => {
    assert(jsContent.includes('.filter-pill'));
  });

  it('should handle card click navigation', () => {
    assert(jsContent.includes('.plan-card'));
    assert(jsContent.includes('.view-btn'));
  });

  it('should have keyboard navigation', () => {
    assert(jsContent.includes('setupKeyboardNav'));
    assert(jsContent.includes('ArrowRight') || jsContent.includes('ArrowDown'));
  });

  it('should have theme toggle setup', () => {
    assert(jsContent.includes('setupThemeToggle'));
    assert(jsContent.includes('theme-toggle'));
    assert(jsContent.includes('localStorage'));
  });

  it('should announce to screen readers', () => {
    assert(jsContent.includes('announce'));
    assert(jsContent.includes('sr-announce'));
  });

  it('should use window.__plans data', () => {
    assert(jsContent.includes('window.__plans'));
  });

  it('should initialize on DOM ready', () => {
    assert(jsContent.includes('DOMContentLoaded'));
  });

  it('should have strict mode', () => {
    assert(jsContent.includes("'use strict'"));
  });

  it('should check for required DOM elements', () => {
    assert(jsContent.includes('document.querySelector'));
    assert(jsContent.includes('.plans-grid'));
    assert(jsContent.includes('.result-count'));
    assert(jsContent.includes('.empty-state'));
  });

  it('should validate syntax with basic checks', () => {
    // Check for unclosed strings
    const singleQuotes = (jsContent.match(/'/g) || []).length;
    const doubleQuotes = (jsContent.match(/"/g) || []).length;
    // Both should be even (pairs)
    assert.strictEqual(singleQuotes % 2, 0, 'Unmatched single quotes');
    assert.strictEqual(doubleQuotes % 2, 0, 'Unmatched double quotes');
  });

  it('should have debounce for search input', () => {
    assert(jsContent.includes('debounce'));
    assert(jsContent.includes('setTimeout'));
  });

  it('should support sort options', () => {
    assert(jsContent.includes('date-desc'));
    assert(jsContent.includes('name-asc'));
    assert(jsContent.includes('progress-desc'));
  });
});

console.log('\n' + '='.repeat(60));
console.log('Dashboard Assets Tests');
console.log('='.repeat(60));
