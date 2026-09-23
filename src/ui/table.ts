export type TableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
};

export function tableClass(): string {
  return 'w-full border-collapse text-sm';
}

export function tableHeaderClass(): string {
  return 'border-b border-vs-border bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-vs-muted';
}

export function tableCellClass(align: TableColumn['align'] = 'left'): string {
  const alignment = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return ['border-b border-vs-border px-3 py-3 text-vs-text', alignment].join(' ');
}

export function createTable<T extends Record<string, unknown>>(
  container: HTMLElement,
  columns: TableColumn[],
  rows: T[],
): HTMLTableElement {
  const table = document.createElement('table');
  table.className = tableClass();

  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  columns.forEach((column) => {
    const th = document.createElement('th');
    th.className = tableHeaderClass() + ' ' + (column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left');
    th.textContent = column.label;
    headerRow.appendChild(th);
  });
  head.appendChild(headerRow);

  const body = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    columns.forEach((column) => {
      const td = document.createElement('td');
      td.className = tableCellClass(column.align);
      td.textContent = String(row[column.key] ?? '');
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });

  table.append(head, body);
  container.replaceChildren(table);
  return table;
}
