/**
 * Text extraction utilities for Replace Text mode
 * Extracts text from PDF pages using PDF.js and groups into editable lines
 */

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
    .filter((item) => item.str && item.str.trim()) // Filter empty items
    .map((item, index) => {
      // Transform matrix: [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const [scaleX, _skewX, skewY, scaleY, tx, ty] = item.transform;

      // Calculate font size from transform matrix
      const fontSize = Math.sqrt(scaleY * scaleY + skewY * skewY);

      // Check for significant rotation (skip rotated text in MVP)
      const rotation = Math.atan2(skewY, scaleX) * (180 / Math.PI);
      const isRotated = Math.abs(rotation) > 5;

      // Item height - use provided or estimate from font size
      const height = item.height || fontSize * 1.2;

      // Convert PDF coords (bottom-left origin) to screen coords (top-left origin)
      const screenY = viewport.height - ty;

      return {
        id: `text-${index}`,
        text: item.str,
        x: tx,
        y: screenY - height,
        width: item.width || fontSize * item.str.length * 0.6,
        height,
        fontSize,
        fontName: item.fontName || 'Helvetica',
        isRotated,
        rotation,
      };
    });
}

/**
 * Group text items into logical lines based on vertical position
 * @param {Array} items - Array of text items
 * @param {number} lineThreshold - Max vertical gap to consider same line (px)
 * @returns {Array} Array of line objects containing grouped items
 */
export function groupTextIntoLines(items, lineThreshold = 8) {
  if (!items.length) return [];

  // Filter out rotated text for MVP
  const editableItems = items.filter((item) => !item.isRotated);

  if (!editableItems.length) return [];

  // Sort by Y position (top to bottom), then by X (left to right)
  const sorted = [...editableItems].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > lineThreshold) return yDiff;
    return a.x - b.x;
  });

  const lines = [];
  let currentLine = null;

  for (const item of sorted) {
    if (!currentLine) {
      currentLine = createLineFromItem(item);
    } else if (shouldMergeIntoLine(currentLine, item, lineThreshold)) {
      mergeItemIntoLine(currentLine, item);
    } else {
      lines.push(currentLine);
      currentLine = createLineFromItem(item);
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Create a new line object from a text item
 */
function createLineFromItem(item) {
  return {
    id: item.id,
    items: [item],
    text: item.text,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    fontSize: item.fontSize,
    fontName: item.fontName,
  };
}

/**
 * Check if an item should be merged into the current line
 */
function shouldMergeIntoLine(line, item, threshold) {
  // Check if vertically aligned (same line)
  const verticallyAligned = Math.abs(item.y - line.y) < threshold;

  // Check if horizontally adjacent (not too far apart)
  const lineRight = line.x + line.width;
  const gap = item.x - lineRight;
  const maxGap = line.fontSize * 2; // Allow gap up to 2x font size
  const horizontallyAdjacent = gap >= -5 && gap < maxGap;

  return verticallyAligned && horizontallyAdjacent;
}

/**
 * Merge an item into an existing line
 */
function mergeItemIntoLine(line, item) {
  line.items.push(item);

  // Add space between items if there's a gap
  const lineRight = line.x + line.width;
  const gap = item.x - lineRight;
  if (gap > line.fontSize * 0.3) {
    line.text += ' ';
  }
  line.text += item.text;

  // Update bounding box
  const newRight = Math.max(lineRight, item.x + item.width);
  line.width = newRight - line.x;
  line.height = Math.max(line.height, item.height);

  // Use the most common font size
  if (item.fontSize > line.fontSize) {
    line.fontSize = item.fontSize;
  }
}

/**
 * Map PDF font names to available fonts
 */
export function mapToAvailableFont(fontName) {
  const fontMap = {
    Arial: 'Helvetica',
    ArialMT: 'Helvetica',
    'Arial-BoldMT': 'Helvetica',
    TimesNewRoman: 'Times-Roman',
    TimesNewRomanPSMT: 'Times-Roman',
    CourierNew: 'Courier',
    CourierNewPSMT: 'Courier',
  };

  // Check direct mapping
  if (fontMap[fontName]) {
    return fontMap[fontName];
  }

  // Check if contains common font names
  const lowerName = fontName.toLowerCase();
  if (lowerName.includes('arial') || lowerName.includes('helvetica')) {
    return 'Helvetica';
  }
  if (lowerName.includes('times')) {
    return 'Times-Roman';
  }
  if (lowerName.includes('courier')) {
    return 'Courier';
  }

  // Default fallback
  return 'Helvetica';
}
