import { describe, expect, it } from 'vitest';
import { buildVideasyKey, pickBestSource } from './videasyResolver';

describe('buildVideasyKey', () => {
  it('matches the reverse-engineered key format for a known TMDB id', () => {
    expect(buildVideasyKey(550)).toBe(
      '7ry6NAMMP7C4LALgWVvXH9rm1nAVAJivyVN9G92ZHw4z5VW1PlFyLYXBqpA'
    );
  });
});

describe('pickBestSource', () => {
  it('prefers the highest-quality HLS source over lower-quality HLS and mp4 fallbacks', () => {
    const result = pickBestSource(
      [
        { quality: '720p', url: 'https://cdn.example.com/movie-720.m3u8' },
        { quality: '1080p', url: 'https://cdn.example.com/movie-1080.m3u8' },
        { quality: '2160p', url: 'https://cdn.example.com/movie-2160.mp4' },
      ],
      [{ label: 'English', file: 'https://cdn.example.com/en.vtt' }]
    );

    expect(result).toEqual({
      url: 'https://cdn.example.com/movie-1080.m3u8',
      type: 'hls',
      quality: '1080p',
      subtitles: [{ label: 'English', file: 'https://cdn.example.com/en.vtt' }],
    });
  });

  it('falls back to direct video files when no HLS source exists', () => {
    const result = pickBestSource([
      { quality: '480p', url: 'https://cdn.example.com/movie-480.mp4' },
      { quality: '1080p', url: 'https://cdn.example.com/movie-1080.mp4' },
    ]);

    expect(result).toEqual({
      url: 'https://cdn.example.com/movie-1080.mp4',
      type: 'video',
      quality: '1080p',
      subtitles: [],
    });
  });
});
