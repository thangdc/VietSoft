import type { AlertVariant } from './alert';

export type ToastOptions = {
  message: string;
  variant?: AlertVariant;
  duration?: number;
};

export function showToast(options: ToastOptions): HTMLDivElement {
  const toast = document.createElement('div');
  toast.className = [
    'pointer-events-auto flex max-w-sm items-start gap-3 rounded-vs-md border bg-white px-4 py-3 text-sm shadow-vs-card',
    options.variant === 'success' ? 'border-emerald-200' :
      options.variant === 'danger' ? 'border-red-200' :
        'border-vs-border',
  ].join(' ');
  toast.setAttribute('role', 'status');
  toast.textContent = options.message;

  let root = document.querySelector<HTMLElement>('[data-ui-toast-root]');
  if (!root) {
    root = document.createElement('div');
    root.dataset.uiToastRoot = '';
    root.className = 'pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto';
    document.body.appendChild(root);
  }

  root.appendChild(toast);
  window.setTimeout(() => toast.remove(), options.duration ?? 3000);
  return toast;
}
