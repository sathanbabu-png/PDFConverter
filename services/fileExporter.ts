
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle } from 'docx';
import * as XLSX from 'xlsx';
import { ExtractedData, OutputFormat } from '../types';

export async function exportFile(data: ExtractedData, format: OutputFormat, originalName: string) {
  const baseName = originalName.replace(/\.[^/.]+$/, "");

  if (format === OutputFormat.WORD) {
    // Basic Markdown to DOCX conversion logic
    const lines = data.content?.split('\n') || [];
    const children = lines.map(line => {
      if (line.startsWith('# ')) return new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1 });
      if (line.startsWith('## ')) return new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2 });
      if (line.startsWith('### ')) return new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3 });
      return new Paragraph({
        children: [new TextRun(line)]
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${baseName}.docx`);
  } else {
    // Excel Export
    if (!data.tables || data.tables.length === 0) return;
    
    const ws = XLSX.utils.aoa_to_sheet(data.tables);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    downloadBlob(blob, `${baseName}.xlsx`);
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
