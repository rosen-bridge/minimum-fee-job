import { CONTRACT_NETWORKS } from '@/constants';

export type ContractNetwork = (typeof CONTRACT_NETWORKS)[number];

export interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface GithubRelease {
  tag_name: string;
  prerelease: boolean;
  draft: boolean;
  published_at: string;
  assets: GithubReleaseAsset[];
}
