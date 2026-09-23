import type { QrType } from '../qr-generator/types';

export type QrHistoryItem = {
  historyId: string;
  type: QrType;
  fields: Record<string, unknown>;
  data: string;
  design?: {
    foreground: string;
    background: string;
    style: 'square' | 'rounded' | 'dot';
    logoDataUrl?: string;
  };
  createdAt: number;
  updatedAt: number;
};

export type QrHistoryState = {
  items: readonly QrHistoryItem[];
  selectedId: string;
  search: string;
  page: number;
  pageSize: number;
};

export type QrHistoryActions = {
  select: (historyId: string) => void;
  remove: (historyId: string) => Promise<void>;
  clear: () => Promise<void>;
};