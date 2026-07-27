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
    logoPath: 'https://image.tmdb.org/t/p/w92/25oYoXHsfWYlddAzJSBReajN3BM.png',
  },
  {
    key: 'netflix',
    label: 'Netflix',
    aliases: ['netflix'],
    logoPath: 'https://image.tmdb.org/t/p/w92/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
  },
  {
    key: 'disney',
    label: 'Disney+',
    aliases: ['disney', 'disney+', 'disney plus'],
    logoPath: 'https://image.tmdb.org/t/p/w92/97yvRBw1GzX7fXprcF80er19ot.jpg',
  },
  {
    key: 'amazon',
    label: 'Prime Video',
    aliases: ['amazon', 'prime', 'prime video', 'amazon prime'],
    logoPath: 'https://image.tmdb.org/t/p/w92/pvske1MyAoymrs5bguRfVqYiM9a.jpg',
  },
  {
    key: 'apple',
    label: 'Apple TV+',
    aliases: ['apple', 'apple tv', 'apple tv+'],
    logoPath: 'https://image.tmdb.org/t/p/w92/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg',
  },
  {
    key: 'hbo',
    label: 'HBO Max',
    aliases: ['hbo', 'hbo max', 'max'],
    logoPath: 'https://image.tmdb.org/t/p/w92/jbe4gVSfRlbPTdESXhEKpornsfu.jpg',
  },
  {
    key: 'paramount',
    label: 'Paramount+',
    aliases: ['paramount', 'paramount+'],
    logoPath: 'https://image.tmdb.org/t/p/w92/fts6X10Jn4QT0X6ac3udKEn2tJA.jpg',
  },
  {
    key: 'hulu',
    label: 'Hulu',
    aliases: ['hulu'],
    logoPath: 'https://image.tmdb.org/t/p/w92/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg',
  },
  {
    key: 'warner',
    label: 'Warner Bros',
    aliases: ['warner', 'warner bros', 'wb'],
    logoPath: 'https://image.tmdb.org/t/p/w92/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png',
  },
  {
    key: 'marvel',
    label: 'Marvel',
    aliases: ['marvel', 'marvel studios'],
    logoPath: 'https://image.tmdb.org/t/p/w92/hUzeosd33nzE5MStB42PioTJw15.png',
  },
  {
    key: 'universal',
    label: 'Universal',
    aliases: ['universal', 'universal pictures'],
    logoPath: 'https://image.tmdb.org/t/p/w92/8lvHyhjr8oUKOOy2dKXoALWKdp0.png',
  },
  {
    key: 'sony',
    label: 'Sony Pictures',
    aliases: ['sony', 'columbia', 'sony pictures'],
    logoPath: 'https://image.tmdb.org/t/p/w92/b9HLm1GDP4j3PF9TZQercD0r8kg.jpg',
  },
  {
    key: 'a24',
    label: 'A24',
    aliases: ['a24'],
    logoPath: 'https://image.tmdb.org/t/p/w92/u7nsZM0vmBMDpzIy27164AwMjXV.png',
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
    logoPath: 'https://image.tmdb.org/t/p/w92/25oYoXHsfWYlddAzJSBReajN3BM.png',
  },
  {
    id: 8,
    name: 'Netflix',
    shortName: 'Netflix',
    rowId: 'netflix',
    logoPath: 'https://image.tmdb.org/t/p/w92/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
  },
  {
    id: 337,
    name: 'Disney+',
    shortName: 'Disney+',
    rowId: 'disney',
    logoPath: 'https://image.tmdb.org/t/p/w92/97yvRBw1GzX7fXprcF80er19ot.jpg',
  },
  {
    id: 9,
    name: 'Amazon Prime Video',
    shortName: 'Prime Video',
    rowId: 'amazon',
    logoPath: 'https://image.tmdb.org/t/p/w92/pvske1MyAoymrs5bguRfVqYiM9a.jpg',
  },
  {
    id: 350,
    name: 'Apple TV+',
    shortName: 'Apple TV+',
    rowId: 'apple',
    logoPath: 'https://image.tmdb.org/t/p/w92/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg',
  },
  {
    id: 1899,
    name: 'HBO Max',
    shortName: 'HBO Max',
    rowId: 'hbo',
    logoPath: 'https://image.tmdb.org/t/p/w92/jbe4gVSfRlbPTdESXhEKpornsfu.jpg',
  },
  {
    id: 531,
    name: 'Paramount+',
    shortName: 'Paramount+',
    rowId: 'paramount',
    logoPath: 'https://image.tmdb.org/t/p/w92/fts6X10Jn4QT0X6ac3udKEn2tJA.jpg',
  },
  {
    id: 15,
    name: 'Hulu',
    shortName: 'Hulu',
    rowId: 'hulu',
    logoPath: 'https://image.tmdb.org/t/p/w92/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg',
  },
  {
    id: 'warner',
    name: 'Warner Bros',
    shortName: 'Warner Bros',
    rowId: 'warner',
    logoPath: 'https://image.tmdb.org/t/p/w92/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png',
    isCompany: true,
  },
  {
    id: 'marvel',
    name: 'Marvel',
    shortName: 'Marvel',
    rowId: 'marvel',
    logoPath: 'https://image.tmdb.org/t/p/w92/hUzeosd33nzE5MStB42PioTJw15.png',
    isCompany: true,
  },
  {
    id: 'universal',
    name: 'Universal Pictures',
    shortName: 'Universal',
    rowId: 'universal',
    logoPath: 'https://image.tmdb.org/t/p/w92/8lvHyhjr8oUKOOy2dKXoALWKdp0.png',
    isCompany: true,
  },
  {
    id: 'sony',
    name: 'Sony Pictures',
    shortName: 'Sony',
    rowId: 'sony',
    logoPath: 'https://image.tmdb.org/t/p/w92/b9HLm1GDP4j3PF9TZQercD0r8kg.jpg',
    isCompany: true,
  },
  {
    id: 'a24',
    name: 'A24',
    shortName: 'A24',
    rowId: 'a24',
    logoPath: 'https://image.tmdb.org/t/p/w92/u7nsZM0vmBMDpzIy27164AwMjXV.png',
    isCompany: true,
  },
];
