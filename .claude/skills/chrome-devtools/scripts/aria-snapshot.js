#!/usr/bin/env node
/**
 * Get ARIA-based accessibility snapshot with stable element refs
 * Usage: node aria-snapshot.js [--url https://example.com] [--output snapshot.yaml]
 *
 * Returns YAML-formatted accessibility tree with:
 * - Semantic roles (button, link, textbox, heading, etc.)
 * - Accessible names (what screen readers announce)
 * - Element states (checked, disabled, expanded)
 * - Stable refs [ref=eN] that persist for interaction
 *
 * Session behavior:
 *   By default, browser stays running for session persistence
 *   Use --close true to fully close browser
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Get ARIA snapshot script to inject into page
 * Builds YAML-formatted accessibility tree with element references
 */
function getAriaSnapshotScript() {
  return `
(function() {
  // Store refs on window for later retrieval via selectRef
  window.__chromeDevToolsRefs = window.__chromeDevToolsRefs || new Map();
  let refCounter = window.__chromeDevToolsRefCounter || 1;

  // ARIA roles we care about for interaction
  const INTERACTIVE_ROLES = new Set([
    'button', 'link', 'textbox', 'checkbox', 'radio', 'combobox',
    'listbox', 'option', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'tab', 'switch', 'slider', 'spinbutton', 'searchbox', 'tree', 'treeitem',
    'grid', 'gridcell', 'row', 'rowheader', 'columnheader'
  ]);

  // Landmark roles for structure
  const LANDMARK_ROLES = new Set([
    'banner', 'navigation', 'main', 'complementary', 'contentinfo',
    'search', 'form', 'region', 'article', 'dialog', 'alertdialog'
  ]);

  // Implicit ARIA roles from HTML elements
  const IMPLICIT_ROLES = {
    'A': (el) => el.href ? 'link' : null,
    'BUTTON': () => 'button',
    'INPUT': (el) => {
      const type = el.type?.toLowerCase();
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'submit' || type === 'button' || type === 'reset') return 'button';
      if (type === 'search') return 'searchbox';
      if (type === 'range') return 'slider';
      if (type === 'number') return 'spinbutton';
      return 'textbox';
    },
    'TEXTAREA': () => 'textbox',
    'SELECT': () => 'combobox',
    'OPTION': () => 'option',
    'IMG': () => 'img',
    'NAV': () => 'navigation',
    'MAIN': () => 'main',
    'HEADER': () => 'banner',
    'FOOTER': () => 'contentinfo',
    'ASIDE': () => 'complementary',
    'ARTICLE': () => 'article',
    'SECTION': (el) => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') ? 'region' : null,
    'FORM': () => 'form',
    'UL': () => 'list',
    'OL': () => 'list',
    'LI': () => 'listitem',
    'H1': () => 'heading',
    'H2': () => 'heading',
    'H3': () => 'heading',
    'H4': () => 'heading',
    'H5': () => 'heading',
    'H6': () => 'heading',
    'TABLE': () => 'table',
    'TR': () => 'row',
    'TH': () => 'columnheader',
    'TD': () => 'cell',
    'DIALOG': () => 'dialog'
  };

  function getRole(el) {
    // Explicit role takes precedence
    const explicitRole = el.getAttribute('role');
    if (explicitRole) return explicitRole;

    // Check implicit role
    const implicitFn = IMPLICIT_ROLES[el.tagName];
    if (implicitFn) return implicitFn(el);

    return null;
  }

  function getAccessibleName(el) {
    // aria-label takes precedence
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    // aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labels = labelledBy.split(' ')
        .map(id => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(' ');
      if (labels) return labels;
    }

    // Input associated label
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      if (el.id) {
        const label = document.querySelector('label[for="' + el.id + '"]');
        if (label) return label.textContent?.trim();
      }
      // Check parent label
      const parentLabel = el.closest('label');
      if (parentLabel) {
        const labelText = parentLabel.textContent?.replace(el.value || '', '')?.trim();
        if (labelText) return labelText;
      }
    }

    // Button/link content
    if (el.tagName === 'BUTTON' || el.tagName === 'A') {
      const text = el.textContent?.trim();
      if (text) return text.substring(0, 100);
    }

    // Alt text for images
    if (el.tagName === 'IMG') {
      return el.alt || null;
    }

    // Title attribute fallback
    if (el.title) return el.title.trim();

    // Placeholder for inputs
    if (el.placeholder) return null; // Return null, will add as /placeholder

    return null;
  }

  function getStateFlags(el) {
    const flags = [];

    // Checked state
    if (el.checked || el.getAttribute('aria-checked') === 'true') {
      flags.push('checked');
    }

    // Disabled state
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
      flags.push('disabled');
    }

    // Expanded state
    if (el.getAttribute('aria-expanded') === 'true') {
      flags.push('expanded');
    }

    // Selected state
    if (el.selected || el.getAttribute('aria-selected') === 'true') {
      flags.push('selected');
    }

    // Pressed state
    if (el.getAttribute('aria-pressed') === 'true') {
      flags.push('pressed');
    }

    // Required state
    if (el.required || el.getAttribute('aria-required') === 'true') {
      flags.push('required');
    }

    return flags;
  }

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isInteractiveOrLandmark(role) {
    return INTERACTIVE_ROLES.has(role) || LANDMARK_ROLES.has(role);
  }

  function shouldInclude(el) {
    if (!isVisible(el)) return false;
    const role = getRole(el);
    if (!role) return false;
    // Include interactive, landmarks, and structural elements
    return isInteractiveOrLandmark(role) ||
           role === 'heading' ||
           role === 'img' ||
           role === 'list' ||
           role === 'listitem' ||
           role === 'table' ||
           role === 'row' ||
           role === 'cell' ||
           role === 'columnheader';
  }

  function assignRef(el, role) {
    // Only assign refs to interactive elements
    if (!INTERACTIVE_ROLES.has(role)) return null;

    const ref = 'e' + refCounter++;
    window.__chromeDevToolsRefs.set(ref, el);
    return ref;
  }

  function buildYaml(el, indent = 0) {
    const role = getRole(el);
    if (!role) return '';

    const prefix = '  '.repeat(indent) + '- ';
    const lines = [];

    // Build the line: role "name" [flags] [ref=eN]
    let line = prefix + role;

    const name = getAccessibleName(el);
    if (name) {
      line += ' "' + name.replace(/"/g, '\\\\"') + '"';
    }

    // Add heading level
    if (role === 'heading') {
      const level = el.tagName.match(/H(\\d)/)?.[1] || el.getAttribute('aria-level');
      if (level) line += ' [level=' + level + ']';
    }

    // Add state flags
    const flags = getStateFlags(el);
    flags.forEach(flag => {
      line += ' [' + flag + ']';
    });

    // Add ref for interactive elements
    const ref = assignRef(el, role);
    if (ref) {
      line += ' [ref=' + ref + ']';
    }

    lines.push(line);

    // Add metadata on subsequent lines
    if (el.tagName === 'A' && el.href) {
      lines.push('  '.repeat(indent + 1) + '/url: ' + el.href);
    }
    if (el.placeholder) {
      lines.push('  '.repeat(indent + 1) + '/placeholder: "' + el.placeholder + '"');
    }
    if (el.tagName === 'INPUT' && el.value && el.type !== 'password') {
      lines.push('  '.repeat(indent + 1) + '/value: "' + el.value.substring(0, 50) + '"');
    }

    // Process children
    const children = Array.from(el.children);
    children.forEach(child => {
      const childYaml = buildYaml(child, indent + 1);
      if (childYaml) lines.push(childYaml);
    });

    return lines.join('\\n');
  }

  function getSnapshot() {
    const lines = [];

    // Start from body
    const children = Array.from(document.body.children);
    children.forEach(child => {
      const yaml = buildYaml(child, 0);
      if (yaml) lines.push(yaml);
    });

    // Save ref counter for next snapshot
    window.__chromeDevToolsRefCounter = refCounter;

    return lines.join('\\n');
  }

  return getSnapshot();
})();
`;
}

async function ariaSnapshot() {
  const args = parseArgs(process.argv.slice(2));

  try {
    const browser = await getBrowser({
      headless: args.headless
    });

    const page = await getPage(browser);

    // Navigate if URL provided
    if (args.url) {
      await page.goto(args.url, {
        waitUntil: args['wait-until'] || 'networkidle2'
      });
    }

    // Get ARIA snapshot
    const snapshot = await page.evaluate(getAriaSnapshotScript());

    // Build result
    const result = {
      success: true,
      url: page.url(),
      title: await page.title(),
      format: 'yaml',
      snapshot: snapshot
    };

    // Output to file or stdout
    if (args.output) {
      const outputPath = args.output;

      // Ensure snapshots directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write YAML snapshot
      await fs.writeFile(outputPath, snapshot, 'utf8');

      outputJSON({
        success: true,
        output: path.resolve(outputPath),
        url: page.url()
      });
    } else {
      // Output to stdout
      outputJSON(result);
    }

    // Default: disconnect to keep browser running for session persistence
    // Use --close true to fully close browser
    if (args.close === 'true') {
      await closeBrowser();
    } else {
      await disconnectBrowser();
    }
    process.exit(0);
  } catch (error) {
    outputError(error);
  }
}

ariaSnapshot();
