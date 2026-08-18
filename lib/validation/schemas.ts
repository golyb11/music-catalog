import { z } from 'zod';

const currentYear = new Date().getFullYear();
export const MIN_YEAR = 1900;
export const MAX_YEAR = currentYear + 1;

export const artistSchema = z.object({
  name: z
    .string({ required_error: 'Введите имя исполнителя' })
    .trim()
    .min(1, 'Введите имя исполнителя')
    .max(100, 'Имя не должно превышать 100 символов'),
});

export const albumSchema = z.object({
  title: z
    .string({ required_error: 'Введите название альбома' })
    .trim()
    .min(1, 'Введите название альбома')
    .max(200, 'Название не должно превышать 200 символов'),
  artistId: z
    .string({ required_error: 'Выберите исполнителя' })
    .min(1, 'Выберите исполнителя'),
  releaseYear: z.coerce
    .number({ invalid_type_error: 'Год выпуска должен быть числом' })
    .int('Год выпуска должен быть целым числом')
    .min(MIN_YEAR, `Год выпуска: от ${MIN_YEAR} до ${MAX_YEAR}`)
    .max(MAX_YEAR, `Год выпуска: от ${MIN_YEAR} до ${MAX_YEAR}`),
});

export const songSchema = z.object({
  title: z
    .string({ required_error: 'Введите название песни' })
    .trim()
    .min(1, 'Введите название песни')
    .max(200, 'Название не должно превышать 200 символов'),
});

export const addTrackSchema = z
  .object({
    trackNumber: z.coerce
      .number({ invalid_type_error: 'Номер трека должен быть числом' })
      .int('Номер трека должен быть целым числом')
      .min(1, 'Номер трека: целое число от 1 до 999')
      .max(999, 'Номер трека: целое число от 1 до 999')
      .optional(),
    songId: z.string().min(1).optional(),
    newSongTitle: z
      .string()
      .trim()
      .min(1, 'Введите название новой песни')
      .max(200, 'Название не должно превышать 200 символов')
      .optional(),
  })
  .refine((data) => Boolean(data.songId ?? data.newSongTitle), {
    message: 'Выберите существующую песню или введите название новой',
    path: ['songId'],
  });

export const trackNumberSchema = z.object({
  trackNumber: z.coerce
    .number({ invalid_type_error: 'Номер трека должен быть числом' })
    .int('Номер трека должен быть целым числом')
    .min(1, 'Номер трека: целое число от 1 до 999')
    .max(999, 'Номер трека: целое число от 1 до 999'),
});

export type ArtistInput = z.infer<typeof artistSchema>;
export type AlbumInput = z.infer<typeof albumSchema>;
export type SongInput = z.infer<typeof songSchema>;
export type AddTrackInput = z.infer<typeof addTrackSchema>;
