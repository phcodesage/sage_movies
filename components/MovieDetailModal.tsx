'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Play } from 'lucide-react';
import Image from 'next/image';
import type { TMDBMovie } from '../types/tmdb';

export default function MovieDetailModal({
  movie,
  onClose,
  genres,
}: {
  movie: TMDBMovie;
  onClose: () => void;
  genres: Record<number, string>;
}) {
  const router = useRouter();
  const title = movie.title || movie.name || 'Untitled';
  const handlePlay = () => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    onClose();
    router.push(`/movie/${movie.id}/${mediaType}-${slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/95 p-6"
    >
      <button onClick={onClose} aria-label="Close details" className="mb-6 rounded bg-zinc-800 p-3">
        <ArrowLeft />
      </button>
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[240px_1fr]">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[240px] overflow-hidden rounded-lg">
          <Image
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : '/poster-placeholder.svg'
            }
            alt={title}
            fill
            sizes="240px"
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="mb-4 text-3xl font-black">{title}</h2>
          <p className="mb-4 flex items-center gap-2 text-yellow-400">
            <Star size={18} />
            {movie.vote_average?.toFixed(1) || 'Unrated'}
          </p>
          <p className="mb-4 text-zinc-400">
            {movie.genre_ids
              ?.map((id) => genres[id])
              .filter(Boolean)
              .join(', ')}
          </p>
          <p className="mb-6 leading-relaxed text-zinc-200">
            {movie.overview || 'No description available.'}
          </p>
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 rounded bg-netflix-red px-6 py-3 font-bold"
          >
            <Play size={20} /> Watch now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
