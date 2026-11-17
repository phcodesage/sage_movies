import { beforeEach, describe, expect, it } from 'vitest';
import { getLastEpisode, recordLastEpisode } from './useWatchedEpisodes';

beforeEach(() => localStorage.clear());

describe('last episode memory', () => {
  it('round-trips the last watched episode per show', () => {
    recordLastEpisode(1399, 2, 3);
    recordLastEpisode(550, 1, 1);
    expect(getLastEpisode(1399)).toEqual({ season: 2, episode: 3 });
    expect(getLastEpisode('1399')).toEqual({ season: 2, episode: 3 });
    recordLastEpisode(1399, 2, 4);
    expect(getLastEpisode(1399)).toEqual({ season: 2, episode: 4 });
  });

  it('returns null for unknown shows and corrupt storage', () => {
    expect(getLastEpisode(1)).toBeNull();
    localStorage.setItem('sage_movies_last_episode', '{oops');
    expect(getLastEpisode(1399)).toBeNull();
    localStorage.setItem(
      'sage_movies_last_episode',
      JSON.stringify({ 1399: { season: 0, episode: -1 } })
    );
    expect(getLastEpisode(1399)).toBeNull();
  });
});
