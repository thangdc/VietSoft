export type BadgeVariant = 'neutral' | 'success' | 'info' | 'danger';

const badgeBase = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium';
const badgeVariant: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-700',
  info: 'bg-blue-50 text-blue-700',
  danger: 'bg-red-50 text-red-700',
};

export function badgeClass(variant: BadgeVariant = 'neutral'): string {
  return [badgeBase, badgeVariant[variant]].join(' ');
}
