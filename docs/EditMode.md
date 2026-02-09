# Edit Mode Documentation

> **⚠️ IMPORTANT MAINTENANCE NOTE**
> This document describes how the edit mode (Replace Text mode) works in the Free PDF Editor.

---

## Table of Contents

1. [Overview](#overview)
2. [High-Level Workflow](#high-level-workflow)
3. [Text Extraction Algorithm](#text-extraction-algorithm)
4. [Component Architecture](#component-architecture)
5. [Width Measurement Strategy](#width-measurement-strategy)
6. [Save/Export Pipeline](#saveexport-pipeline)
7. [Configuration & Tuning](#configuration--tuning)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Edit mode (also called "Replace Text mode") enables users to visually replace text in PDF files by:

1. **Extracting** text items from the PDF using pdf.js
2. **Grouping** text items into editable lines
3. **Rendering** an editable overlay layer with text blocks
4. **Tracking** user edits in memory
5. **Saving** by masking original text with white rectangles and drawing new text

**Core Philosophy**: 100% client-side, no backend, privacy-first. All processing happens in the browser.

---

## High-Level Workflow

```mermaid
flowchart TD
    Start([User Loads PDF]) --> LoadPDF[PDF Loaded in Memory]
    LoadPDF --> Idle[Normal Mode: Annotations Active]

    Idle --> Annotate[Annotate with Text, Image, Drawing]
    Idle -->|Press E or click<br>Replace Text| EditMode[Replace Text Mode]
    EditMode --> UserEdit[User Edits Text]

    Annotate --> Work[Edit and Annotate]
    UserEdit --> Work

    Work -->|User Saves<br>Ctrl + S or Click Save| SavePDF[Save PDF Process]
    SavePDF --> End([PDF Saved])

    style EditMode fill:#fff3e0
    style SavePDF fill:#f3e5f5
```

**Key Points**:

- Edit mode is **non-destructive** - original PDF remains unchanged until save
- Edits are stored in memory as Maps (fast lookup by block ID)
- White masking ensures original text is hidden before new text is drawn

---

## Text Extraction Algorithm

### Single-Pass Horizontal Merging Algorithm

The text extraction uses a **single-pass horizontal merging algorithm**:

```text
Sort by Y, then X → Merge horizontally adjacent items → Editable text blocks
```

#### How It Works

1. **Sort** all text items by Y position (top to bottom), then by X position (left to right)
2. **Merge** consecutive items into lines if they match these criteria:
   - **Vertically aligned**: Y difference < 0.6× font size
   - **Horizontally adjacent**: Gap between items allows merging (considers padding buffer)
   - **Proximity threshold**: Gap < 1.8× font size
3. **Space detection**: Inserts space characters when gap ≥ 0.25× font size

**Why this approach?**
- Simple and fast: O(n log n) complexity (dominated by sort)
- Natural text flow: Processes left-to-right, top-to-bottom (reading order)
- Robust adjacency logic: Tolerates safety buffers while detecting word boundaries
- Works well for most common layouts: single-column, simple multi-column

**Trade-offs:**

- Multi-column PDFs with misaligned columns may merge incorrectly
- Complex table layouts may need manual splitting
- No explicit paragraph detection (each line is independent)

**Key Insight**: Rotated text (>5°) is filtered out in MVP - not editable.

---

## Component Architecture

### Component Flow

```text
App.svelte (Entry Point)
    ↓
    ├─ Manages edit mode state (on/off)
    ├─ Extracts text from all pages in parallel
    ├─ Tracks edits in Map per page
    └─ Renders EditableTextLayer per page
        ↓
        EditableTextLayer.svelte
        ├─ Renders white masks over original text
        └─ Renders EditableTextBlock per text line
            ↓
            EditableTextBlock.svelte
            ├─ Single-click: Select block
            ├─ Double-click: Edit text
            ├─ Drag: Reposition block
            ├─ Resize: Adjust bounding box
            └─ Warns if text might be clipped
```

### Key Files

- **[App.svelte](../src/App.svelte)** - Edit mode state management, text extraction orchestration
- **[textExtractor.js](../src/libs/textReplace/textExtractor.js)** - Text extraction and line grouping algorithm
- **[widthMeasurement.js](../src/libs/textReplace/widthMeasurement.js)** - 3-tier width measurement strategy
- **[EditableTextLayer.svelte](../src/libs/textReplace/EditableTextLayer.svelte)** - White masking and block rendering
- **[EditableTextBlock.svelte](../src/libs/textReplace/EditableTextBlock.svelte)** - Individual editable text block
- **[PDF.js](../src/utils/PDF.js)** - Save/export pipeline

### State Management

**App.svelte** manages:

- `editMode` - Boolean flag for edit mode on/off
- `extractedTextByPage` - Array of text line arrays per page
- `editedTextByPage` - Array of Maps (blockId → edit data) per page
- `selectedTextBlock` - Currently selected text block for sidebar sync

**EditableTextBlock.svelte** manages:

- Selection state (selected vs editing)
- Drag/pan offsets for repositioning
- Resize deltas for bounding box adjustment
- Clipping detection (warns if text exceeds bounds)

---

## Width Measurement Strategy

### 3-Tier Fallback Strategy

The system measures text width using a **3-tier fallback approach** with caching:

1. **Tier 1: pdf.js width** (most accurate)
   - Use original width from PDF if available
   - Add 3% safety buffer for font substitution

2. **Tier 2: Canvas measureText** (accurate, font-specific)
   - Use browser's Canvas API to measure text
   - Handles Unicode, kerning, font variations automatically
   - Add 3% safety buffer for rendering variations

3. **Tier 3: Character estimation** (fallback)
   - Estimate width using character-specific multipliers (wide, narrow, normal)
   - Combined with font category base widths (monospace, sans-serif, serif)
   - Add 5% safety buffer (higher due to lack of kerning data)

**Caching**: Results cached with FIFO eviction at 1000 entries (~50KB memory)

**Why 3 tiers?** Graceful degradation ensures width measurement always succeeds.

**Why safety buffer?** Font substitution (e.g., ArialMT → Helvetica) means replacement text may be wider than original.

---

## Save/Export Pipeline

### Process Overview

```text
1. User clicks Save
2. Load pdf-lib, download, makeTextPDF libraries
3. For each page:
   a. Draw white rectangles over original text (2px padding)
   b. Create mini-PDF with new text using makeTextPDF
   c. Embed mini-PDF at original text location
   d. Process annotations (images, text fields, drawings)
4. Save PDF to file
5. Trigger download
```

### Critical Coordinate Transform

**Screen → PDF Coordinate Conversion**:
- Screen: Y from **top** (top-left origin)
- PDF: Y from **bottom** (bottom-left origin)
- Formula: `pdfY = pageHeight - screenY - height`

This transform is applied:
- In **textExtractor.js**: PDF → Screen (for extraction)
- In **PDF.js**: Screen → PDF (for saving)

**Important**: Coordinate transformation errors cause misaligned text in saved PDFs.

---

## Configuration & Tuning

### Algorithm Constants

**File**: [textExtractor.js:8](../src/libs/textReplace/textExtractor.js#L8)

| Constant               | Default | Purpose                                           |
|------------------------|---------|---------------------------------------------------|
| `VERTICAL_THRESHOLD`   | 0.6     | ×fontSize for vertical alignment tolerance        |
| `HORIZONTAL_THRESHOLD` | 1.8     | ×fontSize maximum gap for merging adjacent items  |
| `SPACE_THRESHOLD`      | 0.25    | ×fontSize minimum gap to insert space character   |

**Safety Buffers** ([textExtractor.js:18](../src/libs/textReplace/textExtractor.js#L18)):

| Constant       | Default | Purpose                                        |
|----------------|---------|------------------------------------------------|
| `PADDING_Y`    | 2       | pixels, vertical padding for bounding box      |
| `PADDING_X`    | 10      | pixels, minimum horizontal padding             |
| `WIDTH_BUFFER` | 0.03    | 3% width increase for font substitution safety |

### Tuning Guidelines

- ↑ `VERTICAL_THRESHOLD` → More forgiving vertical alignment (merges lines with larger Y-difference)
- ↑ `HORIZONTAL_THRESHOLD` → Allow wider gaps within lines (better for justified text with extra spacing)
- ↑ `SPACE_THRESHOLD` → More sensitive space detection (inserts spaces for smaller gaps)
- ↑ `WIDTH_BUFFER` → Larger safety buffer (reduces clipping risk but may affect multi-column detection)

### Width Measurement Constants

**File**: [widthMeasurement.js:13](../src/libs/textReplace/widthMeasurement.js#L13)

| Constant         | Default | Purpose                                      |
|------------------|---------|----------------------------------------------|
| `MAX_CACHE_SIZE` | 1000    | Maximum cached width measurements (FIFO)     |

**Safety Buffers** (applied within measurement functions):

- Canvas/pdf.js: 3% (1.03× multiplier) - for font substitution variations
- Character estimation: 5% (1.05× multiplier) - higher due to lack of kerning data

### White Mask Padding

**File**: [EditableTextLayer.svelte:54](../src/libs/textReplace/EditableTextLayer.svelte#L54)

- Formula: `Math.max(3, Math.ceil(fontSize * 0.15))`
- Minimum 3px, scales to 15% of font size
- Ensures complete coverage of underlying PDF glyphs

---

## Troubleshooting

### Common Issues

| Issue                         | Cause                            | Solution                                          |
|-------------------------------|----------------------------------|---------------------------------------------------|
| White masks too small         | Width underestimation            | Increase `WIDTH_BUFFER` in textExtractor.js       |
| Columns merging together      | Insufficient horizontal gap      | Manual workaround: split blocks after extraction  |
| Lines incorrectly split       | Horizontal threshold too strict  | Increase `HORIZONTAL_THRESHOLD` (1.8 → 2.0)       |
| Different baselines merging   | Vertical threshold too forgiving | Decrease `VERTICAL_THRESHOLD` (0.6 → 0.5)         |
| Saved PDF has misaligned text | Coordinate transformation error  | Check Y conversion: `pageHeight - y - height`     |

### Coordinate Transformation Issues

If saved PDF text is misaligned, verify:

- **textExtractor.js**: Screen Y conversion uses `viewport.height - ty`
- **PDF.js**: PDF Y conversion uses `pageHeight - bounds.y - bounds.height`
- Remember: PDF uses bottom-left origin, DOM uses top-left

---

## Performance Characteristics

| Operation                    | Target  | Typical  | Notes                                 |
|------------------------------|---------|----------|---------------------------------------|
| Text extraction per page     | <50ms   | ~15-30ms | Depends on text density               |
| Line grouping per page       | <50ms   | ~5-15ms  | 2-stage X-first algorithm             |
| Width measurement (cached)   | <1ms    | <0.1ms   | Map lookup                            |
| Width measurement (uncached) | <5ms    | ~1-3ms   | Canvas measureText                    |
| Total overhead per page      | <100ms  | ~20-50ms | Extraction + grouping + rendering     |
| Cache hit rate               | >80%    | ~85-90%  | After first few pages                 |

---

## Testing Checklist

Before deploying changes to edit mode:

### Text Extraction

- [ ] Single-column documents group correctly
- [ ] Multi-column documents don't merge columns
- [ ] Tables: rows not merged across columns
- [ ] Mixed font sizes handled
- [ ] Justified text (wide spacing) handled

### Text Editing

- [ ] White masks fully cover original text
- [ ] Clipping warnings accurate (no false positives)
- [ ] Font/size changes propagate to save
- [ ] Drag/resize works
- [ ] Double-click to edit, click away to deselect

### Performance

- [ ] 10-page document extracts in <500ms total
- [ ] No visible lag during typing
- [ ] Cache hit rate >80%

### Save/Export

- [ ] Edited text appears in saved PDF
- [ ] Original text fully masked
- [ ] Text position matches visual editor
- [ ] Multi-page PDFs save correctly

---

## Debug Tools

### Enable Debug Overlay

Press `D` key while in edit mode or set in code:

```javascript
// src/App.svelte
let debugOverlay = $state(true);
```

Shows red borders around detected text blocks with dimensions and font size.

### Check Width Cache Stats

In browser console:

```javascript
import { getCacheStats } from './libs/textReplace/widthMeasurement.js';
getCacheStats(); // { size: 850, maxSize: 1000 }
```

### Profile Text Extraction

Wrap extraction in timing:

```javascript
console.time('text-extraction');
const extracted = await Promise.all(
  pages.map(async (page) => {
    const items = await extractTextFromPage(page);
    return groupTextIntoLines(items);
  })
);
console.timeEnd('text-extraction'); // ~100-200ms for 10 pages
```

---

## Future Enhancements

Potential improvements:

- [ ] Rotated text support (currently filtered)
- [ ] Bold/italic preservation (currently lost)
- [ ] Multi-line text blocks (currently single-line)
- [ ] RTL (right-to-left) text support
- [ ] Alignment controls (left/center/right/justify)
- [ ] Batch font replacement
- [ ] Undo/redo for text edits

---

## References

- **Main Documentation**: [AGENT.md](AGENT.md)
- **Claude Instructions**: [.claude/CLAUDE.md](.claude/CLAUDE.md)

---

*Last Updated: 2026-02-09*
*Version: 1.0 (Documentation sync with actual implementation)*
