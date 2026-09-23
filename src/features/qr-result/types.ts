export type QrResultState = {
  data: string;
  imageUrl: string;
  canDownload: boolean;
  canCopy: boolean;
  canOpen: boolean;
};

export type QrResultActions = {
  download: () => void;
  copy: () => Promise<void>;
  open: () => void;
};

export type QrResultView = QrResultState & {
  status: string;
  busy: boolean;
};