import { readAsArrayBuffer } from './asyncReader.js';
import { noop } from './helper.js';
import { fetchFont, getAsset } from './prepareAssets';

export async function save(pdfFile, objects, editedTextByPage = [], name, onProgress = () => {}) {
  onProgress(5);
  const PDFLib = await getAsset('PDFLib');
  const download = await getAsset('download');
  const makeTextPDF = await getAsset('makeTextPDF');
  onProgress(15);
  let pdfDoc;
  try {
    pdfDoc = await PDFLib.PDFDocument.load(await readAsArrayBuffer(pdfFile));
  } catch (e) {
    console.log('Failed to load PDF.');
    throw e;
  }
  onProgress(25);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  let processedPages = 0;

  const pagesProcesses = pages.map(async (page, pageIndex) => {
    const pageObjects = objects[pageIndex];
    const editedText = editedTextByPage[pageIndex] || new Map();
    // 'y' starts from bottom in PDFLib, use this to calculate y
    const pageHeight = page.getHeight();

    // Process edited text first (cover original with white, draw new text)
    if (editedText.size > 0) {
      await processEditedText(page, pdfDoc, editedText, pageHeight, PDFLib, makeTextPDF);
    }
    const embedProcesses = pageObjects.map(async (object) => {
      if (object.type === 'image') {
        let { file, x, y, width, height } = object;
        let img;
        try {
          if (file.type === 'image/jpeg') {
            img = await pdfDoc.embedJpg(await readAsArrayBuffer(file));
          } else {
            img = await pdfDoc.embedPng(await readAsArrayBuffer(file));
          }
          return () =>
            page.drawImage(img, {
              x,
              y: pageHeight - y - height,
              width,
              height,
            });
        } catch (e) {
          console.log('Failed to embed image.', e);
          return noop;
        }
      } else if (object.type === 'text') {
        let { x, y, lines, lineHeight, size, fontFamily, width, text } = object;
        // Defensive: ensure lines exists (fixes race condition when saving immediately after editing)
        if (!lines || !Array.isArray(lines) || lines.length === 0) {
          lines = text ? text.split('\n') : [''];
        }
        const height = size * lineHeight * lines.length;
        const font = await fetchFont(fontFamily);
        const [textPage] = await pdfDoc.embedPdf(
          await makeTextPDF({
            lines,
            fontSize: size,
            lineHeight,
            width,
            height,
            font: font.buffer || fontFamily, // built-in font family
            dy: font.correction(size, lineHeight),
          })
        );
        return () =>
          page.drawPage(textPage, {
            width,
            height,
            x,
            y: pageHeight - y - height,
          });
      } else if (object.type === 'drawing') {
        let { x, y, path, scale } = object;
        const { pushGraphicsState, setLineCap, popGraphicsState, setLineJoin, LineCapStyle, LineJoinStyle } = PDFLib;
        return () => {
          page.pushOperators(pushGraphicsState(), setLineCap(LineCapStyle.Round), setLineJoin(LineJoinStyle.Round));
          page.drawSvgPath(path, {
            borderWidth: 5,
            scale,
            x,
            y: pageHeight - y,
          });
          page.pushOperators(popGraphicsState());
        };
      }
    });
    // embed objects in order
    const drawProcesses = await Promise.all(embedProcesses);
    drawProcesses.forEach((p) => p());
    processedPages++;
    onProgress(25 + Math.round((processedPages / totalPages) * 50));
  });
  await Promise.all(pagesProcesses);
  onProgress(80);
  try {
    const pdfBytes = await pdfDoc.save();
    onProgress(95);
    download(pdfBytes, name, 'application/pdf');
    onProgress(100);
  } catch (e) {
    console.log('Failed to save PDF.');
    throw e;
  }
}

/**
 * Process edited text items by covering original text with white rectangles
 * and drawing new text on top
 */
async function processEditedText(page, pdfDoc, editedText, pageHeight, PDFLib, makeTextPDF) {
  const { rgb } = PDFLib;

  for (const [_itemId, edit] of editedText) {
    const { bounds, newText, fontSize, fontName } = edit;

    if (!bounds) continue;

    // 1. Draw white rectangle to cover original text
    // Add small padding to ensure complete coverage
    const padding = 2;
    page.drawRectangle({
      x: bounds.x - padding,
      y: pageHeight - bounds.y - bounds.height - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
      color: rgb(1, 1, 1), // White
      borderWidth: 0,
    });

    // 2. Draw new text on top (if not empty)
    if (newText && newText.trim()) {
      try {
        const font = await fetchFont(fontName || 'Helvetica');
        const textFontSize = fontSize || 12;
        const lineHeight = 1.2;
        const lines = [newText];
        const textHeight = textFontSize * lineHeight;
        const textWidth = bounds.width + 20; // Add some extra width

        const [textPage] = await pdfDoc.embedPdf(
          await makeTextPDF({
            lines,
            fontSize: textFontSize,
            lineHeight,
            width: textWidth,
            height: textHeight,
            font: font.buffer || fontName || 'Helvetica',
            dy: font.correction(textFontSize, lineHeight),
          })
        );

        page.drawPage(textPage, {
          x: bounds.x,
          y: pageHeight - bounds.y - bounds.height,
          width: textWidth,
          height: textHeight,
        });
      } catch (e) {
        console.error('Failed to draw edited text:', e);
      }
    }
  }
}
