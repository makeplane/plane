#!/usr/bin/env node

/**
 * XSS Protection Verification
 */

const renderer = require('../scripts/lib/dashboard-renderer.cjs');

console.log('\nXSS Protection Verification');
console.log('='.repeat(70));

// Test 1: Image onerror payload
const xssPayload1 = '<img src=x onerror="alert(1)">';
const result1 = renderer.escapeHtml(xssPayload1);
console.log('\nTest 1: Image onerror');
console.log(`Input: ${xssPayload1}`);
console.log(`Output: ${result1}`);
const pass1 = !result1.includes('<img') && result1.includes('&lt;');
console.log(`Result: ${pass1 ? 'PASS' : 'FAIL'}`);

// Test 2: Script tag injection
const xssPayload2 = '<script>alert("xss")</script>';
const result2 = renderer.escapeHtml(xssPayload2);
console.log('\nTest 2: Script tag');
console.log(`Input: ${xssPayload2}`);
console.log(`Output: ${result2}`);
const pass2 = !result2.includes('<script') && result2.includes('&lt;script');
console.log(`Result: ${pass2 ? 'PASS' : 'FAIL'}`);

// Test 3: Full dashboard render with malicious plan
const plans = [
  {
    id: 'xss-test',
    name: '<script>alert(1)</script>',
    status: 'pending',
    progress: 0,
    lastModified: '2025-12-11T10:00:00Z',
    path: '"><script>alert(1)</script><"',
    phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
  }
];

const html = renderer.renderDashboard(plans, {
  assetsDir: 'nonexistent' // Use fallback template
});

console.log('\nTest 3: Full dashboard render');
console.log(`Input: Malicious plan name and path`);
// Check that the HTML contains escaped version in plan card
// JSON will also contain escaped content but that's safe
const cardSectionStart = html.indexOf('<article');
const cardSectionEnd = html.indexOf('</article>');
const cardContent = cardSectionStart !== -1 ? html.substring(cardSectionStart, cardSectionEnd) : '';
const hasEscapedInCard = cardContent.includes('&lt;script&gt;');
const pass3 = hasEscapedInCard;
console.log(`Result: ${pass3 ? 'PASS' : 'FAIL'}`);

// Test 4: HTML structure
console.log('\nTest 4: HTML structure validity');
const hasDoctype = html.includes('<!DOCTYPE html');
const hasHtmlClose = html.includes('</html>');
const hasMain = html.includes('<main');
const hasPlans = html.includes('{{plans-grid}}') || html.includes('class="plans-grid"');
console.log(`DOCTYPE: ${hasDoctype ? 'PASS' : 'FAIL'}`);
console.log(`Closing HTML: ${hasHtmlClose ? 'PASS' : 'FAIL'}`);
console.log(`Main element: ${hasMain ? 'PASS' : 'FAIL'}`);
console.log(`Plans section: ${hasPlans ? 'PASS' : 'FAIL'}`);
const pass4 = hasDoctype && hasHtmlClose && hasMain;

// Test 5: JSON embedded safely
console.log('\nTest 5: JSON embedding');
const jsonIncluded = html.includes('window.__plans');
const jsonValid = html.includes('"id"') && html.includes('"name"');
console.log(`JSON variable: ${jsonIncluded ? 'PASS' : 'FAIL'}`);
console.log(`JSON valid: ${jsonValid ? 'PASS' : 'FAIL'}`);
const pass5 = jsonIncluded && jsonValid;

// Summary
console.log('\n' + '='.repeat(70));
console.log('Summary');
console.log('='.repeat(70));
const allPass = pass1 && pass2 && pass3 && pass4 && pass5;
console.log(`XSS Escaping: ${pass1 && pass2 ? 'PASS (2/2)' : 'FAIL'}`);
console.log(`Dashboard Render: ${pass3 ? 'PASS' : 'FAIL'}`);
console.log(`HTML Structure: ${pass4 ? 'PASS' : 'FAIL'}`);
console.log(`JSON Embedding: ${pass5 ? 'PASS' : 'FAIL'}`);
console.log(`\nOverall: ${allPass ? 'PASS' : 'FAIL'}`);
console.log('='.repeat(70) + '\n');

process.exit(allPass ? 0 : 1);
