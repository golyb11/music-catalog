'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import { albumSchema, MAX_YEAR, MIN_YEAR } from '@/lib/validation/schemas';
import type { ArtistListItem } from '@/types';

export function AlbumFormModal({
  open,
  onClose,
  album,
}: {
  open: boolean;
  onClose: () => void;
  album?: { id: string; title: string; releaseYear: number; artistId: string } | null;
}) {
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTitle(album?.title ?? '');
      setArtistId(album?.artistId ?? '');
      setReleaseYear(album ? String(album.releaseYear) : String(new Date().getFullYear()));
      setFieldErrors({});
    }
  }, [open, album]);

  const { data: artists } = useQuery({
    queryKey: ['artists', ''],
    queryFn: () => api.get<ArtistListItem[]>('/api/artists'),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data: { title: string; artistId: string; releaseYear: number }) =>
      album
        ? api.put(`/api/albums/${album.id}`, data)
        : api.post('/api/albums', data),
    onSuccess: async () => {
      toast.showToast('success', album ? 'Альбом обновлён' : 'Альбом добавлен');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
        queryClient.invalidateQueries({ queryKey: ['artists'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
      ]);
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(e.fieldErrors)) {
          if (messages?.[0]) errors[key] = messages[0];
        }
        setFieldErrors(errors);
        if (Object.keys(errors).length === 0) {
          toast.showToast('error', e.message);
        }
      } else if (e instanceof ApiError) {
        toast.showToast('error', e.message);
      } else {
        toast.showToast('error', 'Не удалось сохранить альбом');
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = albumSchema.safeParse({ title, artistId, releaseYear });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      if (flat.title?.[0]) errors.title = flat.title[0];
      if (flat.artistId?.[0]) errors.artistId = flat.artistId[0];
      if (flat.releaseYear?.[0]) errors.releaseYear = flat.releaseYear[0];
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <Modal open={open} onClose={onClose} title={album ? 'Редактировать альбом' : 'Добавить альбом'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Название альбома"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          placeholder="Например, The Dark Side of the Moon"
          autoFocus
        />
        <Select
          label="Исполнитель"
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
          error={fieldErrors.artistId}
          placeholder="Выберите исполнителя"
          options={(artists ?? []).map((a) => ({ value: a.id, label: a.name }))}
        />
        <Input
          label={`Год выпуска (${MIN_YEAR}–${MAX_YEAR})`}
          type="number"
          inputMode="numeric"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value)}
          error={fieldErrors.releaseYear}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
