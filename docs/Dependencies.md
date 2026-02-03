# Dependency Libraries

This document describes the third-party JavaScript libraries used in this project, their purpose, usage, and licenses.

All vendor scripts are located in `src/vendor/` and copied to `public/assets/vendor/` during the build process.  
All PDF processing happens **entirely in the browser** — no files are uploaded to any server.

---

## Overview

| Script            | Size   | Library        | License      | Purpose                |
| ----------------- | ------ | -------------- | ------------ | ---------------------- |
| `pdf.min.js`      | 334 KB | Mozilla PDF.js | Apache-2.0   | Parse & render PDFs    |
| `pdf-lib.min.js`  | 322 KB | PDF-Lib        | MIT          | Modify & save PDFs     |
| `download.min.js` | 6 KB   | download.js    | MIT          | Trigger file downloads |
| `makeTextPDF.js`  | 2.9 MB | PDFKit bundle  | MIT (bundle) | Create text PDFs       |

**Total (on-demand)**: ~3.5 MB

> Note: `makeTextPDF.js` is a bundled script (PDFKit + blob-stream + any bundled assets).  
> If fonts are included in the bundle, their licenses must be documented (see “Notes on Fonts”).

---

## pdf.min.js

**Library**: Mozilla PDF.js  
**Source**: https://mozilla.github.io/pdf.js/  
**License**: Apache License 2.0  
**Global Variable**: `pdfjsLib`

### Purpose

Parses and renders PDF files directly in the browser. This is the core library that enables viewing PDFs without any server-side processing.

### Usage in Project

- Used in [`src/utils/asyncReader.js`](../src/utils/asyncReader.js) via the `readAsPDF()` function
- Loaded lazily via [`src/utils/prepareAssets.js`](../src/utils/prepareAssets.js)
- Renders each page to a `<canvas>` element in `PDFPage.svelte`

### Key APIs Used

```javascript
pdfjsLib.getDocument(url).promise            // Parse PDF from URL or Blob
pdfDocument.getPage(pageNumber)              // Retrieve a specific page
page.render({ canvasContext, viewport })     // Render page to canvas
```

### Flow

```text
User drops PDF
 → readAsPDF()
 → pdfjsLib.getDocument()
 → PDF document
 → render pages to canvas
```

### Notes

- PDF.js runs entirely client-side.
- PDF.js may use a Web Worker depending on your configuration/build of PDF.js.

---

## pdf-lib.min.js

**Library**: PDF-Lib  
**Source**: https://pdf-lib.js.org/  
**License**: MIT  
**Global Variable**: `PDFLib`

### Purpose

Creates and modifies PDF documents. Used for the save functionality — embedding user annotations (images, text, drawings) into the PDF.

### Usage in Project

- Used in [`src/utils/PDF.js`](../src/utils/PDF.js) for the `save()` function
- Loaded lazily via [`src/utils/prepareAssets.js`](../src/utils/prepareAssets.js)

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
Save button
 → PDFLib.PDFDocument.load()
 → embed annotations
 → pdfDoc.save()
 → download
```

---

## download.min.js

**Library**: download.js (by dandavis)  
**Version**: 4.2  
**Source**: https://github.com/rndme/download  
**License**: MIT  
**Global Variable**: `download`

### Purpose

Triggers file downloads in the browser. Provides cross-browser compatibility for downloading blobs and data URLs.

### Usage in Project

- Used in [`src/utils/PDF.js`](../src/utils/PDF.js) as the final step of saving
- Downloads the modified PDF to the user's device

### Key APIs Used

```javascript
download(data, filename, mimeType)

// Example:
download(pdfBytes, 'document.pdf', 'application/pdf')
```

### Flow

```text
pdfDoc.save() returns bytes
 → download(bytes, filename, 'application/pdf')
 → browser download dialog
```

---

## makeTextPDF.js

**Library**: Custom bundle (PDFKit + blob-stream)  
**Bundled With**: Browserify (or equivalent bundler)  
**License**: MIT (bundle components)  
**Global Variable**: `makeTextPDF`

### Purpose

Creates small, temporary PDF documents containing text annotations. These mini PDFs are then embedded into the main PDF using PDF-Lib.

### Why This Exists

PDF-Lib does not natively support advanced multi-line text layout or complex font handling in all cases (especially for non-Latin scripts).

This bundle uses **PDFKit** to:

1. Create a small PDF containing the text
2. Return it as an `ArrayBuffer`
3. Embed it into the main PDF using PDF-Lib (`pdfDoc.embedPdf()`)

### Usage in Project

- Used in [`src/utils/PDF.js`](../src/utils/PDF.js) for text annotations
- Supports custom fonts including CJK fonts (e.g. 標楷體), if provided
- Loaded only when text annotations are used

### Key APIs Used

```javascript
makeTextPDF({
  lines: ['Line 1', 'Line 2'],  // Text lines to render
  fontSize: 16,                 // Font size in points
  lineHeight: 1.4,              // Line height multiplier
  width: 200,                   // PDF width in points
  height: 50,                   // PDF height in points
  font: fontBuffer,             // ArrayBuffer or built-in font name
  dy: correctionOffset          // Vertical offset for font baseline
})
// Returns: Promise<ArrayBuffer>
```

### Flow

```text
Text annotation
 → makeTextPDF()
 → mini PDF ArrayBuffer
 → pdfDoc.embedPdf()
 → draw on page
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

Scripts are loaded on-demand when first needed, reducing initial page load time and memory usage.

---

## File Sizes

| File              | Raw Size | Notes                                   |
| ----------------- | -------- | --------------------------------------- |
| `pdf.min.js`      | 334 KB   | Minified                                |
| `pdf-lib.min.js`  | 322 KB   | Minified                                |
| `download.min.js` | 6 KB     | Minified                                |
| `makeTextPDF.js`  | 2.9 MB   | Bundle (PDFKit + possible fonts/assets) |
| **Total**         | ~3.5 MB  | Loaded on-demand                        |

---

## Notes on Fonts

Text annotation rendering may rely on externally provided fonts. If any fonts are bundled or redistributed:

- Their licenses must permit redistribution
- Required copyright notices must be preserved
- They should be documented in `THIRD_PARTY_LICENSES.md`

---

## License Compliance

All third-party libraries are used in accordance with their respective licenses.  
When redistributing vendor files, license texts and notices must be preserved.

See: `3rd-party-licenses.md`
