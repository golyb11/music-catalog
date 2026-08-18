'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Music2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { AlbumTrackItem } from '@/types';

// Список треков альбома: перетаскивание на десктопе, кнопки вверх/вниз на мобильном.
// Перестановка реализована как обмен номерами двух треков через API.
export function TrackList({
  albumId,
  tracks,
}: {
  albumId: string;
  tracks: AlbumTrackItem[];
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [trackToRemove, setTrackToRemove] = useState<AlbumTrackItem | null>(null);

  const reorderMutation = useMutation({
    mutationFn: (vars: { trackId: string; trackNumber: number }) =>
      api.put<AlbumTrackItem>(`/api/albums/${albumId}/tracks/${vars.trackId}`, {
        trackNumber: vars.trackNumber,
      }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['album', albumId] });
      const previous = queryClient.getQueryData<AlbumTrackItems>(['album', albumId]);
      queryClient.setQueryData<AlbumTrackItems>(['album', albumId], (old) =>
        optimisticSwap(old, vars.trackId, vars.trackNumber)
      );
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['album', albumId], ctx.previous);
      toast.showToast('error', 'Не удалось изменить порядок треков');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['album', albumId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (trackId: string) =>
      api.delete(`/api/albums/${albumId}/tracks/${trackId}`),
    onSuccess: async () => {
      toast.showToast('success', 'Трек убран из альбома');
      setTrackToRemove(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['album', albumId] }),
        queryClient.invalidateQueries({ queryKey: ['songs'] }),
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
      ]);
    },
    onError: (e) => {
      toast.showToast('error', e instanceof ApiError ? e.message : 'Не удалось удалить трек');
    },
  });

  const move = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= tracks.length) return;
    const target = tracks[toIndex];
    const moving = tracks[fromIndex];
    reorderMutation.mutate({
      trackId: moving.trackId,
      trackNumber: target.trackNumber,
    });
  };

  const onDrop = (index: number) => {
    if (dragIndex !== null) move(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  };

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={Music2}
        title="В альбоме пока нет треков"
        description="Добавьте первую песню — существующую из каталога или создайте новую прямо в форме."
      />
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-2">
        {tracks.map((track, index) => (
          <li
            key={track.trackId}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragEnter={() => setOverIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDrop={() => onDrop(index)}
            className={cn(
              'flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors',
              dragIndex === index && 'opacity-50',
              overIndex === index && dragIndex !== null && dragIndex !== index && 'border-accent'
            )}
          >
            <span
              className="hidden cursor-grab text-secondary md:inline-flex"
              aria-hidden
              title="Перетащите, чтобы поменять треки местами"
            >
              <GripVertical className="h-5 w-5" />
            </span>

            <span
              className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold text-accent"
              aria-label={`Трек номер ${track.trackNumber}`}
            >
              {track.trackNumber}
            </span>

            <Link
              href={`/songs/${track.song.id}`}
              className="min-w-0 flex-1 truncate text-sm font-medium text-primary hover:text-accent"
              title={track.song.title}
            >
              {track.song.title}
            </Link>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Переместить трек «${track.song.title}» вверх`}
                disabled={index === 0 || reorderMutation.isPending}
                onClick={() => move(index, index - 1)}
                className="h-11 w-11"
              >
                <ChevronUp className="h-5 w-5" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Переместить трек «${track.song.title}» вниз`}
                disabled={index === tracks.length - 1 || reorderMutation.isPending}
                onClick={() => move(index, index + 1)}
                className="h-11 w-11"
              >
                <ChevronDown className="h-5 w-5" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Убрать трек «${track.song.title}» из альбома`}
                onClick={() => setTrackToRemove(track)}
                className="text-secondary hover:text-danger"
              >
                <Trash2 className="h-5 w-5" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <ConfirmDialog
        open={trackToRemove !== null}
        onClose={() => setTrackToRemove(null)}
        onConfirm={() => trackToRemove && removeMutation.mutate(trackToRemove.trackId)}
        loading={removeMutation.isPending}
        title="Убрать трек из альбома"
        confirmLabel="Убрать"
        message={
          trackToRemove
            ? `Убрать песню «${trackToRemove.song.title}» из альбома? Сама песня останется в каталоге.`
            : ''
        }
      />
    </>
  );
}

// Локальный (оптимистичный) обмен номерами двух треков до подтверждения сервером.
function optimisticSwap(
  album: { tracks: AlbumTrackItem[] } | undefined,
  trackId: string,
  newNumber: number
): { tracks: AlbumTrackItem[] } | undefined {
  if (!album) return album;
  const moving = album.tracks.find((t) => t.trackId === trackId);
  if (!moving || moving.trackNumber === newNumber) return album;

  const occupier = album.tracks.find(
    (t) => t.trackId !== trackId && t.trackNumber === newNumber
  );

  const tracks = album.tracks.map((t) => {
    if (t.trackId === trackId) return { ...t, trackNumber: newNumber };
    if (occupier && t.trackId === occupier.trackId)
      return { ...t, trackNumber: moving.trackNumber };
    return t;
  });
  tracks.sort((a, b) => a.trackNumber - b.trackNumber);
  return { ...album, tracks };
}

type AlbumTrackItems = { tracks: AlbumTrackItem[]; [key: string]: unknown };
