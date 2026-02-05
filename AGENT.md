# Free PDF Editor — AI Agent Playbook

Purpose: single source of truth for AI/devs; keep every change aligned with the privacy-first, fully client-side mission.

## Mission & Non-Negotiables

- 100% client-side Svelte 5 app; never add a backend or external API calls for core features.
- PDFs and analytics never leave the machine; no telemetry, no tracking.
- Works offline and via `file://`; keep dependencies local and static-host friendly.

## Project Snapshot (2026-02-05)

- Framework: Svelte 5.45.2 (runes)
- Build: Rollup 4.53.3 + rollup-plugin-copy
- Styling: Tailwind 1.9.6 + PostCSS
- PDF engines: pdf.js, pdf-lib (vendored in `src/vendor/`)
- Package manager: pnpm (preferred)

## Fast Start Checklist

1) Open `src/App.svelte` to see global state: `pages`, `allObjects`, `selectedPageIndex`, `pdfFile`, `editMode`.
2) Source of truth is `src/`; build copies assets to `public/`.
3) Touching fonts/assets? Update both `src/config/assets.js` and `src/utils/prepareAssets.js`.
4) Text work lives in `src/libs/textReplace/`; keep the flow intact.
5) Ship only if manual checklist passes and extraction stays <100ms/page.

## Architecture Map (what matters)

- `src/main.js` — entry.
- `src/App.svelte` — orchestrates edit mode, save/export.
- `src/components/` — UI: `PDFPage`, `Text`, `Image`, `Drawing`, `DrawingCanvas`, `DropZone`, `Toast`.
- `src/libs/textReplace/` — text extraction/editing overlay:
  - `textExtractor.js` — extraction + grouping.
  - `widthMeasurement.js` — width strategy + cache.
  - `EditableTextLayer.svelte` / `EditableTextBlock.svelte` — masking + editing UI.
- `src/utils/` — `PDF.js` (export), `prepareAssets.js` (lazy load), `pannable.js`, `tapout.js`, `recentFiles.js`, `helper.js`, `asyncReader.js`.
- `src/config/assets.js` — font/vendor paths.
- `src/assets/` — fonts/icons (authoritative).
- `src/vendor/` — pdf.js, pdf-lib, download, makeTextPDF (copied to `public/` at build).

## Text Extraction System (revamped 2026-02-05)

Flow: `extractTextFromPage(pagePromise)` → measure widths → `groupTextIntoLines(items)` → `EditableTextLayer`.

- Width strategy (`widthMeasurement.js`):
  1) pdf.js width when provided (most accurate).
  2) Canvas `measureText`; padding = width × 1.2 + 8px.
  3) Character estimation fallback; padding = width × 1.25 + 8px.
  - Cache: Map FIFO, max 1000 entries; exports `clearWidthCache`, `getCacheStats`.
- Line grouping (`textExtractor.js`):
  - Stage 1 Y-clustering (threshold = `VERTICAL_THRESHOLD_MULTIPLIER` × fontSize; default 0.6).
  - Stage 2 column detection (gap > max(`COLUMN_GAP_MULTIPLIER` × fontSize, `COLUMN_GAP_MIN_PX`); defaults 3.0 and 50px).
  - Stage 3 merge per column (horizontal threshold = `HORIZONTAL_THRESHOLD_MULTIPLIER` × fontSize; default 1.8).
  - Rotated text currently filtered; fonts mapped via `mapToAvailableFont`.

## Save/Export Pipeline

1. Mask originals with white rectangles.
2. Fetch/embed fonts via `fetchFont()` using `assets.js` paths.
3. Render edited text via `makeTextPDF` (pdf-lib) with PDF↔DOM coordinate transforms.
4. Download generated PDF (client-only).

## Performance & Quality Guardrails

- Text extraction <50ms/page; total overhead <100ms/page.
- Width error target <10% (previously ~40%).
- Multi-column accuracy >95%; tables >90%.
- Cache hit rate >80% after first pages; ~50KB for 1000 entries.
- Do not add deps that break offline/static hosting.

## Manual Test Pass (run before shipping)

- Text extraction: single-column; multi-column; tables; mixed font sizes; justified text; common fonts (Helvetica/Times/Courier); 10+ pages <500ms total.
- Text editing: masks cover originals; clipping warnings sane; font/size changes propagate; drag/resize works; save/export preserves edits.
- General: load via drag-drop + picker; page nav; annotation tools; recent files; undo/redo if touched.

## Debug Hooks

- Set `showDebugOverlay={true}` in `EditableTextLayer` to see bounds, dimensions, indices.
- Use `getCacheStats()` from `widthMeasurement.js` for cache size/maxSize.
- Profile with `console.time('text-extraction')` around extract/group steps.

## Common Fixes

- White masks short → increase padding constants in `widthMeasurement.js`.
- Columns merging → raise `COLUMN_GAP_MULTIPLIER` or `COLUMN_GAP_MIN_PX`.
- Lines split → increase `HORIZONTAL_THRESHOLD_MULTIPLIER`.
- Baselines merging → increase `VERTICAL_THRESHOLD_MULTIPLIER`.
- Font load fails → check `src/assets/fonts`, `src/config/assets.js`, `src/utils/prepareAssets.js`.

## Commands (pnpm)

```bash
pnpm install
pnpm dev   # localhost:8080
pnpm build # outputs to public/build/
pnpm start # serves public/
```

## Additional Resources

- **Claude Instructions**: [.claude/CLAUDE.md](.claude/CLAUDE.md)

## Future Opportunities

- Rotated text; bold/italic preservation; multi-line blocks; RTL; alignment controls; batch font replace; undo/redo; text search/replace; better preview.

Last Updated: 2026-02-05 (captures width measurement + column detection release)
