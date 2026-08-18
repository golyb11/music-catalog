export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

// Детерминированный хеш строки — для генерации устойчивого градиента обложки.
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function coverGradient(seedText: string): { from: string; to: string } {
  const h1 = hashString(seedText) % 360;
  const h2 = (h1 + 47) % 360;
  return {
    from: `hsl(${h1} 62% 46%)`,
    to: `hsl(${h2} 68% 26%)`,
  };
}
