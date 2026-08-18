'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Pencil, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ArtistAvatar } from '@/components/ui/ArtistAvatar';
import { ArtistFormModal } from '@/components/forms/ArtistFormModal';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError, pluralizeAlbums } from '@/lib/api-client';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { ArtistListItem } from '@/types';

const PAGE_SIZE = 12;

export default function ArtistsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<ArtistListItem | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['artists', debouncedSearch],
    queryFn: () =>
      api.get<ArtistListItem[]>(`/api/artists?search=${encodeURIComponent(debouncedSearch)}`),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/artists/${id}`),
    onSuccess: async () => {
      toast.showToast('success', 'Исполнитель удалён');
      setDeleting(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['artists'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]);
    },
    onError: (e) => {
      toast.showToast('error', e instanceof ApiError ? e.message : 'Не удалось удалить исполнителя');
      setDeleting(null);
    },
  });

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const artists = data ?? [];
  const totalPages = Math.max(1, Math.ceil(artists.length / PAGE_SIZE));
  const pageItems = artists.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Исполнители</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Добавить исполнителя
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary"
          aria-hidden
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по имени исполнителя…"
          aria-label="Поиск по имени исполнителя"
          className="h-11 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/70"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Не удалось загрузить список исполнителей"
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Повторить
            </Button>
          }
        />
      ) : artists.length === 0 ? (
        debouncedSearch ? (
          <EmptyState
            icon={Users}
            title="Ничего не найдено"
            description={`По запросу «${debouncedSearch}» исполнители не найдены.`}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Пока нет исполнителей"
            description="Добавьте первого исполнителя, затем создавайте альбомы и песни."
            action={<Button onClick={() => setFormOpen(true)}>Добавить исполнителя</Button>}
          />
        )
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((artist) => (
              <li
                key={artist.id}
                className="group rounded-2xl border border-border bg-surface p-4 shadow-card transition-colors hover:border-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/artists/${artist.id}`} className="shrink-0" aria-label={`Открыть ${artist.name}`}>
                    <ArtistAvatar name={artist.name} />
                  </Link>
                  <Link href={`/artists/${artist.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-primary group-hover:text-accent" title={artist.name}>
                      {artist.name}
                    </p>
                    <p className="text-sm text-secondary">{pluralizeAlbums(artist.albumsCount)}</p>
                  </Link>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Редактировать исполнителя ${artist.name}`}
                    onClick={() => {
                      setEditing(artist);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить исполнителя ${artist.name}`}
                    className="hover:text-danger"
                    onClick={() => setDeleting(artist)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ArtistFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        artist={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        loading={deleteMutation.isPending}
        title="Удалить исполнителя"
        message={
          deleting
            ? deleting.albumsCount > 0
              ? `У исполнителя «${deleting.name}» есть альбомы (${deleting.albumsCount}). Удаление невозможно: сначала удалите его альбомы.`
              : `Удалить исполнителя «${deleting.name}»? Это действие необратимо.`
            : ''
        }
        confirmLabel={deleting && deleting.albumsCount > 0 ? 'Понятно' : 'Удалить'}
      />
    </div>
  );
}
