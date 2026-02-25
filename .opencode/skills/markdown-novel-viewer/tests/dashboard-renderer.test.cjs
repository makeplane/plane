/**
 * Tests for dashboard-renderer.cjs
 * XSS protection, progress ring, plan card generation, and dashboard rendering
 */

const assert = require('assert');
const {
  renderDashboard,
  generatePlanCard,
  generateProgressRing,
  generateProgressBar,
  generateStatusCounts,
  generateEmptyState,
  generatePlansGrid,
  escapeHtml,
  formatDate
} = require('../scripts/lib/dashboard-renderer.cjs');

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    assert.strictEqual(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should handle ampersands', () => {
    assert.strictEqual(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
  });

  it('should handle single quotes', () => {
    assert.strictEqual(escapeHtml("it's"), 'it&#039;s');
  });

  it('should handle double quotes', () => {
    assert.strictEqual(escapeHtml('He said "hello"'), 'He said &quot;hello&quot;');
  });

  it('should handle null/undefined', () => {
    assert.strictEqual(escapeHtml(null), '');
    assert.strictEqual(escapeHtml(undefined), '');
  });

  it('should handle empty string', () => {
    assert.strictEqual(escapeHtml(''), '');
  });

  it('should escape multiple occurrences', () => {
    const result = escapeHtml('<div class="test">Hello & "goodbye"</div>');
    assert.strictEqual(result, '&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;goodbye&quot;&lt;/div&gt;');
  });
});

describe('formatDate', () => {
  it('should format ISO date string', () => {
    const result = formatDate('2025-12-11T10:30:00Z');
    assert(result.includes('Dec'));
    assert(result.includes('11'));
    assert(result.includes('2025'));
  });

  it('should handle null/undefined', () => {
    assert.strictEqual(formatDate(null), '');
    assert.strictEqual(formatDate(undefined), '');
  });

  it('should handle empty string', () => {
    assert.strictEqual(formatDate(''), '');
  });

  it('should format different dates correctly', () => {
    const result1 = formatDate('2025-01-01T00:00:00Z');
    const result2 = formatDate('2025-12-31T23:59:59Z');
    // Check for month indicator - could be "Jan" or "1" depending on locale
    assert(result1.length > 0, 'Date 1 should format');
    assert(result2.length > 0, 'Date 2 should format');
    assert(result1 !== result2, 'Different dates should format differently');
  });
});

describe('generateProgressRing', () => {
  it('should generate SVG with correct progress percentage', () => {
    const svg = generateProgressRing(50);
    assert(svg.includes('50%'));
    assert(svg.includes('stroke-dasharray'));
  });

  it('should generate valid SVG structure', () => {
    const svg = generateProgressRing(75);
    assert(svg.includes('<svg class="progress-ring"'));
    assert(svg.includes('<circle'));
    assert(svg.includes('<text'));
  });

  it('should handle 0% progress', () => {
    const svg = generateProgressRing(0);
    assert(svg.includes('0%'));
    assert(svg.includes('0, 100'));
  });

  it('should handle 100% progress', () => {
    const svg = generateProgressRing(100);
    assert(svg.includes('100%'));
    assert(svg.includes('100, 100'));
  });

  it('should have aria-hidden for accessibility', () => {
    const svg = generateProgressRing(50);
    assert(svg.includes('aria-hidden="true"'));
  });
});

describe('generateProgressBar', () => {
  it('should generate progress bar with correct percentages', () => {
    const bar = generateProgressBar({ total: 10, completed: 5, inProgress: 3, pending: 2 });
    assert(bar.includes('50.0%')); // completed
    assert(bar.includes('30.0%')); // in-progress
    assert(bar.includes('20.0%')); // pending
  });

  it('should have accessibility attributes', () => {
    const bar = generateProgressBar({ total: 10, completed: 5, inProgress: 3, pending: 2 });
    assert(bar.includes('role="progressbar"'));
    assert(bar.includes('aria-valuenow="5"'));
    assert(bar.includes('aria-valuemin="0"'));
    assert(bar.includes('aria-valuemax="10"'));
  });

  it('should handle zero total (fallback)', () => {
    const bar = generateProgressBar({ total: 0, completed: 0, inProgress: 0, pending: 0 });
    assert(bar.includes('class="progress-bar"'));
  });

  it('should create three segments with correct classes', () => {
    const bar = generateProgressBar({ total: 10, completed: 5, inProgress: 3, pending: 2 });
    assert(bar.includes('class="bar-segment completed"'));
    assert(bar.includes('class="bar-segment in-progress"'));
    assert(bar.includes('class="bar-segment pending"'));
  });
});

describe('generateStatusCounts', () => {
  it('should generate status count HTML', () => {
    const html = generateStatusCounts({ completed: 3, inProgress: 2, pending: 1 });
    assert(html.includes('3'));
    assert(html.includes('2'));
    assert(html.includes('1'));
  });

  it('should have accessibility features', () => {
    const html = generateStatusCounts({ completed: 3, inProgress: 2, pending: 1 });
    assert(html.includes('visually-hidden'));
    assert(html.includes('data-tooltip'));
  });

  it('should have correct status classes', () => {
    const html = generateStatusCounts({ completed: 3, inProgress: 2, pending: 1 });
    assert(html.includes('status-count completed'));
    assert(html.includes('status-count in-progress'));
    assert(html.includes('status-count pending'));
  });
});

describe('generatePlanCard', () => {
  it('should generate card HTML with plan data', () => {
    const plan = {
      id: 'plan-001',
      name: 'Test Plan',
      status: 'in-progress',
      progress: 50,
      lastModified: '2025-12-11T10:00:00Z',
      path: '/plans/test-plan',
      phases: { completed: 2, inProgress: 1, pending: 1, total: 4 }
    };
    const card = generatePlanCard(plan);
    assert(card.includes('Test Plan'));
    assert(card.includes('plan-001'));
    assert(card.includes('/plans/test-plan'));
  });

  it('should escape HTML in plan name', () => {
    const plan = {
      id: 'plan-001',
      name: '<script>alert("xss")</script>',
      status: 'pending',
      progress: 0,
      lastModified: '2025-12-11T10:00:00Z',
      path: '/plans/test',
      phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
    };
    const card = generatePlanCard(plan);
    assert(!card.includes('<script>'));
    assert(card.includes('&lt;script&gt;'));
  });

  it('should escape HTML in plan path', () => {
    const plan = {
      id: 'plan-001',
      name: 'Test',
      status: 'pending',
      progress: 0,
      lastModified: '2025-12-11T10:00:00Z',
      path: '"><script>alert(1)</script><"',
      phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
    };
    const card = generatePlanCard(plan);
    assert(!card.includes('<script>'));
    assert(card.includes('&quot;'));
  });

  it('should set correct data-status attribute', () => {
    const planInProgress = generatePlanCard({
      id: 'p1',
      name: 'Test',
      status: 'in-progress',
      progress: 50,
      lastModified: '2025-12-11T10:00:00Z',
      path: '/test',
      phases: { completed: 0, inProgress: 1, pending: 0, total: 1 }
    });
    assert(planInProgress.includes('data-status="in-progress"'));
  });

  it('should have accessible structure', () => {
    const plan = {
      id: 'plan-001',
      name: 'Test Plan',
      status: 'completed',
      progress: 100,
      lastModified: '2025-12-11T10:00:00Z',
      path: '/plans/test',
      phases: { completed: 1, inProgress: 0, pending: 0, total: 1 }
    };
    const card = generatePlanCard(plan);
    assert(card.includes('<article'));
    assert(card.includes('<header'));
    assert(card.includes('<footer'));
    assert(card.includes('tabindex="0"'));
  });

  it('should include time element with datetime attribute', () => {
    const plan = {
      id: 'plan-001',
      name: 'Test',
      status: 'pending',
      progress: 0,
      lastModified: '2025-12-11T10:00:00Z',
      path: '/plans/test',
      phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
    };
    const card = generatePlanCard(plan);
    assert(card.includes('<time class="plan-date" datetime='));
  });
});

describe('generatePlansGrid', () => {
  it('should generate cards for all plans', () => {
    const plans = [
      {
        id: 'p1',
        name: 'Plan 1',
        status: 'completed',
        progress: 100,
        lastModified: '2025-12-11T10:00:00Z',
        path: '/plans/1',
        phases: { completed: 1, inProgress: 0, pending: 0, total: 1 }
      },
      {
        id: 'p2',
        name: 'Plan 2',
        status: 'pending',
        progress: 0,
        lastModified: '2025-12-11T09:00:00Z',
        path: '/plans/2',
        phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
      }
    ];
    const grid = generatePlansGrid(plans);
    assert(grid.includes('Plan 1'));
    assert(grid.includes('Plan 2'));
  });

  it('should return empty string for empty plans', () => {
    assert.strictEqual(generatePlansGrid([]), '');
    assert.strictEqual(generatePlansGrid(null), '');
  });
});

describe('generateEmptyState', () => {
  it('should generate empty state HTML', () => {
    const html = generateEmptyState();
    assert(html.includes('No plans found'));
    assert(html.includes('class="empty-state"'));
    assert(html.includes('hidden'));
  });

  it('should have accessibility features', () => {
    const html = generateEmptyState();
    assert(html.includes('aria-hidden="true"'));
  });
});

describe('renderDashboard', () => {
  it('should render dashboard with plans', () => {
    const plans = [
      {
        id: 'p1',
        name: 'Test Plan',
        status: 'pending',
        progress: 0,
        lastModified: '2025-12-11T10:00:00Z',
        path: '/plans/test',
        phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
      }
    ];
    const html = renderDashboard(plans, { assetsDir: '/tmp' });
    assert(html.includes('Test Plan'));
    assert(html.includes('<!DOCTYPE html'));
  });

  it('should embed plans JSON for client-side filtering', () => {
    const plans = [
      {
        id: 'p1',
        name: 'Test',
        status: 'pending',
        progress: 0,
        lastModified: '2025-12-11T10:00:00Z',
        path: '/plans/test',
        phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
      }
    ];
    const html = renderDashboard(plans, { assetsDir: '/tmp' });
    assert(html.includes('window.__plans'));
    assert(html.includes('"id":"p1"'));
  });

  it('should set plan count', () => {
    const plans = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`,
      name: `Plan ${i}`,
      status: 'pending',
      progress: 0,
      lastModified: '2025-12-11T10:00:00Z',
      path: `/plans/${i}`,
      phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
    }));
    const html = renderDashboard(plans, { assetsDir: '/tmp' });
    assert(html.includes('Showing <strong>5</strong>'));
  });

  it('should use inline template as fallback', () => {
    const plans = [
      {
        id: 'p1',
        name: 'Test',
        status: 'pending',
        progress: 0,
        lastModified: '2025-12-11T10:00:00Z',
        path: '/plans/test',
        phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
      }
    ];
    // Non-existent assetsDir forces fallback
    const html = renderDashboard(plans, { assetsDir: '/nonexistent/path' });
    assert(html.includes('<!DOCTYPE html'));
    assert(html.includes('Plans Dashboard'));
  });

  it('should set has-plans class when plans exist', () => {
    const plans = [
      {
        id: 'p1',
        name: 'Test',
        status: 'pending',
        progress: 0,
        lastModified: '2025-12-11T10:00:00Z',
        path: '/plans/test',
        phases: { completed: 0, inProgress: 0, pending: 1, total: 1 }
      }
    ];
    const html = renderDashboard(plans, { assetsDir: '/tmp' });
    assert(html.includes('plans-loaded'));
  });

  it('should not set has-plans class when no plans', () => {
    const html = renderDashboard([], { assetsDir: '/tmp' });
    assert(!html.includes('plans-loaded'));
  });
});

// Run tests
const tests = [
  'escapeHtml',
  'formatDate',
  'generateProgressRing',
  'generateProgressBar',
  'generateStatusCounts',
  'generatePlanCard',
  'generatePlansGrid',
  'generateEmptyState',
  'renderDashboard'
];

console.log('\n' + '='.repeat(60));
console.log('Dashboard Renderer Tests');
console.log('='.repeat(60));
