'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Music2, Plus, Search, Pencil, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SongFormModal } from '@/components/forms/SongFormModal';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { SongListItem } from '@/types';

const PAGE_SIZE = 20;

export default function SongsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState<SongListItem | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['songs', debouncedSearch],
    queryFn: () => api.get<SongListItem[]>(`/api/songs?search=${encodeURIComponent(debouncedSearch)}`),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/songs/${id}`),
    onSuccess: async () => {
      toast.showToast('success', 'Песня удалена из каталога и всех альбомов');
      setDeleting(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['songs'] }),
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
        queryClient.invalidateQueries({ queryKey: ['album'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
      ]);
    },
    onError: (e) => {
      toast.showToast('error', e instanceof ApiError ? e.message : 'Не удалось удалить песню');
      setDeleting(null);
    },
  });

  const songs = data ?? [];
  const totalPages = Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  const pageItems = songs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Песни</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Добавить песню
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary"
          aria-hidden
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Поиск по названию песни…"
          aria-label="Поиск по названию песни"
          className="h-11 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-primary placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/70"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Не удалось загрузить песни"
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Повторить
            </Button>
          }
        />
      ) : songs.length === 0 ? (
        debouncedSearch ? (
          <EmptyState
            icon={Music2}
            title="Ничего не найдено"
            description={`По запросу «${debouncedSearch}» песни не найдены.`}
          />
        ) : (
          <EmptyState
            icon={Music2}
            title="Пока нет песен"
            description="Добавьте первую песню — её можно будет включить в трек-листы альбомов."
            action={<Button onClick={() => setFormOpen(true)}>Добавить песню</Button>}
          />
        )
      ) : (
        <>
          {/* Таблица на планшетах и десктопе */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-secondary">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Название
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    В альбомах
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((song) => (
                  <tr key={song.id} className="border-b border-border last:border-b-0 hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/songs/${song.id}`}
                        className="font-medium text-primary hover:text-accent"
                      >
                        {song.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-secondary">{song.albumsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Редактировать песню ${song.title}`}
                          onClick={() => {
                            setEditing(song);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Удалить песню ${song.title}`}
                          className="hover:text-danger"
                          onClick={() => setDeleting(song)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Стек карточек на мобильных */}
          <ul className="flex flex-col gap-2 md:hidden">
            {pageItems.map((song) => (
              <li key={song.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/songs/${song.id}`}
                    className="min-w-0 flex-1 font-medium text-primary hover:text-accent"
                  >
                    {song.title}
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Редактировать песню ${song.title}`}
                      onClick={() => {
                        setEditing(song);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Удалить песню ${song.title}`}
                      className="hover:text-danger"
                      onClick={() => setDeleting(song)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-secondary">В альбомах: {song.albumsCount}</p>
              </li>
            ))}
          </ul>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <SongFormModal open={formOpen} onClose={() => setFormOpen(false)} song={editing} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        loading={deleteMutation.isPending}
        title="Удалить песню"
        message={
          deleting
            ? deleting.albumsCount > 0
              ? `Песня «${deleting.title}» входит в ${deleting.albumsCount} альбом(ов). Удалить её везде?`
              : `Удалить песню «${deleting.title}»?`
            : ''
        }
      />
    </div>
  );
}
