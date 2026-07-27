export interface StudioInfo {
  name: string;
  iconUrl: string;
  bgColor: string;
}

export const KNOWN_STUDIO_LOGOS: Record<string, StudioInfo> = {
  disney: {
    name: 'Disney+',
    iconUrl: '/studios/disney.png',
    bgColor: 'bg-gradient-to-br from-cyan-900 to-blue-950',
  },
  netflix: {
    name: 'Netflix',
    iconUrl: '/studios/netflix.png',
    bgColor: 'bg-black',
  },
  prime: {
    name: 'Prime Video',
    iconUrl: '/studios/prime.png',
    bgColor: 'bg-blue-600',
  },
  amazon: {
    name: 'Prime Video',
    iconUrl: '/studios/prime.png',
    bgColor: 'bg-blue-600',
  },
  apple: {
    name: 'Apple TV+',
    iconUrl: '/studios/appletv.png',
    bgColor: 'bg-zinc-900',
  },
  hbo: {
    name: 'HBO',
    iconUrl: '/studios/hbo.png',
    bgColor: 'bg-purple-950',
  },
  max: {
    name: 'Max',
    iconUrl: '/studios/max.png',
    bgColor: 'bg-blue-900',
  },
  paramount: {
    name: 'Paramount+',
    iconUrl: '/studios/paramount.png',
    bgColor: 'bg-blue-700',
  },
  hulu: {
    name: 'Hulu',
    iconUrl: '/studios/hulu.png',
    bgColor: 'bg-emerald-900',
  },
  vivamax: {
    name: 'Vivamax',
    iconUrl: '/studios/vivamax.png',
    bgColor: 'bg-amber-600',
  },
  warner: {
    name: 'Warner Bros',
    iconUrl: '/studios/warner.png',
    bgColor: 'bg-blue-900',
  },
  marvel: {
    name: 'Marvel',
    iconUrl: '/studios/marvel.png',
    bgColor: 'bg-red-700',
  },
  universal: {
    name: 'Universal',
    iconUrl: '/studios/universal.png',
    bgColor: 'bg-black',
  },
  sony: {
    name: 'Sony Pictures',
    iconUrl: '/studios/sony.png',
    bgColor: 'bg-gray-900',
  },
  a24: {
    name: 'A24',
    iconUrl: '/studios/a24.png',
    bgColor: 'bg-neutral-900',
  },
};

export function getStudioInfo(companies?: { id: number; name: string; logo_path?: string }[]): StudioInfo | null {
  if (!companies || companies.length === 0) return null;

  for (const c of companies) {
    const lower = (c.name || '').toLowerCase();
    for (const key of Object.keys(KNOWN_STUDIO_LOGOS)) {
      if (lower.includes(key)) {
        return KNOWN_STUDIO_LOGOS[key];
      }
    }
  }

  const first = companies[0];
  if (first.logo_path) {
    return {
      name: first.name,
      iconUrl: `https://image.tmdb.org/t/p/w200${first.logo_path}`,
      bgColor: 'bg-black/70',
    };
  }

  return {
    name: first.name,
    iconUrl: '',
    bgColor: 'bg-netflix-red',
  };
}
