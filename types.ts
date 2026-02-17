
export enum OutputFormat {
  WORD = 'WORD',
  EXCEL = 'EXCEL'
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

export interface ExtractedData {
  content?: string; // For Word (Markdown or structured text)
  tables?: Array<Array<any>>; // For Excel
  title?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  file: File;
}
