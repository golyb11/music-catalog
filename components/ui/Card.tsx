import { cn } from '@/lib/utils';

export function Card({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-card',
        className
      )}
      {...rest}
    />
  );
}
