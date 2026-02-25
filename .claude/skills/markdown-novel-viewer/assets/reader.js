/**
 * Reader.js - Client-side interactivity for novel viewer
 * Handles theme toggle, font size, sidebar, and keyboard navigation
 */

(function() {
  'use strict';

  // DOM Elements
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const fontBtns = document.querySelectorAll('.font-btn');
  const hljsLight = document.getElementById('hljs-light');
  const hljsDark = document.getElementById('hljs-dark');
  const header = document.querySelector('.reader-header');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = progressBar?.querySelector('.progress-bar-fill');
  const shortcutsToast = document.getElementById('shortcuts-toast');
  const shortcutsOverlay = document.getElementById('shortcuts-overlay');

  // Storage keys (shared with kanban dashboard for theme persistence)
  const THEME_KEY = 'theme';
  const FONT_KEY = 'novel-viewer-font';
  const SIDEBAR_KEY = 'novel-viewer-sidebar';
  const TOAST_SHOWN_KEY = 'reader:shortcuts-toast-shown';

  // Scroll state
  let lastScrollY = 0;
  let scrollTicking = false;

  // Initialize theme
  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');

    setTheme(theme);
  }

  // Set theme
  function setTheme(theme, skipMermaid = false) {
    html.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);

    // Switch highlight.js theme
    if (hljsLight && hljsDark) {
      hljsLight.disabled = theme === 'dark';
      hljsDark.disabled = theme === 'light';
    }

    // Re-render mermaid diagrams with new theme (skip on initial load)
    if (!skipMermaid && window.mermaidModule) {
      updateMermaidTheme();
    }
  }

  // Toggle theme
  function toggleTheme() {
    const current = html.dataset.theme || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
  }

  // Initialize font size
  function initFontSize() {
    const stored = localStorage.getItem(FONT_KEY) || 'M';
    setFontSize(stored);
  }

  // Set font size
  function setFontSize(size) {
    html.dataset.fontSize = size;
    localStorage.setItem(FONT_KEY, size);

    // Update button states
    fontBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
  }

  // Initialize sidebar
  function initSidebar() {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
      sidebar?.classList.add('hidden');
    } else if (stored === 'hidden') {
      sidebar?.classList.add('hidden');
    }
  }

  // Toggle sidebar
  function toggleSidebar() {
    const isHidden = sidebar?.classList.toggle('hidden');
    localStorage.setItem(SIDEBAR_KEY, isHidden ? 'hidden' : 'visible');
  }

  // Show shortcuts toast (first visit)
  function showToast() {
    if (!shortcutsToast) return;

    const hasShown = localStorage.getItem(TOAST_SHOWN_KEY);
    if (hasShown) return;

    // Show toast after short delay
    setTimeout(() => {
      shortcutsToast.classList.add('show');

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissToast();
      }, 5000);
    }, 1000);
  }

  // Dismiss toast
  function dismissToast() {
    if (!shortcutsToast) return;
    shortcutsToast.classList.remove('show');
    localStorage.setItem(TOAST_SHOWN_KEY, 'true');
  }

  // Show shortcuts cheatsheet
  function showCheatsheet() {
    if (!shortcutsOverlay) return;
    shortcutsOverlay.removeAttribute('hidden');
    shortcutsOverlay.setAttribute('aria-hidden', 'false');
    // Focus trap
    const closeBtn = shortcutsOverlay.querySelector('.modal-close');
    closeBtn?.focus();
  }

  // Hide shortcuts cheatsheet
  function hideCheatsheet() {
    if (!shortcutsOverlay) return;
    shortcutsOverlay.setAttribute('hidden', '');
    shortcutsOverlay.setAttribute('aria-hidden', 'true');
  }

  // Initialize shortcuts
  function initShortcuts() {
    // Toast dismiss button
    const dismissBtn = shortcutsToast?.querySelector('.toast-dismiss');
    dismissBtn?.addEventListener('click', dismissToast);

    // Cheatsheet close button
    const closeBtn = shortcutsOverlay?.querySelector('.modal-close');
    closeBtn?.addEventListener('click', hideCheatsheet);

    // Backdrop click
    const backdrop = shortcutsOverlay?.querySelector('.shortcuts-backdrop');
    backdrop?.addEventListener('click', hideCheatsheet);

    // Show toast on first visit
    showToast();
  }

  // Keyboard navigation
  function handleKeydown(e) {
    // Skip if in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Close cheatsheet on Escape
    if (e.key === 'Escape' && shortcutsOverlay && !shortcutsOverlay.hasAttribute('hidden')) {
      e.preventDefault();
      hideCheatsheet();
      return;
    }

    // Close bottom sheet on Escape
    const bottomSheet = document.getElementById('bottom-sheet');
    if (e.key === 'Escape' && bottomSheet && bottomSheet.getAttribute('aria-hidden') === 'false') {
      e.preventDefault();
      if (window.closeBottomSheet) {
        window.closeBottomSheet();
      }
      return;
    }

    // Show cheatsheet on ?
    if (e.key === '?' && !e.shiftKey) {
      e.preventDefault();
      showCheatsheet();
      return;
    }

    const navPrev = document.querySelector('.nav-prev');
    const navNext = document.querySelector('.nav-next');

    switch (e.key) {
      case 'ArrowLeft':
        if (navPrev) {
          e.preventDefault();
          window.location.href = navPrev.href;
        }
        break;
      case 'ArrowRight':
        if (navNext) {
          e.preventDefault();
          window.location.href = navNext.href;
        }
        break;
      case 'Escape':
        if (window.innerWidth <= 900 && sidebar && !sidebar.classList.contains('hidden')) {
          toggleSidebar();
        }
        break;
      case 't':
      case 'T':
        if (!e.ctrlKey && !e.metaKey) {
          toggleTheme();
        }
        break;
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          toggleSidebar();
        }
        break;
    }
  }

  // Smooth scroll to anchor with sidebar active state update
  function handleAnchorClick(e) {
    const anchor = e.target.closest('a');
    const href = anchor?.getAttribute('href');
    if (href?.startsWith('#')) {
      e.preventDefault();
      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', href);
        // Update sidebar active state
        updateSidebarActiveState(targetId);
      }
    }
  }

  // Update sidebar active state based on anchor
  function updateSidebarActiveState(anchorId) {
    const planNav = document.getElementById('plan-nav');
    if (!planNav) return;

    // Remove active from all items
    planNav.querySelectorAll('.phase-item').forEach(item => {
      item.classList.remove('active');
    });

    // Add active to matching item
    const matchingItem = planNav.querySelector(`[data-anchor="${anchorId}"]`);
    if (matchingItem) {
      matchingItem.classList.add('active');
    }
  }

  // Setup Intersection Observer for section tracking
  function setupSectionObserver() {
    const planNav = document.getElementById('plan-nav');
    if (!planNav) return;

    // Get all anchors from sidebar
    const anchors = Array.from(planNav.querySelectorAll('[data-anchor]'))
      .map(item => item.dataset.anchor);

    if (anchors.length === 0) return;

    // Find corresponding elements in content
    const sections = anchors
      .map(id => document.getElementById(id))
      .filter(el => el !== null);

    if (sections.length === 0) return;

    // Create observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateSidebarActiveState(entry.target.id);
        }
      });
    }, {
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is in upper portion of viewport
      threshold: 0
    });

    // Observe all sections
    sections.forEach(section => observer.observe(section));
  }

  // Handle hash change (browser back/forward)
  function handleHashChange() {
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        updateSidebarActiveState(targetId);
      }
    }
  }

  // Throttle utility
  function throttle(func, wait) {
    let timeout;
    return function(...args) {
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          func.apply(this, args);
        }, wait);
      }
    };
  }

  // Update progress bar based on scroll position
  function updateProgressBar() {
    if (!progressFill) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    progressFill.style.width = `${Math.min(progress, 100)}%`;
  }

  // Handle scroll for progress bar and fixed header shadow
  function handleScroll() {
    if (!header) return;

    const currentScrollY = window.scrollY;

    // Add fixed shadow when scrolled past header
    if (currentScrollY > 60) {
      header.classList.add('is-fixed');
    } else {
      header.classList.remove('is-fixed');
    }

    lastScrollY = currentScrollY;

    // Update progress bar using requestAnimationFrame
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateProgressBar();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  // Initialize Mermaid diagrams
  async function initMermaid() {
    // Wait for mermaid module to load (imported in template.html)
    let attempts = 0;
    while (!window.mermaidModule && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.mermaidModule) {
      console.warn('Mermaid module not loaded');
      return;
    }

    const mermaid = window.mermaidModule;
    const isDark = html.dataset.theme === 'dark';

    // Initialize mermaid with theme
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif'
    });

    // Find unprocessed mermaid elements (both pre and div)
    const diagrams = document.querySelectorAll('.mermaid:not([data-processed="true"])');

    if (diagrams.length === 0) {
      return; // Nothing to render
    }

    // Store original source before mermaid replaces content (for theme switching)
    diagrams.forEach(el => {
      if (!el.dataset.mermaidSource) {
        el.dataset.mermaidSource = el.textContent;
      }
    });

    // Use mermaid.run() - the preferred API for v10+
    try {
      await mermaid.run({
        nodes: diagrams,
        suppressErrors: false
      });
    } catch (err) {
      console.error('Mermaid run error:', err);
      // Show errors inline for diagrams that failed
      diagrams.forEach(el => {
        if (!el.querySelector('svg') && !el.hasAttribute('data-processed')) {
          const code = el.dataset.mermaidSource || el.textContent;
          el.innerHTML = `<div class="mermaid-error">
            <strong>Mermaid Error:</strong>
            <pre>${err.message || err}</pre>
            <details><summary>Source</summary><pre>${code}</pre></details>
          </div>`;
          el.classList.add('mermaid-error-container');
        }
      });
    }
  }

  // Re-render mermaid on theme change
  async function updateMermaidTheme() {
    if (!window.mermaidModule) return;

    const isDark = html.dataset.theme === 'dark';

    // Re-initialize with new theme
    window.mermaidModule.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif'
    });

    // Restore original source and re-render
    const diagrams = document.querySelectorAll('.mermaid[data-processed="true"]');
    diagrams.forEach(el => {
      const source = el.dataset.mermaidSource;
      if (source) {
        el.textContent = source;
        el.removeAttribute('data-processed');
      }
    });

    await initMermaid();
    // Re-init expand buttons after re-render
    setTimeout(() => initMermaidExpand(), 100);
  }

  // Initialize Mermaid expand toggle buttons
  function initMermaidExpand() {
    // Find all rendered mermaid diagrams not already wrapped
    const diagrams = document.querySelectorAll('.mermaid[data-processed="true"]');

    diagrams.forEach(diagram => {
      // Skip if already wrapped
      if (diagram.parentElement?.classList.contains('mermaid-wrapper')) {
        return;
      }

      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-wrapper';

      // Create expand button
      const btn = document.createElement('button');
      btn.className = 'mermaid-expand-btn';
      btn.setAttribute('aria-label', 'Expand diagram to full width');
      btn.innerHTML = `
        <span class="icon-expand">⤢</span>
        <span class="icon-collapse">⤡</span>
      `;

      // Toggle handler
      btn.addEventListener('click', () => {
        const isExpanded = wrapper.classList.toggle('expanded');
        btn.setAttribute('aria-label', isExpanded
          ? 'Collapse diagram'
          : 'Expand diagram to full width'
        );
      });

      // Insert wrapper before diagram
      diagram.parentNode.insertBefore(wrapper, diagram);

      // Move diagram into wrapper
      wrapper.appendChild(diagram);

      // Add button to wrapper
      wrapper.appendChild(btn);
    });
  }

  // Initialize

  // Initialize accordion
  function initAccordion() {
    const phaseHeaders = document.querySelectorAll('.phase-header');
    if (phaseHeaders.length === 0) return;

    // Get plan identifier for localStorage key
    const planNav = document.getElementById('plan-nav');
    if (!planNav) return;
    const planName = planNav.querySelector('.plan-title span:last-child')?.textContent || 'unknown';
    const planId = planName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    phaseHeaders.forEach(header => {
      const phaseGroup = header.closest('.phase-group');
      if (!phaseGroup) return;

      const phaseId = phaseGroup.dataset.phaseId;
      const storageKey = `reader:accordion:${planId}:${phaseId}`;

      // Restore collapsed state from localStorage
      try {
        const collapsed = localStorage.getItem(storageKey);
        if (collapsed === 'true') {
          phaseGroup.classList.add('collapsed');
        }
      } catch (e) {
        // Graceful fallback if localStorage unavailable
      }

      // Toggle handler
      const toggleAccordion = () => {
        const isCollapsed = phaseGroup.classList.toggle('collapsed');

        // Persist state
        try {
          localStorage.setItem(storageKey, isCollapsed);
        } catch (e) {
          // Graceful fallback
        }
      };

      // Click handler
      header.addEventListener('click', toggleAccordion);

      // Keyboard accessibility
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion();
        }
      });
    });
  }

  // Initialize mobile navigation (FAB + bottom sheet)
  function initMobileNav() {
    const fabMenu = document.getElementById('fab-menu');
    const fabNext = document.querySelector('.nav-next-mobile');
    const fabPrev = document.querySelector('.nav-prev-mobile');
    const bottomSheet = document.getElementById('bottom-sheet');
    const bottomSheetContent = document.getElementById('bottom-sheet-content');
    const backdrop = bottomSheet?.querySelector('.bottom-sheet-backdrop');
    const handle = bottomSheet?.querySelector('.bottom-sheet-handle');
    const sidebar = document.getElementById('sidebar');

    if (!fabMenu || !bottomSheet) return;

    // Set FAB hrefs from footer navigation
    const navNext = document.querySelector('.nav-next');
    const navPrev = document.querySelector('.nav-prev');
    if (navNext && fabNext) {
      fabNext.href = navNext.href;
    }
    if (navPrev && fabPrev) {
      fabPrev.href = navPrev.href;
    }

    // Clone sidebar content to bottom sheet
    if (sidebar && bottomSheetContent) {
      bottomSheetContent.innerHTML = sidebar.innerHTML;
    }

    // Open bottom sheet
    function openBottomSheet() {
      bottomSheet.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    // Close bottom sheet
    function closeBottomSheet() {
      bottomSheet.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // FAB menu click handler
    fabMenu.addEventListener('click', openBottomSheet);

    // Backdrop click handler
    backdrop?.addEventListener('click', closeBottomSheet);

    // Swipe down gesture on handle
    let touchStartY = 0;
    let touchEndY = 0;

    handle?.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    handle?.addEventListener('touchmove', (e) => {
      touchEndY = e.touches[0].clientY;
    }, { passive: true });

    handle?.addEventListener('touchend', () => {
      const swipeDistance = touchEndY - touchStartY;
      // Swipe down threshold: 50px
      if (swipeDistance > 50) {
        closeBottomSheet();
      }
      touchStartY = 0;
      touchEndY = 0;
    });

    // Close on resize to desktop
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 768 && bottomSheet.getAttribute('aria-hidden') === 'false') {
          closeBottomSheet();
        }
      }, 100);
    });

    // Store close function for keyboard handler
    window.closeBottomSheet = closeBottomSheet;
  }

  // Sidebar resize functionality
  const SIDEBAR_WIDTH_KEY = 'novel-viewer-sidebar-width';
  const resizeHandle = document.getElementById('sidebar-resize');
  const mainContent = document.querySelector('.main-content');

  function initSidebarResize() {
    if (!resizeHandle || !sidebar) return;

    // Restore saved width
    const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= 200 && width <= 480) {
        sidebar.style.width = width + 'px';
        if (mainContent) mainContent.style.marginLeft = width + 'px';
      }
    }

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      resizeHandle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      const newWidth = Math.min(480, Math.max(200, startWidth + delta));
      sidebar.style.width = newWidth + 'px';
      if (mainContent) mainContent.style.marginLeft = newWidth + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      resizeHandle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebar.offsetWidth.toString());
    });
  }

  // Initialize
  function init() {
    initTheme();
    initFontSize();
    initSidebar();
    initSidebarResize();
    initAccordion();
    initShortcuts();
    initMobileNav();
    initMermaid().then(() => {
      // Initialize expand buttons after mermaid renders
      setTimeout(() => initMermaidExpand(), 100);
    });

    // Event listeners
    themeToggle?.addEventListener('click', toggleTheme);
    sidebarToggle?.addEventListener('click', toggleSidebar);

    fontBtns.forEach(btn => {
      btn.addEventListener('click', () => setFontSize(btn.dataset.size));
    });

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleAnchorClick);

    // Handle hash change for sidebar active state
    window.addEventListener('hashchange', handleHashChange);

    // Setup section observer for auto-highlighting sidebar
    setupSectionObserver();

    // Handle initial hash on page load
    if (window.location.hash) {
      handleHashChange();
    }

    // Initialize scroll state and handlers
    lastScrollY = window.scrollY;
    updateProgressBar();
    window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 900) {
          sidebar?.classList.remove('visible');
        }
      }, 100);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
