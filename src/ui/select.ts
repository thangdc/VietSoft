export function selectClass(): string {
  return 'min-w-0 w-full appearance-none rounded-vs-md border border-vs-border bg-white px-3 py-2.5 text-sm text-vs-text outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50';
}

export function createSelect(
  select: HTMLSelectElement,
  options: Array<{ value: string; label: string }>,
  value?: string,
): void {
  select.className = selectClass();
  select.replaceChildren();

  options.forEach((option) => {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  });

  if (value !== undefined) select.value = value;
}
