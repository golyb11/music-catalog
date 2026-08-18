'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Disc3, Music2, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { api } from '@/lib/api-client';
import type { SearchResults } from '@/types';

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('q') ?? '';

  const [value, setValue] = useState(initial);
  const debounced = useDebounce(value.trim(), 300);

  // Синхронизация адресной строки с запросом без перезагрузки
  useEffect(() => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (debounced) current.set('q', debounced);
    else current.delete('q');
    router.replace(`/search?${current.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.get<SearchResults>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 1,
    staleTime: 30_000,
  });

  const nothingFound =
    data && data.artists.length === 0 && data.albums.length === 0 && data.songs.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Поиск по каталогу</h1>

      <div className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary"
          aria-hidden
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Исполнители, альбомы, песни…"
          aria-label="Поиск по каталогу"
          autoFocus
          className="h-12 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-10 text-base text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/70"
        />
        {isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-secondary"
            aria-hidden
          />
        )}
      </div>

      {debounced.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Начните вводить запрос"
          description="Поиск работает по названиям исполнителей, альбомов и песен."
        />
      ) : isError ? (
        <EmptyState icon={Search} title="Ошибка поиска" description="Попробуйте ещё раз." />
      ) : nothingFound && !isFetching ? (
        <EmptyState
          icon={Search}
          title="Ничего не найдено"
          description={`По запросу «${debounced}» совпадений нет.`}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <ResultSection
            title="Исполнители"
            icon={Users}
            items={data?.artists.map((a) => ({
              href: `/artists/${a.id}`,
              primary: a.name,
              secondary: `${a.albumsCount} альб.`,
            }))}
          />
          <ResultSection
            title="Альбомы"
            icon={Disc3}
            items={data?.albums.map((a) => ({
              href: `/albums/${a.id}`,
              primary: a.title,
              secondary: `${a.artistName}, ${a.releaseYear}`,
            }))}
          />
          <ResultSection
            title="Песни"
            icon={Music2}
            items={data?.songs.map((s) => ({
              href: `/songs/${s.id}`,
              primary: s.title,
              secondary: `в ${s.albumsCount} альб.`,
            }))}
          />
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Users;
  items?: { href: string; primary: string; secondary: string }[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-label={title}>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-secondary">
        <Icon className="h-4 w-4" aria-hidden />
        {title}
      </h2>
      <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
        {items.map((item) => (
          <li key={item.href} className="border-b border-border last:border-b-0">
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-2"
            >
              <span className="truncate font-medium text-primary">{item.primary}</span>
              <span className="shrink-0 text-xs text-secondary">{item.secondary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
