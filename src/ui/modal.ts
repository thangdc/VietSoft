export type ModalOptions = {
  title: string;
  content: string | HTMLElement;
  closeLabel?: string;
};

export function modalClass(): string {
  return 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4';
}

export function createModal(options: ModalOptions): { element: HTMLDivElement; close: () => void } {
  const overlay = document.createElement('div');
  overlay.className = modalClass();
  overlay.setAttribute('role', 'presentation');

  const dialog = document.createElement('div');
  dialog.className = 'w-full max-w-lg rounded-vs-lg border border-vs-border bg-white shadow-vs-card';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', options.title);

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between border-b border-vs-border px-5 py-4';
  header.innerHTML = '<h2 class="text-base font-semibold">' + options.title + '</h2>';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'rounded p-1 text-vs-muted hover:bg-slate-100 hover:text-vs-text focus:outline-none focus:ring-2 focus:ring-blue-100';
  closeButton.setAttribute('aria-label', options.closeLabel ?? 'Close');
  closeButton.innerHTML = '<i data-lucide="x" class="size-5"></i>';
  header.appendChild(closeButton);

  const body = document.createElement('div');
  body.className = 'px-5 py-5 text-sm text-vs-muted';
  if (typeof options.content === 'string') body.textContent = options.content;
  else body.appendChild(options.content);

  dialog.append(header, body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  return { element: overlay, close };
}
