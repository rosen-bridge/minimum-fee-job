import { vi } from 'vitest';

import { DummyLogger } from '@rosen-bridge/abstract-logger';
import RateLimitedAxios from '@rosen-clients/rate-limited-axios';

import { GithubReleaseClient } from '../lib/githubReleaseClient';

/**
 * mocks `RateLimitedAxios.create` and returns the shared `get` spy
 */
export const mockAxiosCreate = () => {
  const get = vi.fn();
  vi.mocked(RateLimitedAxios.create).mockReturnValue({
    get,
  } as unknown as ReturnType<typeof RateLimitedAxios.create>);
  return get;
};

/**
 * builds a GithubReleaseClient with the test logger and repo
 */
export const makeClient = (): GithubReleaseClient =>
  new GithubReleaseClient({
    githubRepo: 'org/repo',
    githubApiUrl: 'https://api.github.com',
    logger: new DummyLogger(),
  });
