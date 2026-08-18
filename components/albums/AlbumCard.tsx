'use client';

import Link from 'next/link';
import { CoverPlaceholder } from '@/components/ui/CoverPlaceholder';
import { Badge } from '@/components/ui/Badge';
import type { AlbumCardData } from '@/types';
import { pluralizeAlbums } from '@/lib/api-client';

export function AlbumCard({ album }: { album: AlbumCardData }) {
  return (
    <Link
      href={`/albums/${album.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-colors hover:border-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <CoverPlaceholder
        title={album.title}
        className="aspect-square w-full rounded-none text-5xl"
      />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="truncate font-semibold text-primary group-hover:text-accent" title={album.title}>
          {album.title}
        </h3>
        <p className="truncate text-sm text-secondary" title={album.artist.name}>
          {album.artist.name}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Badge>{album.releaseYear}</Badge>
          <span className="text-xs text-secondary">{pluralizeAlbums(album.tracksCount).replace(/^\d+\s/, '')}</span>
        </div>
      </div>
    </Link>
  );
}
