export type ImportFormat = 'xlsx' | 'xls';
export type ExportFormat = 'xlsx' | 'zip';

export type ImportExportState = {
  busy: boolean;
  format?: ImportFormat | ExportFormat;
  status: string;
  processed: number;
  total: number;
};

export type ImportExportActions = {
  import: (file: File) => Promise<void>;
  export: (format: ExportFormat) => Promise<void>;
  print: () => Promise<void>;
};