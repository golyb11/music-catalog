import { coverGradient, initials } from '@/lib/utils';

// Адаптивная обложка-плейсхолдер: детерминированный градиент + инициалы альбома.
export function CoverPlaceholder({
  title,
  className,
  textClassName,
}: {
  title: string;
  className?: string;
  textClassName?: string;
}) {
  const { from, to } = coverGradient(title);
  return (
    <div
      className={`flex items-center justify-center ${className ?? ''}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      role="img"
      aria-label={`Обложка альбома ${title}`}
    >
      <span
        className={`select-none font-bold tracking-wide text-white/90 ${
          textClassName ?? 'text-3xl'
        }`}
      >
        {initials(title)}
      </span>
    </div>
  );
}
