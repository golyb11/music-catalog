'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api-client';
import { songSchema } from '@/lib/validation/schemas';

export function SongFormModal({
  open,
  onClose,
  song,
}: {
  open: boolean;
  onClose: () => void;
  song?: { id: string; title: string } | null;
}) {
  const [title, setTitle] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTitle(song?.title ?? '');
      setFieldErrors({});
    }
  }, [open, song]);

  const mutation = useMutation({
    mutationFn: (data: { title: string }) =>
      song ? api.put(`/api/songs/${song.id}`, data) : api.post('/api/songs', data),
    onSuccess: async () => {
      toast.showToast('success', song ? 'Песня обновлена' : 'Песня добавлена');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['songs'] }),
        queryClient.invalidateQueries({ queryKey: ['song'] }),
        queryClient.invalidateQueries({ queryKey: ['album'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
        queryClient.invalidateQueries({ queryKey: ['search'] }),
      ]);
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        if (e.fieldErrors?.title) {
          setFieldErrors({ title: e.fieldErrors.title[0] });
        } else {
          toast.showToast('error', e.message);
        }
      } else {
        toast.showToast('error', 'Не удалось сохранить песню');
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = songSchema.safeParse({ title });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ title: flat.title?.[0] ?? 'Проверьте поле' });
      return;
    }
    setFieldErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <Modal open={open} onClose={onClose} title={song ? 'Редактировать песню' : 'Добавить песню'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Название песни"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          placeholder="Например, Bohemian Rhapsody"
          autoFocus
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
