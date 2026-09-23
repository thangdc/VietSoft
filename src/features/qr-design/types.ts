export type QrDesign = {
  foreground: string;
  background: string;
  style: 'square' | 'rounded' | 'dot';
  logoDataUrl?: string;
};

export type QrDesignState = {
  design: QrDesign;
  dirty: boolean;
  busy: boolean;
};

export type QrDesignActions = {
  update: (design: QrDesign) => void;
  apply: () => Promise<void>;
  reset: () => void;
};