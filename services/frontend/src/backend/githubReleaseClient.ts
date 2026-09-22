import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import RateLimitedAxios from '@rosen-clients/rate-limited-axios';

import { CHAIN_KEY, CONTRACT_REPO, GITHUB_API_URL } from '@/constants';
import {
  ContractNetwork,
  GithubRelease,
  GithubReleaseAsset,
  TokenMap,
  TokenMapFile,
  TokenSet,
} from '@/types';

export class GithubReleaseClient {
  protected client = RateLimitedAxios.create({
    baseURL: GITHUB_API_URL,
    headers: { Accept: 'application/vnd.github+json' },
  });

  constructor(
    protected logger: AbstractLogger = new DummyLogger(),
    token?: string,
  ) {
    if (token)
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  /**
   * fetches non-draft releases from the contract repo
   *
   * @returns list of GitHub releases
   */
  protected releases = async (): Promise<GithubRelease[]> => {
    const response = await this.client.get<GithubRelease[]>(
      `/repos/${CONTRACT_REPO}/releases`,
      { params: { per_page: 100 } },
    );
    return response.data.filter((release) => !release.draft);
  };

  /**
   * builds the asset-name pattern for a network
   *
   * @param network - network to build the pattern for
   * @returns regex matching e.g. "tokensMap-pandora-7.1.1.json"
   */
  protected pattern = (network: ContractNetwork) =>
    new RegExp(`^tokensMap-${network}-(.+)\\.json$`);

  /**
   * finds the tokensMap asset in a release for a network
   *
   * @param release - release to search
   * @param network - network whose asset is wanted
   * @returns the matching asset, or undefined
   */
  protected assetOf = (
    release: GithubRelease,
    network: ContractNetwork,
  ): GithubReleaseAsset | undefined =>
    release.assets.find((asset) => this.pattern(network).test(asset.name));

  /**
   * converts a raw chain-keyed token set from the release JSON into the
   * array shape used across the codebase
   *
   * @param raw - one token set as it appears in the release file
   * @returns the same set as an array of RosenTokens with chain injected
   */
  protected normalizeTokenSet = (raw: TokenSet): TokenSet =>
    Object.entries(raw).map(([chain, token]) => ({
      ...token,
      chain: chain as CHAIN_KEY,
    }));

  /**
   * returns available versions for a network, newest first
   *
   * @param network - network to list versions for
   * @returns array of version strings prefixed by "latest"
   */
  getVersions = async (network: ContractNetwork): Promise<string[]> => {
    const pattern = this.pattern(network);
    const versions = (await this.releases())
      .map(
        (release) =>
          pattern.exec(this.assetOf(release, network)?.name ?? '')?.[1],
      )
      .filter((v): v is string => !!v);

    return ['latest', ...new Set(versions)];
  };

  getTokenMap = async (
    network: ContractNetwork,
    version: string,
  ): Promise<TokenMap> => {
    const pattern = this.pattern(network);
    const releases = await this.releases();

    const release =
      version === 'latest'
        ? releases.find((r) => !r.prerelease)
        : releases.find((r) =>
            r.assets.some((a) => pattern.exec(a.name)?.[1] === version),
          );

    if (!release) {
      throw new Error(
        `Version [${version}] not found for network [${network}]`,
      );
    }

    const asset = this.assetOf(release, network);
    if (!asset) {
      throw new Error(
        `Network [${network}] is not available in release [${release.tag_name}]`,
      );
    }

    this.logger.debug(`downloading ${asset.name}`);

    const response = await this.client.get<TokenMapFile>(
      asset.browser_download_url,
      { baseURL: '' },
    );

    return response.data.tokens.map(this.normalizeTokenSet);
  };
}
