#!/usr/bin/env node
/**
 * Take a screenshot
 * Usage: node screenshot.js --output screenshot.png [--url https://example.com] [--full-page true] [--selector .element] [--max-size 5] [--no-compress]
 * Supports both CSS and XPath selectors:
 *   - CSS: node screenshot.js --selector ".main-content" --output page.png
 *   - XPath: node screenshot.js --selector "//div[@class='main-content']" --output page.png
 *
 * Session behavior:
 *   By default, browser stays running for session persistence
 *   Use --close true to fully close browser
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';
import { parseSelector, getElement, enhanceError } from './lib/selector.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Check if Sharp is available
 */
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  // Sharp not installed, compression disabled
}

/**
 * Compress image using Sharp if it exceeds max size
 * Sharp is 4-5x faster than ImageMagick with lower memory usage
 * Falls back to no compression if Sharp is not installed
 * @param {string} filePath - Path to the image file
 * @param {number} maxSizeMB - Maximum file size in MB (default: 5)
 * @returns {Promise<{compressed: boolean, originalSize: number, finalSize: number}>}
 */
async function compressImageIfNeeded(filePath, maxSizeMB = 5) {
  const stats = await fs.stat(filePath);
  const originalSize = stats.size;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (originalSize <= maxSizeBytes) {
    return { compressed: false, originalSize, finalSize: originalSize };
  }

  if (!sharp) {
    console.error('Warning: Sharp not installed. Run npm install to enable automatic compression.');
    return { compressed: false, originalSize, finalSize: originalSize };
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const imageBuffer = await fs.readFile(filePath);
    const metadata = await sharp(imageBuffer).metadata();

    // First pass: moderate compression
    let outputBuffer;
    if (ext === '.png') {
      // PNG: resize to 90% and compress
      const newWidth = Math.round(metadata.width * 0.9);
      outputBuffer = await sharp(imageBuffer)
        .resize(newWidth)
        .png({ quality: 85, compressionLevel: 9 })
        .toBuffer();
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG: quality 80 with progressive encoding
      outputBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toBuffer();
    } else if (ext === '.webp') {
      // WebP: quality 80
      outputBuffer = await sharp(imageBuffer)
        .webp({ quality: 80 })
        .toBuffer();
    } else {
      // Other formats: convert to JPEG
      outputBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    // Second pass: aggressive compression if still too large
    if (outputBuffer.length > maxSizeBytes) {
      if (ext === '.png') {
        const newWidth = Math.round(metadata.width * 0.75);
        outputBuffer = await sharp(outputBuffer)
          .resize(newWidth)
          .png({ quality: 70, compressionLevel: 9 })
          .toBuffer();
      } else {
        outputBuffer = await sharp(outputBuffer)
          .jpeg({ quality: 60, progressive: true, mozjpeg: true })
          .toBuffer();
      }
    }

    // Write compressed image back to file
    await fs.writeFile(filePath, outputBuffer);

    return { compressed: true, originalSize, finalSize: outputBuffer.length };
  } catch (error) {
    console.error('Compression error:', error.message);
    return { compressed: false, originalSize, finalSize: originalSize };
  }
}

async function screenshot() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.output) {
    outputError(new Error('--output is required'));
    return;
  }

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

    // Ensure output directory exists
    const outputDir = path.dirname(path.resolve(args.output));
    await fs.mkdir(outputDir, { recursive: true });

    const screenshotOptions = {
      path: args.output,
      type: args.format || 'png',
      fullPage: args['full-page'] === 'true'
    };

    if (args.quality) {
      screenshotOptions.quality = parseInt(args.quality);
    }

    let buffer;
    if (args.selector) {
      // Parse and validate selector
      const parsed = parseSelector(args.selector);

      // Get element based on selector type
      const element = await getElement(page, parsed);
      if (!element) {
        throw new Error(`Element not found: ${args.selector}`);
      }
      buffer = await element.screenshot(screenshotOptions);
    } else {
      buffer = await page.screenshot(screenshotOptions);
    }

    const result = {
      success: true,
      output: path.resolve(args.output),
      size: buffer.length,
      url: page.url()
    };

    // Compress image if needed (unless --no-compress flag is set)
    if (args['no-compress'] !== 'true') {
      const maxSize = args['max-size'] ? parseFloat(args['max-size']) : 5;
      const compressionResult = await compressImageIfNeeded(args.output, maxSize);

      if (compressionResult.compressed) {
        result.compressed = true;
        result.originalSize = compressionResult.originalSize;
        result.size = compressionResult.finalSize;
        result.compressionRatio = ((1 - compressionResult.finalSize / compressionResult.originalSize) * 100).toFixed(2) + '%';
      }
    }

    outputJSON(result);

    // Default: disconnect to keep browser running for session persistence
    // Use --close true to fully close browser
    if (args.close === 'true') {
      await closeBrowser();
    } else {
      await disconnectBrowser();
    }
    process.exit(0);
  } catch (error) {
    // Enhance error message if selector-related
    if (args.selector) {
      const enhanced = enhanceError(error, args.selector);
      outputError(enhanced);
    } else {
      outputError(error);
    }
    process.exit(1);
  }
}

screenshot();
