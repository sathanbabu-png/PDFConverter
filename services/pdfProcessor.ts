
// We'll use PDF.js from a CDN for browser-side PDF processing
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export async function pdfToImages(file: File): Promise<string[]> {
  // @ts-ignore
  if (!window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = PDFJS_URL;
    document.head.appendChild(script);
    await new Promise((resolve) => (script.onload = resolve));
  }

  // @ts-ignore
  const pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const imageUrls: string[] = [];

  // Limit to first 5 pages to manage token usage and performance for this demo
  const numPages = Math.min(pdf.numPages, 5);

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    imageUrls.push(canvas.toDataURL('image/jpeg', 0.8));
  }

  return imageUrls;
}
