import { AbstractLogger } from '@rosen-bridge/abstract-logger';

import { CONTRACTS_PREFIX, TOKENS_MAP_PREFIX } from '@/constants';

export type GithubReleaseClientOptions = {
  githubApiUrl: string;
  githubRepo: string;
  githubToken?: string;
  logger?: AbstractLogger;
};

export type GithubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

export type GithubRelease = {
  tag_name: string;
  prerelease: boolean;
  draft: boolean;
  published_at: string;
  assets: GithubReleaseAsset[];
};

export type prefixPattern = typeof CONTRACTS_PREFIX | typeof TOKENS_MAP_PREFIX;
