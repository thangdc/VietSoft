export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const variantClass: Record<AlertVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
};

export function alertClass(variant: AlertVariant = 'info'): string {
  return ['flex items-start gap-3 rounded-vs-md border px-4 py-3 text-sm', variantClass[variant]].join(' ');
}
