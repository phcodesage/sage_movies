import type { TMDBMovie } from '../types/tmdb';

/**
 * Advanced Recommendation Engine for Sage Movies
 * 
 * Implements a weighted scoring algorithm based on:
 * 1. Multi-genre matching (Exponential weight for multiple matches)
 * 2. Studio/Production company matching
 * 3. Media type matching
 * 4. Popularity & Vote quality
 */

export interface RecommendationWeight {
  genreOverlap: number;
  studioMatch: number;
  genreFrequency: number;
  mediaType: number;
  rating: number;
}

const DEFAULT_WEIGHTS: RecommendationWeight = {
  genreOverlap: 50,
  studioMatch: 80,     // High weight for same studio
  genreFrequency: 10,
  mediaType: 20,
  rating: 5,
};

export function getRecommendedMovies(
  history: TMDBMovie[],
  pool: TMDBMovie[],
  limit: number = 20
): TMDBMovie[] {
  if (!history.length || !pool.length) return [];

  const genreFreq: Record<number, number> = {};
  history.forEach(movie => {
    movie.genre_ids?.forEach(id => {
      genreFreq[id] = (genreFreq[id] || 0) + 1;
    });
  });

  const scoredPool = pool
    .filter(movie => !history.some(h => h.id === movie.id))
    .map(movie => {
      let score = 0;
      let matchingCount = 0;

      movie.genre_ids?.forEach(id => {
        if (genreFreq[id]) {
          matchingCount++;
          score += DEFAULT_WEIGHTS.genreOverlap + (genreFreq[id] * DEFAULT_WEIGHTS.genreFrequency);
        }
      });

      if (matchingCount > 1) {
        score *= (1 + (matchingCount * 0.5)); 
      }

      const recentFormat = history[0].media_type || (history[0].first_air_date ? 'tv' : 'movie');
      const movieType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
      if (recentFormat === movieType) {
        score += DEFAULT_WEIGHTS.mediaType;
      }

      score += (movie.vote_average * DEFAULT_WEIGHTS.rating);

      return { ...movie, recommendation_score: score };
    });

  return scoredPool
    .sort((a, b) => (b as any).recommendation_score - (a as any).recommendation_score)
    .slice(0, limit);
}

/**
 * Strict Similarity for "More Like This"
 * Prioritizes exact genre AND studio matches.
 */
export function getSimilarMovies(
  target: TMDBMovie,
  pool: TMDBMovie[],
  limit: number = 10
): TMDBMovie[] {
  if (!target || !pool.length) return [];

  // Normalize target data
  const targetGenres: number[] = target.genre_ids || target.genres?.map(g => g.id) || [];
  const targetStudios: string[] = target.production_companies?.map(c => c.name?.toLowerCase()) || [];
  const targetType = target.media_type || (target.first_air_date ? 'tv' : 'movie');

  const scoredPool = pool
    .filter(movie => movie.id !== target.id)
    .map(movie => {
      let score = 0;
      const movieGenres: number[] = movie.genre_ids || movie.genres?.map(g => g.id) || [];
      const movieStudios: string[] = movie.production_companies?.map(c => c.name?.toLowerCase()) || [];
      const movieType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');

      // 1. STUDIO MATCH (Very High Priority)
      if (targetStudios.length > 0 && movieStudios.length > 0) {
        const matchingStudios = movieStudios.filter(name => targetStudios.includes(name));
        if (matchingStudios.length > 0) {
          score += matchingStudios.length * 2000; // Massive studio bonus
        }
      }

      // 2. GENRE MATCH (High Priority)
      const matchingGenres = movieGenres.filter(id => targetGenres.includes(id));
      
      if (matchingGenres.length > 0) {
        score += matchingGenres.length * 500;
        
        if (matchingGenres.length === targetGenres.length && targetGenres.length > 0) {
          score += 2000;
        }
      }

      // 3. Format Match
      if (targetType === movieType) score += 100;

      // 4. Quality
      score += (movie.vote_average * 10);

      // 5. Popularity tie-breaker
      score += Math.log10(movie.popularity || 1);

      return { ...movie, similarity_score: score };
    });

  // Sort by score and return top results - NO FILTERING, just sorting
  return scoredPool
    .sort((a, b) => (b as any).similarity_score - (a as any).similarity_score)
    .slice(0, limit);
}
