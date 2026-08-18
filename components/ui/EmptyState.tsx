import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
        <Icon className="h-7 w-7 text-secondary" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {description && <p className="max-w-md text-sm text-secondary">{description}</p>}
      {action}
    </div>
  );
}
