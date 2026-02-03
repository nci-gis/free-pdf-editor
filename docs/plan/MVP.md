# MVP Plan: PDF Text Edit Mode

## Goal

User can open a PDF → enter Text Edit Mode → click visible text → edit it → choose font + size → export a new PDF that visually matches the edited result.

**Key Principle**: You are not editing the original PDF text objects. You are covering the old text and drawing new text on top during export.

---

## User Experience

### Tools

| Tool              | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| Pointer           | Default tool                                                          |
| Edit Text         | Toggle mode for text editing                                          |
| Font dropdown     | Arial, Times New Roman, Courier New, Noto Sans (optional), Noto Serif |
| Font size control | Auto (default) + numeric input                                        |
| Buttons           | Apply, Cancel, Export                                                 |

### Workflow

1. User opens PDF (already works)
2. User clicks **Edit Text** button
3. User clicks on a line of text on the page
4. A text box appears exactly over that line
5. User edits text
6. User clicks outside (or presses "Apply")
7. Overlay becomes a non-edit highlight box (selection)
8. User exports PDF
9. Exported PDF shows text replaced

---

## Data Model

Store edits in state, not DOM. Create `src/utils/editModel.js`.

### 1. Detected Text Blocks

These come from PDF.js `textContent` and are used for hit-testing.

```typescript
// One per "editable target" (MVP: line-level)
type TextBlock = {
  id: string;
  pageIndex: number;

  // PDF coordinate space (important)
  pdfRect: { x: number; y: number; w: number; h: number };

  // The text content as extracted
  originalText: string;

  // Rotation (optional MVP: assume 0; store anyway)
  rotation: 0 | 90 | 180 | 270;

  // Approx style from PDF.js (for auto sizing)
  approxFontSize: number;

  // For debugging
  debug?: {
    transform: number[];
    strItems: string[];
  };
};
```

### 2. User Edits (what you export)

```typescript
type TextEdit = {
  id: string;
  pageIndex: number;

  // Where to draw in PDF coords
  pdfRect: { x: number; y: number; w: number; h: number };

  // What to draw
  text: string;

  // Style chosen by user
  fontFamily: string; // e.g. "Arial"
  fontSize: number | 'auto';
  color: { r: number; g: number; b: number }; // MVP: black only is ok

  // Cover-up behavior
  cover: {
    enabled: boolean; // true in MVP
    color: { r: number; g: number; b: number }; // white
    padding: number; // small extra cover
  };
};
```

---

## Coordinate Systems

You will deal with 3 coordinate spaces:

| Space         | Description          |
| ------------- | -------------------- |
| DOM pixels    | Mouse click position |
| Canvas pixels | Render resolution    |
| PDF points    | Export space         |

**Rule**: Store everything in PDF points in state. Convert for display.

PDF.js viewport helpers:

- `viewport.convertToPdfPoint(x, y)`
- `viewport.convertToViewportPoint(x, y)`

These also handle rotation/scale. Reuse the same viewport used for rendering.

---

## Text Detection (Line-Level)

PDF.js `page.getTextContent()` returns text items with transforms.

### Grouping Algorithm

1. For each text item:
   - Compute viewport-space bounding box (pixels)
   - Convert bbox into PDF-space bbox
2. Group items into lines by closeness in PDF Y coordinate

### Tolerance

```javascript
lineYThreshold = fontSize * 0.6; // approx
// Or a constant like 2–4 points (start simple)
```

### Block Text

Join items in reading order (roughly left-to-right for a line).

> This will not be perfect, but it's enough to click-and-edit many PDFs.

---

## Hit Testing

When user clicks on the canvas in Edit Text mode:

1. Convert click point to PDF point:

   ```javascript
   // Get page viewport used for rendering
   // Compute mouse position relative to canvas
   pdfPt = viewport.convertToPdfPoint(xCanvas, yCanvas);
   ```

2. Find the smallest `TextBlock` whose `pdfRect` contains the point

3. If none found: show message "No editable text detected here. Try another area."

---

## Overlay UI

Create `TextEditOverlay.svelte` per page.

### Rendering Overlay Rectangles

Given a `TextBlock` or `TextEdit` in PDF coords:

```javascript
// Convert pdfRect back to viewport coords
topLeft = viewport.convertToViewportPoint(x, y + h); // careful
bottomRight = viewport.convertToViewportPoint(x + w, y);
// Then compute CSS left/top/width/height relative to page container
```

### Editor States

| State      | Description                              |
| ---------- | ---------------------------------------- |
| `idle`     | No selection                             |
| `selected` | Show border (maybe resize handles later) |
| `editing`  | Textarea visible                         |

**MVP**: Click selects; double-click enters editing (or single click in Edit Text mode).

---

## Styling (Font + Size)

### Font Options

**Option A (MVP easiest)**: Use standard web-safe fonts

- Arial, Times New Roman, Courier New
- Won't match PDF exactly, but user can choose

**Option B (better, doable later)**: Ship one good Unicode font locally

- e.g., Noto Sans subset (but font file size is large)
- Impacts "no big download" goal

**For MVP: Use Option A.**

### Font Size

```javascript
// Default: "auto" based on block height
fontSize = Math.min(block.approxFontSize, block.pdfRect.h * 0.8);
// If user types a number, use it
```

---

## Export Algorithm

For each `TextEdit` on page:

### 1. Cover Original Text

Draw a filled white rectangle slightly larger than `pdfRect`:

```javascript
const padding = 1; // or 2 points
page.drawRectangle({
  x: pdfRect.x - padding,
  y: pdfRect.y - padding,
  width: pdfRect.w + padding * 2,
  height: pdfRect.h + padding * 2,
  color: rgb(1, 1, 1), // white
});
```

### 2. Draw New Text

**Path 1**: pdf-lib `drawText` (fast, simplest)

- Good for single-line, Latin
- Multi-line: manually split lines and adjust y offsets
- Font: pdf-lib standard fonts or embed custom font

**Path 2**: Reuse `makeTextPDF()` (recommended)

- Already built for multiline and CJK
- Consistent layout

```javascript
const embedded = await pdfDoc.embedPdf(
  await makeTextPDF({ lines, width, height, fontSize, font, dy })
);
page.drawPage(embeddedPage, { x, y, width, height });
```

### Line Splitting

```javascript
const lines = text.split('\n');
```

### Overflow Handling

**MVP behavior**: Allow overflow (text clipped) + show warning "Text may be clipped"

---

## Edge Cases

Define behavior upfront to save time:

| Case                        | MVP Behavior                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Rotated text                | Do not support; show tooltip "Rotated text not supported yet"                       |
| Multi-column/weird ordering | Line grouping might pick wrong joins; allow editing each block; no paragraph reflow |
| Fonts not matching          | User chooses from dropdown; later: "Match original font (best effort)"              |
| Zoom                        | Safe because edits stored in PDF coords; overlay conversion uses current viewport   |

---

## Implementation Checklist

### Step 0: Edit State in Store

```javascript
editMode: boolean;
textBlocksByPage: Map<number, TextBlock[]>;
textEdits: TextEdit[];
selectedBlockId: string | null;
```

### Step 1: Extract TextBlocks After PDF Load

When a page loads in PDF.js:

1. `page.getTextContent()`
2. Build line-level `TextBlock[]`
3. Store in `textBlocksByPage[pageIndex]`

### Step 2: Render Debug Overlay (High Value)

Before editing UI, render translucent rectangles over blocks. This makes hit-testing obvious.

### Step 3: Hit Test on Click

In Edit Text mode:

1. Click → find block → create `TextEdit` draft:
   - `pdfRect = block.pdfRect`
   - `text = block.originalText`
   - Style defaults
2. Mark as editing

### Step 4: Getting style info

Implement “Match original font (best effort)” like this:

1. For each text block, store:
    - pdfjsFontName (item.fontName)
    - pdfjsStyle (textContent.styles[item.fontName] if available)
    - approxFontSize

2. When user edits, default font dropdown to:
    - If style.fontFamily looks like Helvetica/Times/Courier → choose nearest web-safe
    - Else fallback to Arial

    **Simple mapping table (good enough)**:
    - Helvetica / Arial / Liberation Sans → Arial
    - Times / TimesNewRoman / Liberation Serif → Times New Roman
    - Courier / CourierNew / Liberation Mono → Courier New

3. Still let user override.
    - That gives users a “usually looks similar” default without promising miracles.

**Practical implementation notes**  

```javascript
const textContent = await page.getTextContent();
const styles = textContent.styles; // dictionary keyed by fontName

for (const item of textContent.items) {
  const style = styles?.[item.fontName]; // may be undefined
  // style.fontFamily sometimes exists, sometimes not
}
```

**Estimating font size from transform (common approach)**  

`item.transform` is `[a, b, c, d, e, f]`. A rough font height in viewport units is related to `Math.hypot(b, d)` or `Math.hypot(a, c)` depending on rotation.

A decent heuristic:

- fontSizePx ≈ Math.hypot(item.transform[2], item.transform[3]) (often works)
- convert px→PDF points using scale (or compute in PDF coords directly)

But honestly, for MVP you can skip deep math and just use the block’s bbox height:

- approxFontSize = pdfRect.h * 0.8

### Step 5: Textarea Overlay

1. Position using viewport conversion
2. On apply:
   - Commit `TextEdit`
   - Stop editing

### Step 6: Export Pipeline

1. Load original PDF bytes using pdf-lib
2. For each page, apply edits in PDF coords:
   - Draw white cover rectangle
   - Embed text (makeTextPDF or drawText)
3. Save and download

---

## Acceptance Tests

"Done MVP" means:

1. Open a simple PDF with clear text
2. Edit a line of text
3. Export
4. Exported PDF:
   - Shows the new text
   - Old text is not visible under it
   - Placement roughly correct
5. Works offline from `public/index.html`

---

## UI Copy Recommendations

**Label the feature**:
> "Replace text (visual)"

**NOT**:
> "Edit PDF text"

**Tooltip**:
> "Works best on simple PDFs. Complex layouts may not be editable."

This honesty reduces support burden.

---

## Current Implementation Status

The following has been implemented:

| Component                                 | Status | Notes                           |
| ----------------------------------------- | ------ | ------------------------------- |
| `src/utils/textExtractor.js`              | Done   | Text extraction + line grouping |
| `src/components/EditableTextLayer.svelte` | Done   | Overlay with editable blocks    |
| `src/components/EditableTextBlock.svelte` | Done   | Individual text block editing   |
| `src/utils/PDF.js` (save)                 | Done   | White rect + new text drawing   |
| `src/App.svelte` (edit mode)              | Done   | Toggle, state management        |
| Font selector                             | Done   | Per-block font dropdown         |
| Keyboard shortcuts                        | Done   | E to toggle, Escape to cancel   |

### Remaining Enhancements

- [x] Font size control (Auto + preset sizes dropdown)
- [x] "Text may be clipped" warning (⚠️ indicator when text may overflow)
- [x] Better UI copy ("Replace text" instead of "Edit")
- [x] Debug overlay toggle for development (press D in replace text mode)
