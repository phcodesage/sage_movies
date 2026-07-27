export interface StreamingService {
  id: number | string;
  name: string;
  shortName: string;
  rowId: string;
  logoPath: string;
  isCompany?: boolean;
}

export interface SearchBrand {
  key: string;
  label: string;
  aliases: string[];
  logoPath: string;
}

export const SEARCH_BRANDS: SearchBrand[] = [
  {
    key: 'vivamax',
    label: 'Vivamax',
    aliases: ['vivamax', 'viva'],
    logoPath: '/studios/vivamax.png',
  },
  {
    key: 'netflix',
    label: 'Netflix',
    aliases: ['netflix'],
    logoPath: '/studios/netflix.png',
  },
  {
    key: 'disney',
    label: 'Disney+',
    aliases: ['disney', 'disney+', 'disney plus'],
    logoPath: '/studios/disney.png',
  },
  {
    key: 'amazon',
    label: 'Prime Video',
    aliases: ['amazon', 'prime', 'prime video', 'amazon prime'],
    logoPath: '/studios/prime.png',
  },
  {
    key: 'apple',
    label: 'Apple TV+',
    aliases: ['apple', 'apple tv', 'apple tv+'],
    logoPath: '/studios/appletv.png',
  },
  {
    key: 'hbo',
    label: 'HBO Max',
    aliases: ['hbo', 'hbo max', 'max'],
    logoPath: '/studios/hbo.png',
  },
  {
    key: 'paramount',
    label: 'Paramount+',
    aliases: ['paramount', 'paramount+'],
    logoPath: '/studios/paramount.png',
  },
  {
    key: 'hulu',
    label: 'Hulu',
    aliases: ['hulu'],
    logoPath: '/studios/hulu.png',
  },
  {
    key: 'warner',
    label: 'Warner Bros',
    aliases: ['warner', 'warner bros', 'wb'],
    logoPath: '/studios/warner.png',
  },
  {
    key: 'marvel',
    label: 'Marvel',
    aliases: ['marvel', 'marvel studios'],
    logoPath: '/studios/marvel.png',
  },
  {
    key: 'universal',
    label: 'Universal',
    aliases: ['universal', 'universal pictures'],
    logoPath: '/studios/universal.png',
  },
  {
    key: 'sony',
    label: 'Sony Pictures',
    aliases: ['sony', 'columbia', 'sony pictures'],
    logoPath: '/studios/sony.png',
  },
  {
    key: 'a24',
    label: 'A24',
    aliases: ['a24'],
    logoPath: '/studios/a24.png',
  },
];

export function matchSearchBrand(query: string): SearchBrand | undefined {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return SEARCH_BRANDS.find((b) => b.aliases.includes(q));
}

export const STREAMING_SERVICES: StreamingService[] = [
  {
    id: 'vivamax',
    name: 'Vivamax',
    shortName: 'Vivamax',
    rowId: 'vivamax',
    logoPath: '/studios/vivamax.png',
  },
  {
    id: 8,
    name: 'Netflix',
    shortName: 'Netflix',
    rowId: 'netflix',
    logoPath: '/studios/netflix.png',
  },
  {
    id: 337,
    name: 'Disney+',
    shortName: 'Disney+',
    rowId: 'disney',
    logoPath: '/studios/disney.png',
  },
  {
    id: 9,
    name: 'Amazon Prime Video',
    shortName: 'Prime Video',
    rowId: 'amazon',
    logoPath: '/studios/prime.png',
  },
  {
    id: 350,
    name: 'Apple TV+',
    shortName: 'Apple TV+',
    rowId: 'apple',
    logoPath: '/studios/appletv.png',
  },
  {
    id: 1899,
    name: 'HBO Max',
    shortName: 'HBO Max',
    rowId: 'hbo',
    logoPath: '/studios/hbo.png',
  },
  {
    id: 531,
    name: 'Paramount+',
    shortName: 'Paramount+',
    rowId: 'paramount',
    logoPath: '/studios/paramount.png',
  },
  {
    id: 15,
    name: 'Hulu',
    shortName: 'Hulu',
    rowId: 'hulu',
    logoPath: '/studios/hulu.png',
  },
  {
    id: 'warner',
    name: 'Warner Bros',
    shortName: 'Warner Bros',
    rowId: 'warner',
    logoPath: '/studios/warner.png',
    isCompany: true,
  },
  {
    id: 'marvel',
    name: 'Marvel',
    shortName: 'Marvel',
    rowId: 'marvel',
    logoPath: '/studios/marvel.png',
    isCompany: true,
  },
  {
    id: 'universal',
    name: 'Universal Pictures',
    shortName: 'Universal',
    rowId: 'universal',
    logoPath: '/studios/universal.png',
    isCompany: true,
  },
  {
    id: 'sony',
    name: 'Sony Pictures',
    shortName: 'Sony',
    rowId: 'sony',
    logoPath: '/studios/sony.png',
    isCompany: true,
  },
  {
    id: 'a24',
    name: 'A24',
    shortName: 'A24',
    rowId: 'a24',
    logoPath: '/studios/a24.png',
    isCompany: true,
  },
];
