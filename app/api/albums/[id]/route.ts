export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, readValidatedBody } from '@/lib/api';
import { albumSchema } from '@/lib/validation/schemas';
import type { AlbumDetail } from '@/types';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const album = await prisma.album.findUnique({
      where: { id: params.id },
      include: {
        artist: { select: { id: true, name: true } },
        tracks: {
          include: { song: { select: { id: true, title: true } } },
          orderBy: { trackNumber: 'asc' },
        },
      },
    });
    if (!album) return jsonError(404, 'Альбом не найден');

    const result: AlbumDetail = {
      id: album.id,
      title: album.title,
      releaseYear: album.releaseYear,
      artist: album.artist,
      tracks: album.tracks.map((t) => ({
        trackId: t.id,
        trackNumber: t.trackNumber,
        song: t.song,
      })),
    };
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  const parsed = await readValidatedBody(req, albumSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const artist = await prisma.artist.findUnique({ where: { id: parsed.data.artistId } });
    if (!artist) return NextResponse.json(
      { error: 'Указанный исполнитель не существует', fieldErrors: { artistId: ['Выберите исполнителя из списка'] } },
      { status: 400 }
    );

    await prisma.album.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    // Каскадное удаление трек-листа задаётся в схеме Prisma (onDelete: Cascade
    // у AlbumTrack.album). Сами песни при этом сохраняются в каталоге.
    const existing = await prisma.album.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError(404, 'Альбом не найден');

    await prisma.album.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
