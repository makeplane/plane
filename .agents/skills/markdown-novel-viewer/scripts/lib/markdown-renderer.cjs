/**
 * Markdown rendering engine with syntax highlighting and image resolution
 * Converts markdown to styled HTML for novel-reader UI
 */

const fs = require('fs');
const path = require('path');

// Lazy load dependencies
let marked = null;
let hljs = null;
let matter = null;

/**
 * Escape HTML entities to prevent XSS in mermaid content
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize markdown dependencies
 */
function initDependencies() {
  if (!marked) {
    const { Marked } = require('marked');
    hljs = require('highlight.js');

    marked = new Marked({
      gfm: true,
      breaks: true
    });

    // Custom extension for code blocks (handles mermaid specially)
    // marked v17+ requires extensions array for custom token handling
    const mermaidExtension = {
      name: 'mermaidCodeBlock',
      level: 'block',
      renderer(token) {
        // This is called for code tokens
        if (token.type === 'code') {
          const code = token.text || '';
          const language = token.lang || '';

          // Handle mermaid code blocks - render as div for client-side processing
          if (language === 'mermaid') {
            return `<pre class="mermaid">${escapeHtml(code)}</pre>`;
          }

          // Regular code blocks with syntax highlighting
          if (language && hljs.getLanguage(language)) {
            try {
              const highlighted = hljs.highlight(code, { language }).value;
              return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
            } catch {
              // Fall through to default
            }
          }

          // Auto-detect language or plain text
          const highlighted = hljs.highlightAuto(code).value;
          return `<pre><code class="hljs">${highlighted}</code></pre>`;
        }
        return false; // Use default renderer for other tokens
      }
    };

    // Use the renderer override approach for marked v17+
    marked.use({
      renderer: {
        code(token) {
          const code = typeof token === 'string' ? token : (token.text || '');
          const language = typeof token === 'string' ? '' : (token.lang || '');

          // Handle mermaid code blocks - render as div for client-side processing
          if (language === 'mermaid') {
            return `<pre class="mermaid">${escapeHtml(code)}</pre>`;
          }

          // Regular code blocks with syntax highlighting
          if (language && hljs.getLanguage(language)) {
            try {
              const highlighted = hljs.highlight(code, { language }).value;
              return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
            } catch {
              // Fall through to default
            }
          }

          // Auto-detect language or plain text
          const highlighted = hljs.highlightAuto(code).value;
          return `<pre><code class="hljs">${highlighted}</code></pre>`;
        }
      }
    });

    matter = require('gray-matter');
  }
}

/**
 * Resolve a single image source path to /file/ route
 * @param {string} src - Image source path
 * @param {string} basePath - Base directory path
 * @returns {string} - Resolved path or original if absolute URL
 */
function resolveImageSrc(src, basePath) {
  // Skip absolute URLs
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/file')) {
    return src;
  }
  // Resolve relative path to absolute /file/ route
  // Use URL encoding to handle special chars and Windows paths (D:\...)
  const absolutePath = path.resolve(basePath, src);
  return `/file/${encodeURIComponent(absolutePath)}`;
}

/**
 * Resolve relative image paths to /file/ routes
 * Supports both inline and reference-style markdown images
 * @param {string} markdown - Markdown content
 * @param {string} basePath - Base directory path
 * @returns {string} - Markdown with resolved image paths
 */
function resolveImages(markdown, basePath) {
  let result = markdown;

  // 1. Handle inline images: ![alt](src) or ![alt](src "title")
  const inlineImgRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  result = result.replace(inlineImgRegex, (match, alt, src) => {
    const resolvedSrc = resolveImageSrc(src, basePath);
    return `![${alt}](${resolvedSrc})`;
  });

  // 2. Handle reference-style image definitions: [label]: src or [label]: src "title"
  // These appear at the end of the document like: [Step 1 Initial]: ./screenshots/step1.png
  const refDefRegex = /^\[([^\]]+)\]:\s*(\S+)(?:\s+"[^"]*")?$/gm;
  result = result.replace(refDefRegex, (match, label, src) => {
    const resolvedSrc = resolveImageSrc(src, basePath);
    return `[${label}]: ${resolvedSrc}`;
  });

  return result;
}

/**
 * Generate table of contents from headings
 * @param {string} html - Rendered HTML
 * @returns {Array<{level: number, id: string, text: string}>} - TOC items
 */
function generateTOC(html) {
  const headings = [];
  // Match h1-h3 with id attribute
  const regex = /<h([1-3])[^>]*id="([^"]+)"[^>]*>([^<]+)<\/h\1>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3].trim()
    });
  }

  return headings;
}

/**
 * Generate a slug from text for use as anchor ID (matches plan-navigator.cjs)
 * @param {string} text - Text to slugify
 * @returns {string} - URL-safe slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Add IDs to headings for anchor links
 * Also adds phase-specific IDs for inline phases in plan.md
 * @param {string} html - Rendered HTML
 * @returns {string} - HTML with heading IDs
 */
function addHeadingIds(html) {
  const usedIds = new Set();

  return html.replace(/<h([1-6])>([^<]+)<\/h\1>/gi, (match, level, text) => {
    // Check if this is a phase heading (e.g., "Phase 01: Name" or contains phase table row content)
    const phaseMatch = text.match(/^Phase\s*(\d+)[:\s]+(.+)/i);

    let id;
    if (phaseMatch) {
      // Generate phase-specific anchor ID that matches plan-navigator.cjs format
      const phaseNum = parseInt(phaseMatch[1], 10);
      const phaseName = phaseMatch[2].trim();
      id = `phase-${String(phaseNum).padStart(2, '0')}-${slugify(phaseName)}`;
    } else {
      // Standard heading ID generation
      id = slugify(text);
    }

    // Handle duplicate IDs
    let uniqueId = id;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }
    usedIds.add(uniqueId);

    return `<h${level} id="${uniqueId}">${text}</h${level}>`;
  });
}

/**
 * Add anchor IDs to phase table rows
 * Matches table rows with phase numbers: | 01 | Description | Status |
 * @param {string} html - Rendered HTML
 * @returns {string} - HTML with phase anchor IDs in table rows
 */
function addPhaseTableAnchors(html) {
  const usedIds = new Set();

  // Match table rows with phase pattern: <tr><td>01</td><td>Description</td>...
  // This handles the "Phase Summary" table format
  return html.replace(/<tr>\s*<td>(\d{2})<\/td>\s*<td>([^<]+)<\/td>/gi, (match, phaseNum, description) => {
    const num = parseInt(phaseNum, 10);
    const slug = slugify(description.trim());
    const id = `phase-${String(num).padStart(2, '0')}-${slug}`;

    // Handle duplicates
    let uniqueId = id;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }
    usedIds.add(uniqueId);

    // Add anchor span at the start of the row
    return `<tr id="${uniqueId}"><td>${phaseNum}</td><td>${description}</td>`;
  });
}

/**
 * Parse frontmatter from markdown
 * @param {string} content - Raw markdown content
 * @returns {{data: Object, content: string}} - Parsed frontmatter and content
 */
function parseFrontmatter(content) {
  initDependencies();
  return matter(content);
}

/**
 * Render markdown file to HTML
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Render options
 * @returns {{html: string, toc: Array, frontmatter: Object, title: string}}
 */
function renderMarkdownFile(filePath, options = {}) {
  initDependencies();

  const rawContent = fs.readFileSync(filePath, 'utf8');
  const basePath = path.dirname(filePath);

  // Parse frontmatter
  const { data: frontmatter, content } = parseFrontmatter(rawContent);

  // Resolve image paths
  const resolvedContent = resolveImages(content, basePath);

  // Render markdown to HTML
  let html = marked.parse(resolvedContent);

  // Add IDs to headings
  html = addHeadingIds(html);

  // Add anchor IDs to phase table rows (for inline phases in plan.md)
  html = addPhaseTableAnchors(html);

  // Generate TOC
  const toc = generateTOC(html);

  // Extract title from frontmatter or first h1
  let title = frontmatter.title;
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    title = h1Match ? h1Match[1] : path.basename(filePath, '.md');
  }

  return {
    html,
    toc,
    frontmatter,
    title
  };
}

/**
 * Render TOC as HTML sidebar
 * @param {Array} toc - TOC items
 * @returns {string} - HTML string
 */
function renderTOCHtml(toc) {
  if (!toc.length) return '';

  const items = toc.map(({ level, id, text }) => {
    const indent = (level - 1) * 12;
    return `<li style="padding-left: ${indent}px"><a href="#${id}">${text}</a></li>`;
  }).join('\n');

  return `<ul class="toc-list">${items}</ul>`;
}

module.exports = {
  renderMarkdownFile,
  resolveImages,
  resolveImageSrc,
  generateTOC,
  addHeadingIds,
  addPhaseTableAnchors,
  parseFrontmatter,
  renderTOCHtml,
  initDependencies
};
