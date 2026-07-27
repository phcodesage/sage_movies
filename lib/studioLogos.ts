export interface StudioInfo {
  name: string;
  iconUrl: string;
  bgColor: string;
}

export const KNOWN_STUDIO_LOGOS: Record<string, StudioInfo> = {
  disney: {
    name: 'Disney+',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
    bgColor: 'bg-gradient-to-br from-cyan-900 to-blue-950',
  },
  netflix: {
    name: 'Netflix',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_N_logo.svg',
    bgColor: 'bg-black',
  },
  prime: {
    name: 'Prime Video',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
    bgColor: 'bg-blue-600',
  },
  amazon: {
    name: 'Prime Video',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
    bgColor: 'bg-blue-600',
  },
  apple: {
    name: 'Apple TV+',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Apple_TV_plus_logo.svg',
    bgColor: 'bg-zinc-900',
  },
  hbo: {
    name: 'HBO',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg',
    bgColor: 'bg-purple-950',
  },
  max: {
    name: 'Max',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg',
    bgColor: 'bg-blue-900',
  },
  paramount: {
    name: 'Paramount+',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg',
    bgColor: 'bg-blue-700',
  },
  hulu: {
    name: 'Hulu',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg',
    bgColor: 'bg-emerald-900',
  },
  vivamax: {
    name: 'Vivamax',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Vivamax_logo.svg/512px-Vivamax_logo.svg.png',
    bgColor: 'bg-amber-600',
  },
  warner: {
    name: 'Warner Bros',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Warner_Bros_logo.svg',
    bgColor: 'bg-blue-900',
  },
  marvel: {
    name: 'Marvel',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Marvel-Studios-1-1.svg',
    bgColor: 'bg-red-700',
  },
  universal: {
    name: 'Universal',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Universal_Pictures_logo.svg',
    bgColor: 'bg-black',
  },
  sony: {
    name: 'Sony Pictures',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Columbia_Pictures_logo.svg',
    bgColor: 'bg-gray-900',
  },
  a24: {
    name: 'A24',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/A24_logo.svg',
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
