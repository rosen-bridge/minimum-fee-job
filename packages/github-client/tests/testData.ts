import type { RosenTokens } from '@rosen-bridge/extended-tokens';

import { GithubRelease, RosenContract } from '../lib/types';

/**
 * builds a GithubRelease object for use in tests
 */
export const makeRelease = (
  tagName: string,
  publishedAt: string,
  assetNames: string[],
  options: { prerelease?: boolean; draft?: boolean } = {},
): GithubRelease => ({
  tag_name: tagName,
  prerelease: options.prerelease ?? false,
  draft: options.draft ?? false,
  published_at: publishedAt,
  assets: assetNames.map((name) => ({
    name,
    browser_download_url: `https://example.com/${name}`,
  })),
});

/**
 * minimal tokens payload accepted by RosenTokens
 */
export const tokenMapPayload: { tokens: RosenTokens } = {
  tokens: [
    {
      erg: {
        tokenId:
          '0000000000000000000000000000000000000000000000000000000000000000',
        name: 'ERG',
        decimals: 9,
        type: 'native',
        residency: 'native',
        extra: {},
      },
    },
  ],
};

/**
 * minimal contract payload accepted by the client
 */
export const contractPayload: RosenContract = {
  tokens: {
    OctmNFT: 'token-id',
  },
  addresses: {
    OctmAddress: 'addr1',
  },
};
