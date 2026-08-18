'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Music2, Pencil, Trash2, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SongFormModal } from '@/components/forms/SongFormModal';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import type { SongDetail } from '@/types';

export default function SongDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: song, isLoading, isError } = useQuery({
    queryKey: ['song', id],
    queryFn: () => api.get<SongDetail>(`/api/songs/${id}`),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 1;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/songs/${id}`),
    onSuccess: async () => {
      toast.showToast('success', 'Песня удалена из каталога и всех альбомов');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['songs'] }),
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
        queryClient.invalidateQueries({ queryKey: ['album'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]);
      router.push('/songs');
    },
    onError: (e) => {
      toast.showToast('error', e instanceof ApiError ? e.message : 'Не удалось удалить песню');
      setDeleteOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-6 w-40 animate-pulse rounded bg-surface-2" />
        <div className="space-y-2">
          <div className="h-8 w-1/2 animate-pulse rounded bg-surface-2" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-surface-2" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !song) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState
          icon={Music2}
          title="Песня не найдена"
          description="Возможно, она была удалена."
          action={
            <Link href="/songs">
              <Button variant="secondary">К списку песен</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
          <Music2 className="h-8 w-8 text-accent" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-primary" title={song.title}>
            {song.title}
          </h1>
          <p className="text-sm text-secondary">
            {song.albums.length > 0
              ? `Входит в альбомов: ${song.albums.length}`
              : 'Не добавлена ни в один альбом'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Редактировать
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Удалить
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-primary">Альбомы с этой песней</h2>

        {song.albums.length === 0 ? (
          <EmptyState
            icon={Disc3}
            title="Песня пока не добавлена ни в один альбом"
            description="Откройте альбом и добавьте её в трек-лист."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {song.albums.map((entry) => (
              <li
                key={entry.trackId}
                className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <Badge variant="accent" className="sm:w-24 sm:justify-center">
                  Трек № {entry.trackNumber}
                </Badge>
                <Link
                  href={`/albums/${entry.album.id}`}
                  className="min-w-0 flex-1 font-medium text-primary hover:text-accent"
                >
                  {entry.album.title}
                </Link>
                <Link
                  href={`/artists/${entry.album.artist.id}`}
                  className="text-sm text-secondary hover:text-accent"
                >
                  {entry.album.artist.name}
                </Link>
                <span className="text-sm text-secondary">{entry.album.releaseYear}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-secondary">
          Одна и та же песня может входить в разные альбомы с разными порядковыми номерами.
        </p>
      </section>

      <SongFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        song={{ id: song.id, title: song.title }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Удалить песню"
        message={
          song.albums.length > 0
            ? `Песня «${song.title}» входит в ${song.albums.length} альбом(ов). Удалить её везде?`
            : `Удалить песню «${song.title}»?`
        }
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/songs"
      className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Все песни
    </Link>
  );
}
