
import { OutputFormat } from "../types";

/**
 * Replaces the Gemini-based analysis with a local PDF.js text extraction logic.
 * This runs entirely in the browser without an API key.
 */
export async function analyzeDocument(file: File, format: OutputFormat) {
  // @ts-ignore
  const pdfjsLib = window.pdfjsLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  if (format === OutputFormat.WORD) {
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Simple layout reconstruction by joining items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }
    return { content: fullText, title: file.name };
  } else {
    // Basic Table Extraction Heuristic for Excel
    const allRows: string[][] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Group items by their vertical position (Y coordinate)
      const rowsMap = new Map<number, any[]>();
      textContent.items.forEach((item: any) => {
        const y = Math.round(item.transform[5]); // Y coordinate
        if (!rowsMap.has(y)) rowsMap.set(y, []);
        rowsMap.get(y)?.push(item);
      });

      // Sort Y coordinates descending (top to bottom)
      const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);
      
      sortedY.forEach(y => {
        const rowItems = rowsMap.get(y) || [];
        // Sort items in row by X coordinate
        rowItems.sort((a: any, b: any) => a.transform[4] - b.transform[4]);
        allRows.push(rowItems.map((item: any) => item.str));
      });
      allRows.push([]); // Page break gap
    }
    return { tables: allRows, title: file.name };
  }
}
