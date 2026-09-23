import type { QrType, QrTypeDefinition } from './types';

export const qrTypes: readonly QrTypeDefinition[] = [
  { id: 'url', label: 'URL', icon: 'link', title: 'Tạo QR cho URL' },
  { id: 'text', label: 'Văn bản', icon: 'file-text', title: 'Tạo QR cho văn bản' },
  { id: 'contact', label: 'Liên hệ', icon: 'contact', title: 'Tạo QR cho liên hệ' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi', title: 'Tạo QR cho Wi-Fi' },
  { id: 'email', label: 'Email', icon: 'mail', title: 'Tạo QR cho Email' },
  { id: 'phone', label: 'Điện thoại', icon: 'phone', title: 'Tạo QR cho số điện thoại' },
  { id: 'sms', label: 'SMS', icon: 'message-square', title: 'Tạo QR cho SMS' },
  { id: 'location', label: 'Vị trí', icon: 'map-pin', title: 'Tạo QR cho vị trí' },
  { id: 'payment', label: 'Thanh toán', icon: 'wallet-cards', title: 'Tạo QR thanh toán' },
];

export function getQrType(id: string): QrTypeDefinition | undefined {
  return qrTypes.find((item) => item.id === id);
}

export function isQrType(value: string): value is QrType {
  return qrTypes.some((item) => item.id === value);
}
