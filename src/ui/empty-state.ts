export type EmptyStateOptions = {
  icon?: string;
  title: string;
  description?: string;
};

export function emptyStateClass(): string {
  return 'flex min-h-48 flex-col items-center justify-center rounded-vs-md border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center';
}

export function createEmptyState(options: EmptyStateOptions): HTMLDivElement {
  const element = document.createElement('div');
  element.className = emptyStateClass();
  element.innerHTML = [
    '<div class="grid size-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">',
    '<i data-lucide="' + (options.icon ?? 'inbox') + '" class="size-6"></i>',
    '</div>',
    '<h3 class="mt-3 text-sm font-semibold text-vs-text">' + options.title + '</h3>',
    options.description ? '<p class="mt-1 max-w-sm text-xs leading-5 text-vs-muted">' + options.description + '</p>' : '',
  ].join('');
  return element;
}
