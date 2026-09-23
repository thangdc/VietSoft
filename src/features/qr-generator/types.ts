export type QrType =
  | 'url'
  | 'text'
  | 'contact'
  | 'wifi'
  | 'email'
  | 'phone'
  | 'sms'
  | 'location'
  | 'payment';

export type QrTypeDefinition = {
  id: QrType;
  label: string;
  icon: string;
  title: string;
};

export type QrGeneratorState = {
  type: QrType;
  data: string;
  historyId: string;
  busy: boolean;
};
