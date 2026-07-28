export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  imdb_id?: string | null;
  external_ids?: {
    imdb_id?: string | null;
  };
  vote_average: number;
  popularity: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  production_companies?: { id: number; name: string; logo_path?: string | null }[];
  media_type?: 'movie' | 'tv';
  relevance_score?: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[];
}
