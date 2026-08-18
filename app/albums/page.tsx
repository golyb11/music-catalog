'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Disc3, Plus, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { AlbumCard } from '@/components/albums/AlbumCard';
import { AlbumFormModal } from '@/components/forms/AlbumFormModal';
import { api } from '@/lib/api-client';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { AlbumCardData, ArtistListItem } from '@/types';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'title', label: 'По названию (А–Я)' },
  { value: 'year', label: 'По году (сначала новые)' },
];

export default function AlbumsPage() {
  const [search, setSearch] = useState('');
  const [artistId, setArtistId] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search.trim(), 300);
  const debouncedYear = useDebounce(year.trim(), 300);

  const { data: artists } = useQuery({
    queryKey: ['artists', ''],
    queryFn: () => api.get<ArtistListItem[]>('/api/artists'),
  });

  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (artistId) queryParams.set('artistId', artistId);
  if (debouncedYear) queryParams.set('year', debouncedYear);
  if (sort) queryParams.set('sort', sort);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['albums', debouncedSearch, artistId, debouncedYear, sort],
    queryFn: () => api.get<AlbumCardData[]>(`/api/albums?${queryParams.toString()}`),
    placeholderData: (prev) => prev,
  });

  const albums = data ?? [];
  const totalPages = Math.max(1, Math.ceil(albums.length / PAGE_SIZE));
  const pageItems = albums.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Boolean(debouncedSearch || artistId || debouncedYear);

  const onFilterChange = (resetPage = true) => {
    if (resetPage) setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Альбомы</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Добавить альбом
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onFilterChange();
            }}
            placeholder="Поиск по названию…"
            aria-label="Поиск альбома по названию"
            className="h-11 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/70"
          />
        </div>

        <Select
          aria-label="Фильтр по исполнителю"
          value={artistId}
          onChange={(e) => {
            setArtistId(e.target.value);
            onFilterChange();
          }}
          placeholder="Все исполнители"
          options={(artists ?? []).map((a) => ({ value: a.id, label: a.name }))}
        />

        <input
          type="number"
          inputMode="numeric"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            onFilterChange();
          }}
          placeholder="Год выпуска, например 1973"
          aria-label="Фильтр по году выпуска"
          min={1900}
          max={new Date().getFullYear() + 1}
          className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/70"
        />

        <Select
          aria-label="Сортировка альбомов"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            onFilterChange();
          }}
          options={SORT_OPTIONS}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface-2" />
              <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Не удалось загрузить альбомы"
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Повторить
            </Button>
          }
        />
      ) : albums.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Disc3}
            title="Ничего не найдено"
            description="Попробуйте изменить условия поиска или сбросить фильтры."
          />
        ) : (
          <EmptyState
            icon={Disc3}
            title="Пока нет альбомов"
            description="Добавьте первый альбом — выберите исполнителя, укажите название и год."
            action={<Button onClick={() => setFormOpen(true)}>Добавить альбом</Button>}
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <AlbumFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
