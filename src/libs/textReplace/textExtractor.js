/**
 * Text extraction utilities for Replace Text mode
 * Extracts text items from PDF pages using PDF.js and merges into editable lines
 */

import { measureTextWidth } from './widthMeasurement.js';

// --- Configuration constants ---

// Vertical alignment: items within this ×fontSize are considered same line
const VERTICAL_THRESHOLD = 0.6;
// Horizontal adjacency: items within this ×fontSize gap are merged
const HORIZONTAL_THRESHOLD = 1.8;
// Space detection: gaps >= this ×fontSize insert a space character
const SPACE_THRESHOLD = 0.25;

// Safety buffers for font substitution and rendering differences
const PADDING_Y = 2; // vertical padding (px)
const PADDING_X = 10; // minimum horizontal padding (px)
const WIDTH_BUFFER = 0.03; // 3% width increase

// --- Public API ---

/**
 * Extract text items from a PDF.js page
 * @param {Promise} pagePromise - PDF.js page promise
 * @returns {Promise<Array>} Array of text items with screen coordinates
 */
export async function extractTextFromPage(pagePromise) {
  const page = await pagePromise;
  const viewport = page.getViewport({ scale: 1, rotation: 0 });
  const textContent = await page.getTextContent();

  return textContent.items
    .filter((item) => item.str?.trim())
    .map((item, index) => {
      // Transform matrix: [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const [scaleX, _skewX, skewY, _scaleY, tx, ty] = item.transform; // NOSONAR

      const fontSize = Math.hypot(scaleX, skewY);

      // Skip rotated text in MVP (> 5 degrees)
      const rotation = Math.atan2(skewY, scaleX) * (180 / Math.PI);
      const isRotated = Math.abs(rotation) > 5;

      const height = item.height ? item.height + PADDING_Y : fontSize * 1.2;

      // Convert PDF coords (bottom-left origin) to screen coords (top-left origin)
      const screenY = viewport.height - ty;

      const estimatedWidth = measureTextWidth(item.str, fontSize, item.fontName || 'Helvetica', item.width);
      const paddingPx = Math.max(PADDING_X, estimatedWidth * WIDTH_BUFFER);

      return {
        id: `text-${index}`,
        text: item.str,
        x: tx,
        y: screenY - height,
        paddingPx,
        width: estimatedWidth + paddingPx,
        height,
        fontSize,
        fontName: item.fontName || 'Helvetica',
        isRotated,
        rotation,
      };
    });
}

/**
 * Group text items into editable lines by merging horizontally adjacent items
 * @param {Array} items - Array of text items from extractTextFromPage
 * @returns {Array} Array of line objects (each is one editable block)
 */
export function groupTextIntoLines(items) {
  if (!items.length) return [];

  const editableItems = items.filter((item) => !item.isRotated);
  if (!editableItems.length) return [];

  return mergeHorizontalLines(editableItems);
}

/**
 * Map PDF font names to available fonts, preserving bold/italic style
 */
export function mapToAvailableFont(fontName) {
  const lower = fontName.toLowerCase();

  // Detect style from font name
  const isBold = /bold/i.test(fontName);
  const isItalic = /italic|oblique/i.test(fontName);

  // Determine base family
  let base;
  if (lower.includes('arial') || lower.includes('helvetica')) {
    base = 'Arial';
  } else if (lower.includes('times')) {
    return 'Times-Roman'; // no bold/italic variants available
  } else if (lower.includes('courier')) {
    return 'Courier'; // no bold/italic variants available
  } else {
    base = 'Arial'; // default fallback
  }

  // Append style suffix for Arial variants
  if (isBold && isItalic) return `${base}-BoldItalic`;
  if (isBold) return `${base}-Bold`;
  if (isItalic) return `${base}-Italic`;
  return base;
}

// --- Internal helpers ---

/**
 * Merge horizontally adjacent items into lines
 * Sorts by Y then X, merges consecutive items with matching font and proximity
 */
function mergeHorizontalLines(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);

  const lines = [];
  let current = null;

  for (const item of sorted) {
    if (!current) {
      current = createLine(item);
    } else if (shouldMerge(current, item)) {
      mergeItem(current, item);
    } else {
      lines.push(current);
      current = createLine(item);
    }
  }

  if (current) lines.push(current);

  return lines;
}

/** Create a new line from a single text item */
function createLine(item) {
  return { ...item, items: [item] };
}

/** Check if an item should be merged into the current line */
function shouldMerge(line, item) {
  const fontSize = Math.max(line.fontSize, item.fontSize);

  // Same vertical position (same line)
  const sameY = Math.abs(item.y - line.y) < fontSize * VERTICAL_THRESHOLD;

  // Horizontally adjacent: allow overlap up to paddingPx (safety buffer inflates width),
  // and gap up to HORIZONTAL_THRESHOLD × fontSize
  const gap = item.x - (line.x + line.width);
  const adjacent = gap >= -line.paddingPx && gap < fontSize * HORIZONTAL_THRESHOLD;

  return sameY && adjacent;
}

/** Merge an item into an existing line */
function mergeItem(line, item) {
  line.items.push(item);

  // Detect word boundary: gap after removing safety buffer vs space threshold
  const gap = item.x - (line.x + line.width - line.paddingPx);
  const spaceWidth = line.fontSize * SPACE_THRESHOLD;

  // Round to 1 decimal to avoid sub-pixel floating-point false positives
  if (Math.round(gap * 10) / 10 >= Math.round(spaceWidth * 10) / 10) {
    line.text += ' ';
  }
  line.text += item.text;

  // Update bounding box
  const lineRight = line.x + line.width;
  const newRight = Math.max(lineRight, item.x + item.width);
  line.width = newRight - line.x;
  line.height = Math.max(line.height, item.height);
  line.paddingPx = item.paddingPx;

  if (item.fontSize > line.fontSize) {
    line.fontSize = item.fontSize;
  }
}
