export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, readValidatedBody } from '@/lib/api';
import { artistSchema } from '@/lib/validation/schemas';
import type { ArtistListItem } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();

    const artists = await prisma.artist.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      include: { _count: { select: { albums: true } } },
      orderBy: { name: 'asc' },
    });

    const result: ArtistListItem[] = artists.map((a) => ({
      id: a.id,
      name: a.name,
      albumsCount: a._count.albums,
    }));
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  const parsed = await readValidatedBody(req, artistSchema);
  if ('response' in parsed) return parsed.response;

  try {
    const artist = await prisma.artist.create({ data: parsed.data });
    return NextResponse.json({ id: artist.id, name: artist.name }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
