export function loadingClass(): string {
  return 'inline-flex items-center gap-2 text-sm text-vs-muted';
}

export function setLoading(
  container: HTMLElement,
  loading: boolean,
  label = 'Loading...',
): void {
  container.className = loading ? loadingClass() : '';
  container.innerHTML = loading
    ? '<i data-lucide="loader-circle" class="size-4 animate-spin"></i><span>' + label + '</span>'
    : '';
}
