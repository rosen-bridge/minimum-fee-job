import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { RosenTokens, TokenMap } from '@rosen-bridge/extended-tokens';
import RateLimitedAxios from '@rosen-clients/rate-limited-axios';

import {
  CONTRACTS_PREFIX,
  RELEASES_PAGE_SIZE,
  TOKENS_MAP_PREFIX,
} from '@/constants';
import {
  GithubRelease,
  GithubReleaseAsset,
  GithubReleaseClientOptions,
  prefixPattern,
  RosenContract,
} from '@/types';

export class GithubReleaseClient {
  protected client;
  protected logger: AbstractLogger;
  protected githubRepo: string;
  protected releasesCache = new Map<string, GithubRelease>();

  constructor(configs: GithubReleaseClientOptions) {
    this.githubRepo = configs.githubRepo;
    this.logger = configs.logger ?? new DummyLogger();

    this.client = RateLimitedAxios.create({
      baseURL: configs.githubApiUrl,
      headers: {
        Accept: 'application/vnd.github+json',
        ...(configs.githubToken
          ? { Authorization: `Bearer ${configs.githubToken}` }
          : {}),
      },
    });
  }

  /**
   * returns the locally cached releases
   *
   * @returns current list of cached releases
   */
  getReleases = (): GithubRelease[] => [...this.releasesCache.values()];

  /**
   * replaces the locally cached releases
   *
   * @param releases - releases to store in the cache
   */
  setReleases = (releases: GithubRelease[]): void => {
    this.releasesCache = new Map(releases.map((r) => [r.tag_name, r]));
    this.logger.debug(`cache set with ${this.releasesCache.size} releases`);
  };

  /**
   * fetches all remaining non-draft releases from the contract repo,
   * paginated, appending to the local cache
   *
   * @returns Promise<void>
   */
  fetchReleases = async (): Promise<void> => {
    const alreadyFetched = this.releasesCache.size;
    let page = Math.floor(alreadyFetched / RELEASES_PAGE_SIZE) + 1;

    this.logger.debug(
      `fetching releases from page ${page} (cache has ${alreadyFetched})`,
    );

    while (true) {
      this.logger.debug(
        `fetching releases page ${page} from [${this.githubRepo}]`,
      );

      const response = await this.client.get<GithubRelease[]>(
        `/repos/${this.githubRepo}/releases`,
        { params: { per_page: RELEASES_PAGE_SIZE, page } },
      );

      const batch = response.data.filter((release) => !release.draft);
      for (const release of batch) {
        const { tag_name, prerelease, draft, published_at, assets } = release;
        this.releasesCache.set(tag_name, {
          tag_name,
          prerelease,
          draft,
          published_at,
          assets: assets.map(({ name, browser_download_url }) => ({
            name,
            browser_download_url,
          })),
        });
      }

      if (response.data.length < RELEASES_PAGE_SIZE) break;
      page++;
    }

    this.logger.debug(`cache now has ${this.releasesCache.size} releases`);
  };

  /**
   * builds the asset-name pattern for a network and prefix
   *
   * @param network - network to build the pattern for
   * @param prefix  - asset prefix, e.g. "tokensMap" or "contracts"
   * @returns regex matching e.g. "tokensMap-pandora-7.1.1.json"
   */
  protected pattern = (network: string, prefix: prefixPattern) =>
    new RegExp(`^${prefix}-${network}-(.+)\\.json$`);

  /**
   * extracts the network name from a tokensMap asset name
   *
   * @param assetName - asset file name
   * @returns the network name, or null if it does not match any tokensMap asset
   */
  protected parseNetworkFromAssetName = (assetName: string): string | null => {
    const match = /^tokensMap-(.+?)-\d+\.\d+\.\d+(?:-[0-9a-f]+)?\.json$/.exec(
      assetName,
    );
    return match?.[1] ?? null;
  };

  /**
   * extracts the version string from an asset name for a network and prefix
   *
   * @param assetName - asset file name
   * @param network   - network the asset belongs to
   * @param prefix    - asset prefix, e.g. "tokensMap" or "contracts"
   * @returns the version substring, or null if the name does not match
   */
  protected parseVersionFromAssetName = (
    assetName: string,
    network: string,
    prefix: prefixPattern,
  ): string | null => {
    const match = this.pattern(network, prefix).exec(assetName);
    return match?.[1] ?? null;
  };

  /**
   * finds the asset in a release for a network and prefix
   *
   * @param release - release to search
   * @param network - network whose asset is wanted
   * @param prefix  - asset prefix, e.g. "tokensMap" or "contracts"
   * @returns the matching asset, or undefined
   */
  protected assetOf = (
    release: GithubRelease,
    network: string,
    prefix: prefixPattern,
  ): GithubReleaseAsset | undefined =>
    release.assets.find((asset) =>
      this.pattern(network, prefix).test(asset.name),
    );

  /**
   * resolves the release that contains the asset for a network and version
   *
   * for "latest", the newest non-prerelease release is used; otherwise the
   * exact version is matched against the release assets
   *
   * @param network - network whose release is wanted
   * @param version - version to match, or "latest" for the newest stable
   * @param prefix  - asset prefix, e.g. "tokensMap" or "contracts"
   * @returns the matching release
   * @throws if no release matches
   */
  protected findRelease = (
    network: string,
    version: string,
    prefix: prefixPattern,
  ): GithubRelease => {
    const pattern = this.pattern(network, prefix);
    const releases = this.getReleases();

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

    return release;
  };

  /**
   * downloads the asset for a network and version
   *
   * @param network - network whose asset is wanted
   * @param version - version to fetch, or "latest" for the newest stable
   * @param prefix  - asset prefix, e.g. "tokensMap" or "contracts"
   * @returns the parsed asset payload
   */
  protected downloadAsset = async <T>(
    network: string,
    version: string,
    prefix: prefixPattern,
  ): Promise<T> => {
    const release = this.findRelease(network, version, prefix);

    const asset = this.assetOf(release, network, prefix);
    if (!asset) {
      throw new Error(
        `Network [${network}] is not available in release [${release.tag_name}]`,
      );
    }

    this.logger.debug(`downloading ${asset.name}`);

    const response = await this.client.get<T>(asset.browser_download_url);
    return response.data;
  };

  /**
   * returns the list of all networks that have at least one tokensMap asset
   * across all published releases
   *
   * @returns array of unique network names
   */
  getNetworks = (): string[] => {
    const networks = new Set<string>();

    for (const release of this.getReleases()) {
      for (const asset of release.assets) {
        const network = this.parseNetworkFromAssetName(asset.name);
        if (network) networks.add(network);
      }
    }

    this.logger.debug(`found ${networks.size} networks`);

    return [...networks];
  };

  /**
   * returns all available versions for a network across all published
   * releases, newest first, always prefixed by "latest"
   *
   * @param network - network to list versions for
   * @returns array of version strings prefixed by "latest"
   */
  getVersions = (network: string): string[] => {
    const versions = this.getReleases()
      .map((release) =>
        this.parseVersionFromAssetName(
          this.assetOf(release, network, TOKENS_MAP_PREFIX)?.name ?? '',
          network,
          TOKENS_MAP_PREFIX,
        ),
      )
      .filter((version): version is string => !!version);

    return ['latest', ...new Set(versions)];
  };

  /**
   * downloads and parses the token map for a network and version
   *
   * @param network - network the token map belongs to
   * @param version - version to fetch, or "latest" for the newest stable
   * @returns the token map payload
   */
  getTokenMap = async (
    network: string,
    version: string,
  ): Promise<RosenTokens> => {
    const data = await this.downloadAsset<{
      version: string;
      tokens: RosenTokens;
    }>(network, version, TOKENS_MAP_PREFIX);

    const tokenMap = new TokenMap();
    await tokenMap.updateConfigByJson(data.tokens);
    return tokenMap.getRawConfig();
  };

  /**
   * downloads and parses the contract for a network and version
   *
   * @param network - network the contract belongs to
   * @param version - version to fetch, or "latest" for the newest stable
   * @returns the contract payload
   */
  getContract = async (
    network: string,
    version: string,
  ): Promise<RosenContract> => {
    return this.downloadAsset<RosenContract>(
      network,
      version,
      CONTRACTS_PREFIX,
    );
  };
}
