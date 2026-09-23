export function checkboxClass(): string {
  return 'size-4 rounded border-vs-border text-vs-brand accent-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed';
}

export function checkboxLabelClass(): string {
  return 'inline-flex cursor-pointer items-center gap-2 text-sm text-vs-text';
}

export function createCheckbox(
  input: HTMLInputElement,
  label: string,
): HTMLLabelElement {
  input.type = 'checkbox';
  input.className = checkboxClass();

  const wrapper = document.createElement('label');
  wrapper.className = checkboxLabelClass();
  input.parentNode?.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  const text = document.createElement('span');
  text.textContent = label;
  wrapper.appendChild(text);

  return wrapper;
}
