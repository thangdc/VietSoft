export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const baseClass = 'inline-flex items-center justify-center gap-2 rounded-vs-md border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60';
const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-2.5',
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'border-vs-brand bg-vs-brand font-semibold text-white hover:bg-vs-brand-dark',
  secondary: 'border-vs-border bg-white text-vs-text hover:bg-slate-50',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  ghost: 'border-transparent bg-transparent text-vs-muted hover:bg-slate-100',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return [baseClass, sizeClass[size], variantClass[variant]].join(' ');
}

export function setButtonLoading(button: HTMLButtonElement, loading: boolean, label: string): void {
  button.disabled = loading;
  button.classList.toggle('cursor-wait', loading);
  button.innerHTML = loading
    ? '<i data-lucide="loader-circle" class="size-4 animate-spin"></i><span>Generating...</span>'
    : '<i data-lucide="qr-code" class="size-4"></i><span>' + label + '</span>';
}

export function setButtonIconLabel(button: HTMLButtonElement, icon: string, label: string): void {
  button.innerHTML = '<i data-lucide="' + icon + '" class="size-4"></i><span>' + label + '</span>';
}
