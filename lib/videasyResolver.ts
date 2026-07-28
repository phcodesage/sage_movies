import { URLSearchParams } from 'url';

export type VideasyMediaType = 'movie' | 'tv';

export type VideasySource = {
  url?: string;
  quality?: string;
  type?: string;
};

export type VideasySubtitle = {
  label?: string;
  file?: string;
  url?: string;
  kind?: string;
  srclang?: string;
};

export type ResolvedStream = {
  url: string;
  type: 'hls' | 'video';
  quality?: string;
  subtitles?: Array<{ label?: string; file?: string }>;
};

export type VideasyResolverInput = {
  title: string;
  mediaType: VideasyMediaType;
  tmdbId: number | string;
  imdbId?: string | null;
  year?: number | string | null;
  seasonId?: number;
  episodeId?: number;
  totalSeasons?: number | null;
};

type SeedCacheEntry = {
  seed: string;
  expiresAt: number;
};

type SeedResponse = {
  seed?: string;
  ttlMs?: number;
};

const VIDEASY_API_ORIGIN = 'https://api.speedracelight.com';
const VIDEASY_EMBED_ORIGIN = 'https://player.videasy.net';
const VIDEASY_ENC_VERSION = '2';
const VIDEASY_CACHE_SAFETY_WINDOW_MS = 5_000;
const VIDEASY_DEFAULT_TTL_MS = 30_000;
const VIDEASY_DEFAULT_TIMEOUT_MS = 8_000;
const VIDEASY_RETRY_DELAY_MS = 250;
const VIDEASY_MAGIC_HEADER = Uint8Array.from([109, 118, 109, 49]); // "mvm1"
const VIDEASY_HASH_SALT = 'd486ae1ce6fdbe63b60bd1704541fcf0';
const VIDEASY_HASH_KEY = '8c465aa8af6cbfd4c1f91bf0c8d678ba';
const INITIAL_WORDS = [
  1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748,
  2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206,
  2614888103, 3248222580,
];
const HASHIDS_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
const HASHIDS_SEPARATORS = 'cfhistuCFHISTU';
const TEXT_DECODER = new TextDecoder('utf-8');
const DEFAULT_REQUEST_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  Origin: VIDEASY_EMBED_ORIGIN,
  Referer: `${VIDEASY_EMBED_ORIGIN}/`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
};

const seedCache = new Map<string, SeedCacheEntry>();

type HashidsEncoder = {
  encode: (...values: Array<number | bigint | string | Array<number | bigint | string>>) => string;
  encodeHex: (value: string | bigint) => string;
};

function asAbsoluteNumber(value: number | string): number {
  const numericValue = Number.parseInt(String(value), 10);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return numericValue;
}

function isSafeIntegerLike(value: unknown) {
  return (
    typeof value === 'bigint' ||
    (!Number.isNaN(Number(value)) && Math.floor(Number(value)) === Number(value))
  );
}

function isSafeUnsignedInteger(value: unknown) {
  return typeof value === 'bigint' || (Number(value) >= 0 && Number.isSafeInteger(Number(value)));
}

function uniqueChars(values: string[]) {
  return [...new Set(values)];
}

function filterOut(values: string[], excluded: string[]) {
  return values.filter((value) => !excluded.includes(value));
}

function filterIn(values: string[], included: string[]) {
  return values.filter((value) => included.includes(value));
}

function shuffle(values: string[], salt: string[]) {
  if (salt.length === 0) {
    return values;
  }

  const result = [...values];
  let saltIndex = 0;
  let accumulator = 0;

  for (let index = result.length - 1; index > 0; index -= 1, saltIndex += 1) {
    saltIndex %= salt.length;
    accumulator += salt[saltIndex].codePointAt(0) ?? 0;
    const nextIndex = ((salt[saltIndex].codePointAt(0) ?? 0) + saltIndex + accumulator) % index;
    const current = result[index];

    result[index] = result[nextIndex];
    result[nextIndex] = current;
  }

  return result;
}

function toAlphabet(value: number | bigint, alphabet: string[]) {
  const result: string[] = [];
  let currentValue = value;

  if (typeof currentValue === 'bigint') {
    const alphabetLength = BigInt(alphabet.length);

    do {
      result.unshift(alphabet[Number(currentValue % alphabetLength)]);
      currentValue /= alphabetLength;
    } while (currentValue > BigInt(0));

    return result;
  }

  do {
    result.unshift(alphabet[currentValue % alphabet.length]);
    currentValue = Math.floor(currentValue / alphabet.length);
  } while (currentValue > 0);

  return result;
}

function escapeRegExp(value: string) {
  return value.replace(/[\s#$()*+,.?[\\\]^{|}-]/g, '\\$&');
}

function parseNumberish(value: number | bigint | string) {
  if (typeof value === 'bigint' || typeof value === 'number') {
    return value;
  }

  const normalized = String(value);

  if (!/^\+?\d+$/.test(normalized)) {
    return Number.NaN;
  }

  const parsed = Number.parseInt(normalized, 10);

  return Number.isSafeInteger(parsed) ? parsed : BigInt(normalized);
}

function createHashids(
  salt = '',
  minLength = 0,
  alphabet = HASHIDS_ALPHABET,
  separators = HASHIDS_SEPARATORS
): HashidsEncoder {
  const saltChars = Array.from(salt);
  let alphabetChars = uniqueChars(Array.from(alphabet));

  if (alphabetChars.length < 16) {
    throw new Error('Hashids alphabet must contain at least 16 unique characters');
  }

  alphabetChars = filterOut(alphabetChars, Array.from(separators));

  let separatorChars = shuffle(filterIn(Array.from(separators), alphabetChars), saltChars);

  if (separatorChars.length === 0 || alphabetChars.length / separatorChars.length > 3.5) {
    const separatorTargetLength = Math.ceil(alphabetChars.length / 3.5);

    if (separatorTargetLength > separatorChars.length) {
      const additional = separatorTargetLength - separatorChars.length;
      separatorChars.push(...alphabetChars.slice(0, additional));
      alphabetChars = alphabetChars.slice(additional);
    }
  }

  alphabetChars = shuffle(alphabetChars, saltChars);

  const guardCount = Math.ceil(alphabetChars.length / 12);
  let guardChars: string[];

  if (alphabetChars.length < 3) {
    guardChars = separatorChars.slice(0, guardCount);
    separatorChars = separatorChars.slice(guardCount);
  } else {
    guardChars = alphabetChars.slice(0, guardCount);
    alphabetChars = alphabetChars.slice(guardCount);
  }

  function encodeInternal(values: Array<number | bigint>) {
    let currentAlphabet = [...alphabetChars];
    const hash = values.reduce(
      (total, currentValue, index) =>
        total +
        (typeof currentValue === 'bigint'
          ? Number(currentValue % BigInt(index + 100))
          : currentValue % (index + 100)),
      0
    );

    let result = [currentAlphabet[hash % currentAlphabet.length]];
    let lotteryChars = [...result];

    values.forEach((value, index) => {
      const buffer = lotteryChars.concat(saltChars, currentAlphabet);
      currentAlphabet = shuffle(currentAlphabet, buffer);

      const encoded = toAlphabet(value, currentAlphabet);
      result.push(...encoded);

      if (index + 1 < values.length) {
        const separatorIndex =
          (encoded[0].codePointAt(0) ?? 0) +
          index +
          Number(typeof value === 'bigint' ? value % BigInt(separatorChars.length || 1) : value);

        result.push(separatorChars[separatorIndex % separatorChars.length]);
      }

      lotteryChars = [...result];
    });

    if (result.length < minLength) {
      const guardIndex = (hash + (result[0].codePointAt(0) ?? 0)) % guardChars.length;
      result.unshift(guardChars[guardIndex]);

      if (result.length < minLength) {
        const fallbackIndex = (hash + (result[2]?.codePointAt(0) ?? 0)) % guardChars.length;
        result.push(guardChars[fallbackIndex]);
      }
    }

    const halfAlphabetLength = Math.floor(currentAlphabet.length / 2);

    while (result.length < minLength) {
      currentAlphabet = shuffle(currentAlphabet, currentAlphabet);
      result.unshift(...currentAlphabet.slice(halfAlphabetLength));
      result.push(...currentAlphabet.slice(0, halfAlphabetLength));

      const overflow = result.length - minLength;

      if (overflow > 0) {
        const offset = overflow / 2;
        result = result.slice(offset, offset + minLength);
      }
    }

    return result.join('');
  }

  function encode(
    ...rawValues: Array<number | bigint | string | Array<number | bigint | string>>
  ): string {
    let values = Array.isArray(rawValues[0])
      ? [...(rawValues[0] as Array<number | bigint | string>)]
      : rawValues.filter((value) => value != null) as Array<number | bigint | string>;

    if (values.length === 0) {
      return '';
    }

    if (!values.every(isSafeIntegerLike)) {
      values = values.map(parseNumberish);
    }

    if (!values.every(isSafeUnsignedInteger)) {
      return '';
    }

    return encodeInternal(values as Array<number | bigint>);
  }

  function encodeHex(value: string | bigint) {
    let hexValue = value;

    if (typeof hexValue === 'bigint') {
      hexValue = hexValue.toString(16);
    }

    if (typeof hexValue !== 'string') {
      throw new Error(`Hashids.encodeHex expected string or bigint, received ${typeof hexValue}`);
    }

    if (!/^[\dA-Fa-f]+$/.test(hexValue)) {
      return '';
    }

    const chunks: number[] = [];

    for (let index = 0; index < hexValue.length; index += 12) {
      chunks.push(Number.parseInt(`1${hexValue.slice(index, index + 12)}`, 16));
    }

    return encode(chunks);
  }

  return { encode, encodeHex };
}

function xorTransform(input: string) {
  const keyBytes = Array.from(VIDEASY_HASH_KEY, (character) => character.charCodeAt(0));

  return Array.from(input, (character) =>
    keyBytes.reduce((accumulator, keyByte) => accumulator ^ keyByte, character.charCodeAt(0))
  )
    .map((byte) => `0${Number(byte).toString(16)}`.slice(-2))
    .join('');
}

function getApiOrigin(url: string) {
  return new URL(url).origin;
}

function fnv1a32(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619) >>> 0;
  }

  return mix32(hash);
}

function mix32(value: number) {
  let current = value >>> 0;

  current ^= current >>> 16;
  current = Math.imul(current, 2246822507) >>> 0;
  current ^= current >>> 13;
  current = Math.imul(current, 3266489909) >>> 0;
  current ^= current >>> 16;

  return current >>> 0;
}

function rotateLeft(value: number, bits: number) {
  const normalizedBits = bits & 31;

  if (normalizedBits === 0) {
    return value >>> 0;
  }

  return ((value << normalizedBits) | (value >>> (32 - normalizedBits))) >>> 0;
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');

  return Uint8Array.from(Buffer.from(normalized, 'base64'));
}

function buildSeedState(seed: string, mediaId: number) {
  const state: number[] = new Array(61);
  let accumulator = mix32(fnv1a32(seed) ^ mix32((mediaId >>> 0) ^ 2654435769)) >>> 0;

  for (let index = 0; index < 8; index += 1) {
    const slot = accumulator % 61;
    accumulator = rotateLeft((accumulator + 2654435769) >>> 0, 7 + (7 & index));
    state[slot] = (accumulator ^ mix32(accumulator)) >>> 0;
    accumulator = mix32((accumulator + slot) >>> 0);
  }

  return {
    state,
    accumulator: mix32(2779096485 ^ accumulator) >>> 0,
  };
}

function nextSeedWord(seedState: ReturnType<typeof buildSeedState>, counter: number) {
  const { state } = seedState;
  let { accumulator } = seedState;
  const slot = accumulator % 61;
  const slotExistsMask = 0 - Number(slot in state);
  const slotValue = state[slot] >>> 0;
  const mixedValue = (slotValue ^ Math.imul(2654435769, counter + 1)) >>> 0;
  const combined = (((accumulator ^ mixedValue) >>> 0) | ((accumulator & mixedValue & slotExistsMask) >>> 0)) >>> 0;

  accumulator = mix32(
    (((rotateLeft((combined + accumulator) >>> 0, slot & 31) ^
      rotateLeft(accumulator, Math.imul(slot, 7) & 31)) >>>
      0) +
      2654435769) >>>
      0
  );

  state[slot] = accumulator >>> 0;
  seedState.accumulator = accumulator >>> 0;

  return accumulator >>> 0;
}

function buildPayloadMask(seed: string, mediaId: number, payloadLength: number) {
  const seedState = buildSeedState(seed, mediaId);
  const mask = new Uint8Array(payloadLength);
  let counter = 0;

  for (let index = 0; index < payloadLength; ) {
    const word = nextSeedWord(seedState, counter);

    counter += 1;
    mask[index] = word & 255;
    index += 1;

    if (index < payloadLength) {
      mask[index] = (word >>> 8) & 255;
      index += 1;
    }

    if (index < payloadLength) {
      mask[index] = (word >>> 16) & 255;
      index += 1;
    }

    if (index < payloadLength) {
      mask[index] = (word >>> 24) & 255;
      index += 1;
    }
  }

  return mask;
}

function normalizeSubtitle(subtitle: VideasySubtitle) {
  return {
    label: subtitle.label,
    file: subtitle.file ?? subtitle.url,
  };
}

function getQualityRank(quality?: string) {
  if (!quality) {
    return 0;
  }

  const normalized = quality.toLowerCase();
  const numericMatch = normalized.match(/(\d{3,4})p?/);

  if (numericMatch) {
    return Number.parseInt(numericMatch[1], 10);
  }

  if (normalized.includes('4k') || normalized.includes('uhd')) {
    return 2160;
  }

  if (normalized.includes('full hd')) {
    return 1080;
  }

  if (normalized.includes('hd')) {
    return 720;
  }

  return 1;
}

function isLikelyHlsSource(source: VideasySource) {
  const url = source.url?.toLowerCase() ?? '';
  const type = source.type?.toLowerCase() ?? '';

  return url.includes('.m3u8') || type.includes('hls');
}

function isLikelyDirectVideoSource(source: VideasySource) {
  const url = source.url?.toLowerCase() ?? '';
  const type = source.type?.toLowerCase() ?? '';

  return (
    /\.(mp4|webm|mkv|mov)(\?|$)/.test(url) ||
    ['mp4', 'video', 'file'].includes(type) ||
    type.includes('mp4')
  );
}

function isLikelyPlayableSource(source: VideasySource) {
  const url = source.url?.toLowerCase() ?? '';

  return (
    Boolean(source.url) &&
    !url.includes('/player/') &&
    !url.includes('/embed/') &&
    !url.endsWith('.html')
  );
}

async function fetchVideasyText(url: string, init?: RequestInit, timeoutMs = VIDEASY_DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        ...DEFAULT_REQUEST_HEADERS,
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    const body = await response.text();

    if (!response.ok) {
      const error = new Error(`Videasy request failed with status ${response.status}`) as Error & {
        status?: number;
        body?: string;
      };

      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

function buildFallbackPayload(input: VideasyResolverInput) {
  return {
    title: encodeURIComponent(input.title),
    mediaType: input.mediaType,
    year: input.year ? String(input.year) : undefined,
    totalSeasons: input.totalSeasons ?? undefined,
    episodeId: input.episodeId ?? 1,
    seasonId: input.seasonId ?? 1,
    tmdbId: String(input.tmdbId),
    imdbId: input.imdbId ?? '',
  };
}

export function buildVideasyKey(tmdbId: string | number) {
  const hashids = createHashids();
  return hashids.encodeHex(xorTransform(`${tmdbId}${VIDEASY_HASH_SALT}`));
}

export async function getVideasySeed(tmdbId: number | string) {
  const cacheKey = `${VIDEASY_API_ORIGIN}|${tmdbId}`;
  const now = Date.now();
  const cachedSeed = seedCache.get(cacheKey);

  if (cachedSeed && cachedSeed.expiresAt - VIDEASY_CACHE_SAFETY_WINDOW_MS > now) {
    return cachedSeed.seed;
  }

  const responseText = await fetchVideasyText(
    `${VIDEASY_API_ORIGIN}/seed?mediaId=${encodeURIComponent(String(tmdbId))}`
  );
  const payload = JSON.parse(responseText) as SeedResponse;

  if (!payload.seed) {
    throw new Error('Videasy seed response did not include a seed');
  }

  const ttlMs = Number.isFinite(payload.ttlMs) ? Number(payload.ttlMs) : VIDEASY_DEFAULT_TTL_MS;

  seedCache.set(cacheKey, {
    seed: payload.seed,
    expiresAt: now + ttlMs,
  });

  return payload.seed;
}

export function clearVideasySeedCache(tmdbId: number | string) {
  seedCache.delete(`${VIDEASY_API_ORIGIN}|${tmdbId}`);
}

export function decodeVideasyPayload(payload: string, seed: string, mediaId: number | string) {
  const mediaNumericId = asAbsoluteNumber(mediaId);
  const encryptedBytes = decodeBase64Url(payload);
  const mask = buildPayloadMask(seed, mediaNumericId, encryptedBytes.length);
  const decodedBytes = encryptedBytes.slice();

  for (let index = 0; index < decodedBytes.length; index += 1) {
    decodedBytes[index] ^= mask[index];
  }

  for (let index = 0; index < VIDEASY_MAGIC_HEADER.length; index += 1) {
    if (decodedBytes[index] !== VIDEASY_MAGIC_HEADER[index]) {
      throw new Error('Videasy payload decode failed: bad seed or tampered payload');
    }
  }

  return TEXT_DECODER.decode(decodedBytes.subarray(VIDEASY_MAGIC_HEADER.length));
}

export async function fetchVideasySources(input: VideasyResolverInput) {
  const searchParams = buildFallbackPayload(input);
  const requestUrl = `${VIDEASY_API_ORIGIN}/cdn/sources-with-title?${new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => value !== undefined && value !== null)
    ),
    enc: VIDEASY_ENC_VERSION,
    seed: await getVideasySeed(input.tmdbId),
  }).toString()}`;

  try {
    const payload = await fetchVideasyText(requestUrl);
    const decoded = decodeVideasyPayload(payload, new URL(requestUrl).searchParams.get('seed') ?? '', input.tmdbId);
    const parsed = JSON.parse(decoded) as {
      sources?: VideasySource[];
      subtitles?: VideasySubtitle[];
    };

    return {
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      subtitles: Array.isArray(parsed.subtitles) ? parsed.subtitles : [],
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;

    if (status === 401) {
      clearVideasySeedCache(input.tmdbId);
      await new Promise((resolve) => setTimeout(resolve, VIDEASY_RETRY_DELAY_MS));

      const freshSeed = await getVideasySeed(input.tmdbId);
      const retryUrl = `${VIDEASY_API_ORIGIN}/cdn/sources-with-title?${new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(searchParams).filter(([, value]) => value !== undefined && value !== null)
        ),
        enc: VIDEASY_ENC_VERSION,
        seed: freshSeed,
      }).toString()}`;
      const payload = await fetchVideasyText(retryUrl);
      const decoded = decodeVideasyPayload(payload, freshSeed, input.tmdbId);
      const parsed = JSON.parse(decoded) as {
        sources?: VideasySource[];
        subtitles?: VideasySubtitle[];
      };

      return {
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        subtitles: Array.isArray(parsed.subtitles) ? parsed.subtitles : [],
      };
    }

    throw error;
  }
}

export function pickBestSource(sources: VideasySource[], subtitles: VideasySubtitle[] = []): ResolvedStream | null {
  const playableSources = sources.filter((source) => isLikelyPlayableSource(source));

  if (playableSources.length === 0) {
    return null;
  }

  const rankedSources = playableSources
    .map((source) => ({
      source,
      kindRank: isLikelyHlsSource(source) ? 3 : isLikelyDirectVideoSource(source) ? 2 : 0,
      qualityRank: getQualityRank(source.quality),
    }))
    .filter((entry) => entry.kindRank > 0)
    .sort((left, right) => {
      if (right.kindRank !== left.kindRank) {
        return right.kindRank - left.kindRank;
      }

      return right.qualityRank - left.qualityRank;
    });

  if (rankedSources.length === 0) {
    return null;
  }

  const bestSource = rankedSources[0].source;

  return {
    url: bestSource.url!,
    type: isLikelyHlsSource(bestSource) ? 'hls' : 'video',
    quality: bestSource.quality,
    subtitles: subtitles.map(normalizeSubtitle).filter((subtitle) => Boolean(subtitle.file)),
  };
}

export async function resolveVideasyStream(input: VideasyResolverInput) {
  const { sources, subtitles } = await fetchVideasySources(input);
  return pickBestSource(sources, subtitles);
}

export function buildVideasyFallbackEmbedUrl(input: Pick<VideasyResolverInput, 'mediaType' | 'tmdbId' | 'seasonId' | 'episodeId'>) {
  if (input.mediaType === 'tv' && input.seasonId && input.episodeId) {
    return `${VIDEASY_EMBED_ORIGIN}/tv/${input.tmdbId}/${input.seasonId}/${input.episodeId}`;
  }

  return `${VIDEASY_EMBED_ORIGIN}/${input.mediaType}/${input.tmdbId}`;
}

export function getVideasyApiOrigin() {
  return getApiOrigin(VIDEASY_API_ORIGIN);
}
