import { pdfjs } from 'react-pdf';

// Use local worker files
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).href;

export const pdfWorker = {
  // ...
}; 