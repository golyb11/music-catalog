export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleApiError, readValidatedBody } from '@/lib/api';
import { albumSchema } from '@/lib/validation/schemas';
import type { AlbumCardData } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const artistId = searchParams.get('artistId')?.trim();
    const yearRaw = searchParams.get('year')?.trim();
    const sort = searchParams.get('sort')?.trim();

    const where: Prisma.AlbumWhereInput = {
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      ...(artistId ? { artistId } : {}),
      ...(yearRaw && /^\d+$/.test(yearRaw) ? { releaseYear: Number(yearRaw) } : {}),
    };

    let orderBy: Prisma.AlbumOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
    if (sort === 'title') orderBy = [{ title: 'asc' }];
    else if (sort === 'year') orderBy = [{ releaseYear: 'desc' }, { title: 'asc' }];
    else if (sort === 'newest') orderBy = [{ createdAt: 'desc' }];

    const albums = await prisma.album.findMany({
      where,
      include: {
        artist: { select: { id: true, name: true } },
        _count: { select: { tracks: true } },
      },
      orderBy,
    });

    const result: AlbumCardData[] = albums.map((album) => ({
      id: album.id,
      title: album.title,
      releaseYear: album.releaseYear,
      artist: album.artist,
      tracksCount: album._count.tracks,
    }));
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  const parsed = await readValidatedBody(req, albumSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const artist = await prisma.artist.findUnique({ where: { id: parsed.data.artistId } });
    if (!artist) return NextResponse.json(
      { error: 'Указанный исполнитель не существует', fieldErrors: { artistId: ['Выберите исполнителя из списка'] } },
      { status: 400 }
    );

    const album = await prisma.album.create({ data: parsed.data });
    return NextResponse.json({ id: album.id }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
