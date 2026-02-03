# Dependency Libraries

This document describes the third-party JavaScript libraries used in this project. All vendor scripts are located in `src/vendor/` and copied to `public/assets/vendor/` during build.

## Overview

| Script            | Size   | Library        | Purpose                |
| ----------------- | ------ | -------------- | ---------------------- |
| `pdf.min.js`      | 334 KB | Mozilla PDF.js | Parse & render PDFs    |
| `pdf-lib.min.js`  | 322 KB | PDF-Lib        | Modify & save PDFs     |
| `download.min.js` | 6 KB   | download.js    | Trigger file downloads |
| `makeTextPDF.js`  | 2.9 MB | PDFKit bundle  | Create text PDFs       |

---

## pdf.min.js

**Library**: Mozilla PDF.js
**Source**: <https://mozilla.github.io/pdf.js/>
**Global Variable**: `pdfjsLib`

### Purpose

Parses and renders PDF files in the browser. This is the core library that enables viewing PDFs without any server-side processing.

### Usage in Project

- Used in [asyncReader.js](../src/utils/asyncReader.js) via `readAsPDF()` function
- Loaded lazily via [prepareAssets.js](../src/utils/prepareAssets.js)
- Renders each page to canvas in `PDFPage.svelte`

### Key APIs Used

```javascript
pdfjsLib.getDocument(url).promise  // Parse PDF from URL/blob
pdfDocument.getPage(pageNumber)    // Get specific page
page.render({ canvasContext, viewport })  // Render to canvas
```

### Flow

```text
User drops PDF → readAsPDF() → pdfjsLib.getDocument() → PDF document → render pages to canvas
```

---

## pdf-lib.min.js

**Library**: PDF-Lib
**Source**: <https://pdf-lib.js.org/>
**Global Variable**: `PDFLib`

### Purpose

Creates and modifies PDF documents. Used for the save functionality - embedding user annotations (images, text, drawings) into the PDF.

### Usage in Project

- Used in [PDF.js](../src/utils/PDF.js) for the `save()` function
- Loaded lazily via [prepareAssets.js](../src/utils/prepareAssets.js)

### Key APIs Used

```javascript
PDFLib.PDFDocument.load(arrayBuffer)  // Load existing PDF
pdfDoc.embedJpg(arrayBuffer)          // Embed JPEG image
pdfDoc.embedPng(arrayBuffer)          // Embed PNG image
pdfDoc.embedPdf(pdfBytes)             // Embed another PDF (for text)
page.drawImage(image, options)        // Draw embedded image
page.drawSvgPath(path, options)       // Draw SVG path (drawings)
page.drawPage(embeddedPage, options)  // Draw embedded PDF page
pdfDoc.save()                         // Export as Uint8Array
```

### Flow

```text
Save button → PDFLib.PDFDocument.load() → embed annotations → pdfDoc.save() → download
```

---

## download.min.js

**Library**: download.js by dandavis
**Version**: 4.2
**Source**: <https://github.com/rndme/download>
**Global Variable**: `download`

### Purpose

Triggers file downloads in the browser. Provides cross-browser compatibility for downloading blobs and data URLs.

### Usage in Project

- Used in [PDF.js](../src/utils/PDF.js) as the final step of saving
- Downloads the modified PDF to the user's device

### Key APIs Used

```javascript
download(data, filename, mimeType)
// Example:
download(pdfBytes, 'document.pdf', 'application/pdf')
```

### Flow

```text
pdfDoc.save() returns bytes → download(bytes, name, 'application/pdf') → browser download dialog
```

---

## makeTextPDF.js

**Library**: Custom bundle (PDFKit + blob-stream)
**Source**: Bundled with Browserify
**Global Variable**: `makeTextPDF`

### Purpose

Creates mini PDF documents containing text annotations. These mini PDFs are then embedded into the main PDF using pdf-lib.

### Why This Exists

PDF-Lib doesn't natively support multi-line text with custom fonts (especially non-Latin fonts like Chinese). This script uses PDFKit to:

1. Create a small PDF containing the text
2. Return it as an ArrayBuffer
3. pdf-lib then embeds this as a page in the main PDF

### Usage in Project

- Used in [PDF.js](../src/utils/PDF.js) for text annotations
- Supports custom fonts including Chinese (標楷體)

### Key APIs Used

```javascript
makeTextPDF({
  lines: ['Line 1', 'Line 2'],  // Text lines to render
  fontSize: 16,                  // Font size in points
  lineHeight: 1.4,               // Line height multiplier
  width: 200,                    // PDF width in points
  height: 50,                    // PDF height in points
  font: fontBuffer,              // ArrayBuffer or built-in font name
  dy: correctionOffset           // Vertical offset for font baseline
})
// Returns: Promise<ArrayBuffer>
```

### Flow

```text
Text annotation → makeTextPDF() → mini PDF ArrayBuffer → pdfDoc.embedPdf() → draw on page
```

---

## Loading Strategy

All vendor scripts are loaded lazily at runtime via dynamic `<script>` injection:

```javascript
// src/utils/prepareAssets.js
import { ASSET_PATHS } from '../config/assets.js';

const scripts = [
  { name: 'pdfjsLib', src: ASSET_PATHS.vendor.pdfjs },
  { name: 'PDFLib', src: ASSET_PATHS.vendor.pdfLib },
  { name: 'download', src: ASSET_PATHS.vendor.download },
  { name: 'makeTextPDF', src: ASSET_PATHS.vendor.makeTextPDF },
];
```

Scripts are loaded on-demand when first needed, reducing initial page load time.

---

## File Sizes

| File              | Raw Size | Notes                                       |
| ----------------- | -------- | ------------------------------------------- |
| `pdf.min.js`      | 334 KB   | Minified                                    |
| `pdf-lib.min.js`  | 322 KB   | Minified                                    |
| `download.min.js` | 6 KB     | Minified                                    |
| `makeTextPDF.js`  | 2.9 MB   | Browserify bundle (includes PDFKit + fonts) |
| **Total**         | ~3.5 MB  | Loaded on-demand                            |
