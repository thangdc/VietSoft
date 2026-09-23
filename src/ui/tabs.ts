export type TabItem = {
  id: string;
  label: string;
  icon?: string;
};

export type TabsOptions = {
  activeId?: string;
  onChange?: (id: string) => void;
};

const tabListClass =
  'flex flex-wrap gap-1 border-b border-vs-border';
const tabClass =
  'inline-flex items-center gap-2 rounded-t-vs-md border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-vs-muted transition hover:bg-slate-50 hover:text-vs-text focus:outline-none focus:ring-2 focus:ring-blue-100';
const activeClass =
  'border-vs-brand bg-blue-50/60 text-vs-brand';

export function tabsClass(): string {
  return tabListClass;
}

export function tabItemClass(active = false): string {
  return [tabClass, active ? activeClass : ''].filter(Boolean).join(' ');
}

export function createTabs(
  container: HTMLElement,
  items: TabItem[],
  options: TabsOptions = {},
): { getActiveId: () => string; setActive: (id: string) => void } {
  let activeId = options.activeId && items.some((item) => item.id === options.activeId)
    ? options.activeId
    : items[0]?.id ?? '';

  container.className = tabsClass();
  container.setAttribute('role', 'tablist');

  const buttons = new Map<string, HTMLButtonElement>();

  const render = () => {
    buttons.forEach((button, id) => {
      const active = id === activeId;
      button.className = tabItemClass(active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  };

  items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.dataset.tabId = item.id;
    button.innerHTML = [
      item.icon ? '<i data-lucide="' + item.icon + '" class="size-4"></i>' : '',
      '<span>' + item.label + '</span>',
    ].join('');
    button.addEventListener('click', () => {
      if (activeId === item.id) return;
      activeId = item.id;
      render();
      options.onChange?.(activeId);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();

      const index = items.findIndex((candidate) => candidate.id === activeId);
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = items[(index + offset + items.length) % items.length];
      if (!next) return;

      activeId = next.id;
      render();
      buttons.get(activeId)?.focus();
      options.onChange?.(activeId);
    });

    buttons.set(item.id, button);
    container.appendChild(button);
  });

  render();

  return {
    getActiveId: () => activeId,
    setActive: (id: string) => {
      if (!items.some((item) => item.id === id)) return;
      if (activeId === id) return;
      activeId = id;
      render();
      options.onChange?.(activeId);
    },
  };
}
