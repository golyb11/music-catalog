import { coverGradient, initials } from '@/lib/utils';

export function ArtistAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { from, to } = coverGradient(name);
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white/90 ${
        className ?? 'h-12 w-12 text-base'
      }`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      role="img"
      aria-label={`Аватар исполнителя ${name}`}
    >
      {initials(name)}
    </div>
  );
}
