export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError, readValidatedBody } from '@/lib/api';
import { artistSchema } from '@/lib/validation/schemas';
import type { ArtistDetail } from '@/types';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const artist = await prisma.artist.findUnique({
      where: { id: params.id },
      include: {
        albums: {
          include: { _count: { select: { tracks: true } } },
          orderBy: { releaseYear: 'desc' },
        },
      },
    });
    if (!artist) return jsonError(404, 'Исполнитель не найден');

    const result: ArtistDetail = {
      id: artist.id,
      name: artist.name,
      albums: artist.albums.map((album) => ({
        id: album.id,
        title: album.title,
        releaseYear: album.releaseYear,
        artist: { id: artist.id, name: artist.name },
        tracksCount: album._count.tracks,
      })),
    };
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  const parsed = await readValidatedBody(req, artistSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const artist = await prisma.artist.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ id: artist.id, name: artist.name });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    // Выбранное правило удаления: исполнителя с альбомами удалять запрещено —
    // сначала нужно удалить или перенести его альбомы (подробности в README).
    const albumsCount = await prisma.album.count({ where: { artistId: params.id } });
    if (albumsCount > 0) {
      return jsonError(
        409,
        `Нельзя удалить исполнителя: у него есть альбомы (${albumsCount}). Сначала удалите их.`
      );
    }

    const existing = await prisma.artist.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError(404, 'Исполнитель не найден');

    await prisma.artist.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
