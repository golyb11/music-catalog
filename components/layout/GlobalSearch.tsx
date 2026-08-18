'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Disc3, Music2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { SearchResults } from '@/types';

// Глобальный поиск в шапке: debounce 300 мс, сгруппированная выдача.
export function GlobalSearch() {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(value.trim(), 300);
  const router = useRouter();
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.get<SearchResults>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  const hasResults =
    data && (data.artists.length > 0 || data.albums.length > 0 || data.songs.length > 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="global-search" className="sr-only">
          Глобальный поиск по каталогу
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary"
            aria-hidden
          />
          <input
            id="global-search"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 150);
            }}
            onClick={() => clearTimeout(blurTimer.current)}
            placeholder="Поиск: исполнители, альбомы, песни…"
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-4 text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/70"
          />
          {isFetching && (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-secondary"
              aria-hidden
            />
          )}
        </div>
      </form>

      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          {!hasResults && !isFetching && (
            <p className="px-4 py-6 text-center text-sm text-secondary">
              Ничего не найдено по запросу «{debounced}»
            </p>
          )}

          {data && data.artists.length > 0 && (
            <SearchSection title="Исполнители" icon={Users}>
              {data.artists.map((a) => (
                <SearchItem
                  key={a.id}
                  href={`/artists/${a.id}`}
                  title={a.name}
                  hint={`${a.albumsCount} альб.`}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </SearchSection>
          )}

          {data && data.albums.length > 0 && (
            <SearchSection title="Альбомы" icon={Disc3}>
              {data.albums.map((a) => (
                <SearchItem
                  key={a.id}
                  href={`/albums/${a.id}`}
                  title={a.title}
                  hint={`${a.artistName}, ${a.releaseYear}`}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </SearchSection>
          )}

          {data && data.songs.length > 0 && (
            <SearchSection title="Песни" icon={Music2}>
              {data.songs.map((s) => (
                <SearchItem
                  key={s.id}
                  href={`/songs/${s.id}`}
                  title={s.title}
                  hint={`в ${s.albumsCount} альб.`}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </SearchSection>
          )}
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <p className="flex items-center gap-2 px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-secondary">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {title}
      </p>
      {children}
    </div>
  );
}

function SearchItem({
  href,
  title,
  hint,
  onNavigate,
}: {
  href: string;
  title: string;
  hint?: string;
  onNavigate: () => void;
}) {
  return (
    <a
      href={href}
      onMouseDown={(e) => {
        e.preventDefault();
        onNavigate();
      }}
      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-2"
    >
      <span className="truncate text-primary">{title}</span>
      {hint && <span className="shrink-0 text-xs text-secondary">{hint}</span>}
    </a>
  );
}
