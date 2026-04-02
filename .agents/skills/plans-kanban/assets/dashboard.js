/**
 * Dashboard Controls
 * Client-side sorting, filtering, and search for plans dashboard
 */
(function() {
  'use strict';

  // State
  const state = {
    sort: 'date-desc',
    filter: 'all',
    search: '',
    view: 'kanban' // 'kanban' or 'grid'
  };

  // Status column config
  const STATUS_COLUMNS = [
    { id: 'pending', label: 'Pending', color: 'pending' },
    { id: 'in-progress', label: 'In Progress', color: 'in-progress' },
    { id: 'in-review', label: 'In Review', color: 'in-review' },
    { id: 'completed', label: 'Done', color: 'completed' },
    { id: 'cancelled', label: 'Cancelled', color: 'cancelled' }
  ];

  // Elements
  let allPlans = [];
  let grid = null;
  let kanbanBoard = null;
  let resultCount = null;
  let emptyState = null;
  let srAnnounce = null;

  /**
   * Initialize dashboard
   */
  function init() {
    allPlans = window.__plans || [];
    grid = document.querySelector('.plans-grid');
    kanbanBoard = document.querySelector('.kanban-board');
    resultCount = document.querySelector('.result-count');
    emptyState = document.querySelector('.empty-state');
    srAnnounce = document.getElementById('sr-announce');

    // Mark as loaded
    document.body.classList.add('plans-loaded');

    // Show empty state if no plans
    if (!allPlans.length) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    // Parse URL state
    parseURL();

    // Bind events
    bindEvents();

    // Initial render
    applyFiltersAndSort();

    // Setup keyboard navigation
    setupKeyboardNav();

    // Setup theme toggle
    setupThemeToggle();

    // Setup view toggle
    setupViewToggle();
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('plan-search');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.search = e.target.value.toLowerCase().trim();
          applyFiltersAndSort();
        }, 300);
      });

      // Clear search on Escape
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          state.search = '';
          applyFiltersAndSort();
        }
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.filter-pill').forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');

        state.filter = pill.dataset.filter;
        applyFiltersAndSort();
      });
    });

    // Card click to navigate
    grid?.addEventListener('click', (e) => {
      const card = e.target.closest('.plan-card');
      if (card && !e.target.closest('.view-btn')) {
        const link = card.querySelector('.view-btn');
        if (link) link.click();
      }
    });
  }

  /**
   * Apply filters and sorting
   */
  function applyFiltersAndSort() {
    let filtered = allPlans.slice();

    // Filter by status
    if (state.filter !== 'all') {
      filtered = filtered.filter(p => p.status === state.filter);
    }

    // Filter by search
    if (state.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(state.search) ||
        p.id.toLowerCase().includes(state.search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (state.sort) {
        case 'date-desc':
          return new Date(b.lastModified) - new Date(a.lastModified);
        case 'date-asc':
          return new Date(a.lastModified) - new Date(b.lastModified);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'progress-desc':
          return b.progress - a.progress;
        case 'progress-asc':
          return a.progress - b.progress;
        default:
          return 0;
      }
    });

    renderGrid(filtered);

    // Also update kanban if in kanban view
    if (state.view === 'kanban') {
      renderKanbanBoard(allPlans); // Kanban uses all plans grouped by status
    }

    updateURL();
    announce(`Showing ${filtered.length} plan${filtered.length !== 1 ? 's' : ''}`);
  }

  /**
   * Render grid with filtered plans
   */
  function renderGrid(plans) {
    const visibleIds = new Set(plans.map(p => p.id));

    // Hide/show cards and set order
    document.querySelectorAll('.plan-card').forEach(card => {
      const id = card.dataset.id;
      const isVisible = visibleIds.has(id);
      card.style.display = isVisible ? '' : 'none';

      if (isVisible) {
        const index = plans.findIndex(p => p.id === id);
        card.style.order = index;
      }
    });

    // Update count
    if (resultCount) {
      resultCount.innerHTML = `Showing <strong>${plans.length}</strong> plan${plans.length !== 1 ? 's' : ''}`;
    }

    // Show/hide empty state
    if (emptyState) {
      emptyState.hidden = plans.length > 0;
    }
  }

  /**
   * Parse URL parameters
   */
  function parseURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('sort')) {
      state.sort = params.get('sort');
    }
    if (params.has('filter')) {
      state.filter = params.get('filter');
    }
    if (params.has('q')) {
      state.search = params.get('q');
    }

    // Update controls to match state
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = state.sort;

    const searchInput = document.getElementById('plan-search');
    if (searchInput) searchInput.value = state.search;

    document.querySelectorAll('.filter-pill').forEach(p => {
      const isActive = p.dataset.filter === state.filter;
      p.classList.toggle('active', isActive);
      p.setAttribute('aria-pressed', String(isActive));
    });
  }

  /**
   * Update URL with current state
   */
  function updateURL() {
    const params = new URLSearchParams();

    if (state.sort !== 'date-desc') params.set('sort', state.sort);
    if (state.filter !== 'all') params.set('filter', state.filter);
    if (state.search) params.set('q', state.search);

    const url = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;

    history.replaceState(null, '', url);
  }

  /**
   * Announce message to screen readers
   */
  function announce(message) {
    if (!srAnnounce) return;
    srAnnounce.textContent = '';
    // Force reflow
    void srAnnounce.offsetHeight;
    srAnnounce.textContent = message;
  }

  /**
   * Setup keyboard navigation for cards
   */
  function setupKeyboardNav() {
    grid?.addEventListener('keydown', (e) => {
      const cards = [...document.querySelectorAll('.plan-card:not([style*="display: none"])')];
      const current = document.activeElement;
      const index = cards.indexOf(current);

      if (index === -1) return;

      let next;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          next = cards[index + 1] || cards[0];
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          next = cards[index - 1] || cards[cards.length - 1];
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const link = current.querySelector('.view-btn');
          if (link) link.click();
          break;
        case 'Home':
          e.preventDefault();
          next = cards[0];
          break;
        case 'End':
          e.preventDefault();
          next = cards[cards.length - 1];
          break;
      }

      if (next) next.focus();
    });
  }

  /**
   * Setup theme toggle
   */
  function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Check saved preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      announce(`Theme changed to ${next} mode`);
    });
  }

  /**
   * Setup view toggle (Kanban/Grid)
   */
  function setupViewToggle() {
    const toggleBtns = document.querySelectorAll('.view-toggle-btn');
    if (!toggleBtns.length) return;

    // Restore saved view preference
    const savedView = localStorage.getItem('dashboard-view') || 'kanban';
    state.view = savedView;
    updateViewMode();

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view === state.view) return;

        state.view = view;
        localStorage.setItem('dashboard-view', view);
        updateViewMode();
        announce(`Switched to ${view} view`);
      });
    });
  }

  /**
   * Update view mode (toggle between kanban and grid)
   */
  function updateViewMode() {
    const body = document.body;

    // Update toggle buttons
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      const isActive = btn.dataset.view === state.view;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Toggle view classes
    if (state.view === 'grid') {
      body.classList.add('view-mode-grid');
    } else {
      body.classList.remove('view-mode-grid');
    }

    // Re-render kanban when switching to kanban view
    if (state.view === 'kanban') {
      renderKanbanBoard(getFilteredPlans());
    }
  }

  /**
   * Get filtered and sorted plans
   */
  function getFilteredPlans() {
    let filtered = allPlans.slice();

    // Filter by status (only for grid view, kanban shows all columns)
    if (state.filter !== 'all' && state.view === 'grid') {
      filtered = filtered.filter(p => p.status === state.filter);
    }

    // Filter by search
    if (state.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(state.search) ||
        p.id.toLowerCase().includes(state.search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (state.sort) {
        case 'date-desc':
          return new Date(b.lastModified) - new Date(a.lastModified);
        case 'date-asc':
          return new Date(a.lastModified) - new Date(b.lastModified);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'progress-desc':
          return b.progress - a.progress;
        case 'progress-asc':
          return a.progress - b.progress;
        default:
          return 0;
      }
    });

    return filtered;
  }

  /**
   * Render kanban board with plans grouped by status
   */
  function renderKanbanBoard(plans) {
    if (!kanbanBoard) return;

    // Group plans by status
    const grouped = {};
    STATUS_COLUMNS.forEach(col => {
      grouped[col.id] = [];
    });

    // Apply search filter for kanban
    let filteredPlans = plans;
    if (state.search) {
      filteredPlans = plans.filter(p =>
        p.name.toLowerCase().includes(state.search) ||
        p.id.toLowerCase().includes(state.search)
      );
    }

    filteredPlans.forEach(plan => {
      const status = plan.status || 'pending';
      if (grouped[status]) {
        grouped[status].push(plan);
      } else {
        grouped['pending'].push(plan);
      }
    });

    // Generate column HTML
    const columnsHtml = STATUS_COLUMNS.map(col => {
      const columnPlans = grouped[col.id];
      const cardsHtml = columnPlans.length > 0
        ? columnPlans.map(plan => renderKanbanCard(plan)).join('')
        : `<div class="kanban-empty">
            <svg class="kanban-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h6M9 13h6M9 17h4"/>
            </svg>
            <span>No plans</span>
          </div>`;

      return `
        <div class="kanban-column" data-status="${col.id}">
          <div class="kanban-column-header">
            <div class="kanban-column-title">
              <span class="kanban-status-dot ${col.color}"></span>
              <span>${col.label}</span>
            </div>
            <span class="kanban-column-count">${columnPlans.length}</span>
          </div>
          <div class="kanban-cards">
            ${cardsHtml}
          </div>
        </div>
      `;
    }).join('');

    kanbanBoard.innerHTML = columnsHtml;
  }

  /**
   * Render a single kanban card (enhanced with details)
   */
  function renderKanbanCard(plan) {
    const progressPct = Math.round(plan.progress || 0);
    const dateStr = formatDate(plan.lastModified);

    // Priority badge
    let priorityHtml = '';
    if (plan.priority) {
      const p = String(plan.priority).toUpperCase();
      let priorityClass = '';
      if (p === 'P1' || p === 'HIGH' || p === 'CRITICAL') priorityClass = 'priority-high';
      else if (p === 'P2' || p === 'MEDIUM' || p === 'NORMAL') priorityClass = 'priority-medium';
      else if (p === 'P3' || p === 'LOW') priorityClass = 'priority-low';
      if (priorityClass) {
        priorityHtml = `<span class="kanban-card-priority ${priorityClass}">${escapeHtml(plan.priority)}</span>`;
      }
    }

    // Description (truncated)
    let descriptionHtml = '';
    if (plan.description) {
      const desc = plan.description.length > 80 ? plan.description.slice(0, 77) + '...' : plan.description;
      descriptionHtml = `<p class="kanban-card-description">${escapeHtml(desc)}</p>`;
    }

    // Tags (max 3 visible)
    let tagsHtml = '';
    if (plan.tags && Array.isArray(plan.tags) && plan.tags.length > 0) {
      const visibleTags = plan.tags.slice(0, 3);
      const hiddenCount = plan.tags.length - 3;
      tagsHtml = '<div class="kanban-card-tags">';
      tagsHtml += visibleTags.map(tag => `<span class="kanban-card-tag">${escapeHtml(tag)}</span>`).join('');
      if (hiddenCount > 0) {
        tagsHtml += `<span class="kanban-card-tag tag-more">+${hiddenCount}</span>`;
      }
      tagsHtml += '</div>';
    }

    // Footer with effort and phases
    let footerHtml = '';
    const effortHtml = plan.totalEffortFormatted
      ? `<span class="kanban-card-effort"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escapeHtml(plan.totalEffortFormatted)}</span>`
      : '';
    const phasesHtml = plan.phasesTotal
      ? `<span class="kanban-card-phases">${plan.phasesTotal} phases</span>`
      : '';
    if (effortHtml || phasesHtml) {
      footerHtml = `<div class="kanban-card-footer">${effortHtml}${phasesHtml}</div>`;
    }

    return `
      <a href="/view?file=${encodeURIComponent(plan.path)}" class="kanban-card" data-id="${plan.id}">
        <div class="kanban-card-header">
          <h4 class="kanban-card-title">${escapeHtml(plan.name)}</h4>
          ${priorityHtml}
        </div>
        ${descriptionHtml}
        <div class="kanban-card-meta">
          <div class="kanban-card-progress">
            <div class="kanban-card-progress-bar">
              <div class="kanban-card-progress-fill" style="width: ${progressPct}%"></div>
            </div>
            <span>${progressPct}%</span>
          </div>
          <span class="kanban-card-date">${dateStr}</span>
        </div>
        ${tagsHtml}
        ${footerHtml}
      </a>
    `;
  }

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
