import { describe, it, expect } from 'vitest';
import { getRecommendedMovies, getSimilarMovies } from './recommendations';
import type { TMDBMovie } from '../types/tmdb';

const movie = (over: Partial<TMDBMovie>): TMDBMovie =>
  ({
    id: 0,
    genre_ids: [],
    vote_average: 0,
    popularity: 1,
    media_type: 'movie',
    ...over,
  }) as TMDBMovie;

describe('getRecommendedMovies', () => {
  it('returns [] when history or pool is empty', () => {
    expect(getRecommendedMovies([], [movie({ id: 1 })])).toEqual([]);
    expect(getRecommendedMovies([movie({ id: 1 })], [])).toEqual([]);
  });

  it('excludes movies already in history', () => {
    const history = [movie({ id: 1, genre_ids: [28] })];
    const pool = [movie({ id: 1, genre_ids: [28] }), movie({ id: 2, genre_ids: [28] })];
    const result = getRecommendedMovies(history, pool);
    expect(result.map(m => m.id)).toEqual([2]);
  });

  it('ranks multi-genre overlaps above single-genre ones', () => {
    const history = [movie({ id: 1, genre_ids: [28, 12] })];
    const pool = [
      movie({ id: 2, genre_ids: [28] }), // one match
      movie({ id: 3, genre_ids: [28, 12] }), // two matches -> exponential boost
    ];
    const result = getRecommendedMovies(history, pool);
    expect(result[0].id).toBe(3);
  });

  it('respects the limit argument', () => {
    const history = [movie({ id: 1, genre_ids: [28] })];
    const pool = Array.from({ length: 5 }, (_, i) => movie({ id: i + 10, genre_ids: [28] }));
    expect(getRecommendedMovies(history, pool, 3)).toHaveLength(3);
  });
});

describe('getSimilarMovies', () => {
  it('returns [] when there is no target or empty pool', () => {
    expect(getSimilarMovies(undefined as unknown as TMDBMovie, [movie({ id: 1 })])).toEqual([]);
    expect(getSimilarMovies(movie({ id: 1 }), [])).toEqual([]);
  });

  it('ranks a same-studio match above a genre-only match', () => {
    const target = movie({
      id: 1,
      genre_ids: [28, 12], // two genres, so a partial match misses the complete-match bonus
      production_companies: [{ id: 1, name: 'Marvel Studios' }],
    });
    const pool = [
      movie({ id: 2, genre_ids: [28] }), // partial genre overlap only
      movie({
        id: 3,
        genre_ids: [99],
        production_companies: [{ id: 1, name: 'Marvel Studios' }],
      }), // studio match
    ];
    const result = getSimilarMovies(target, pool);
    expect(result[0].id).toBe(3);
  });

  it('never includes the target itself', () => {
    const target = movie({ id: 1, genre_ids: [28] });
    const pool = [target, movie({ id: 2, genre_ids: [28] })];
    expect(getSimilarMovies(target, pool).map(m => m.id)).not.toContain(1);
  });
});
