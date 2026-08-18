import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'accent';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium',
        variant === 'accent'
          ? 'bg-accent/15 text-accent'
          : 'bg-surface-2 text-secondary',
        className
      )}
      {...rest}
    />
  );
}
