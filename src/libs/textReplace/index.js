/**
 * Text Replace Module
 *
 * Provides functionality for replacing text in PDFs by:
 * 1. Extracting text positions from PDF.js
 * 2. Displaying editable overlays on detected text
 * 3. Storing edits that get applied during PDF save (white rect + new text)
 */

// Text extraction utilities
export { extractTextFromPage, groupTextIntoLines, mapToAvailableFont } from './textExtractor.js';

// Svelte components
export { default as EditableTextBlock } from './EditableTextBlock.svelte';
export { default as EditableTextLayer } from './EditableTextLayer.svelte';
export { default as WelcomeModal } from './WelcomeModal.svelte';
