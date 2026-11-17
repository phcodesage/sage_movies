import React from 'react';

export function MovieRowSkeleton() {
  return (
    <section className="mb-6">
      <div className="h-6 w-36 bg-gray-800 rounded mb-3 animate-pulse" />
      <div className="flex space-x-2 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="min-w-[100px] md:min-w-[140px] h-[150px] md:h-[210px] bg-gray-800 rounded-md animate-pulse shrink-0"
          />
        ))}
      </div>
    </section>
  );
}

export function MovieGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[2/3] w-full bg-gray-800 rounded-md animate-pulse" />
          <div className="h-3 w-full bg-gray-800 rounded animate-pulse" />
          <div className="h-2 w-1/2 bg-gray-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="mb-10 w-full" aria-hidden="true">
      <div className="flex items-center space-x-2 mb-4 border-b-4 border-black pb-2">
        <div className="h-6 w-40 bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[2/3] w-full bg-gray-800 rounded-md animate-pulse" />
            <div className="h-3 w-full bg-gray-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimilarTitlesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] w-full bg-gray-800 rounded-md animate-pulse" />
          <div className="h-2.5 w-3/4 bg-gray-800 rounded mt-1.5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function PosterGridSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 md:gap-6 w-full"
      aria-hidden="true"
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[2/3] w-full bg-gray-800 rounded-md animate-pulse" />
          <div className="h-3 w-full bg-gray-800 rounded animate-pulse" />
          <div className="h-2 w-1/2 bg-gray-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full bg-gray-800 animate-pulse">
      <div className="absolute inset-x-0 bottom-0 px-3 md:px-8 py-6 md:py-10">
        <div className="h-8 w-64 bg-gray-700 rounded mb-2 md:mb-3 animate-pulse" />
        <div className="h-4 w-48 bg-gray-700 rounded mb-3 md:mb-4 animate-pulse" />
        <div className="flex gap-2 md:gap-3">
          <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
