import { mockAxiosCreate, makeClient } from './githubReleaseClient.mock';
import { makeRelease, tokenMapPayload } from './testData';

vi.mock('@rosen-clients/rate-limited-axios');

vi.mock('../lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/constants')>();
  return { ...actual, RELEASES_PAGE_SIZE: 1 };
});

/**
 * installs a `get` mock that returns pagination results for the
 * `/releases` endpoint and the given download payload for asset URLs
 */
const mockGet = (downloadPayload: unknown = { tokens: {} }) => {
  const get = mockAxiosCreate();
  get.mockImplementation((url: string) => {
    if (url.includes('/releases')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: downloadPayload });
  });
  return get;
};

describe('GithubReleaseClient', () => {
  describe('loadReleases', () => {
    /**
     * @target loadReleases should seed the cache with provided releases and then fetch the rest
     * @dependencies
     * - axios client
     * @scenario
     * - axios pagination returns an empty page
     * - call `loadReleases` with two releases
     * @expected
     * - cache contains the two seeded releases
     * - cache is sorted by published_at descending
     * - axios was called for pagination
     */
    it('should seed cache and fetch remaining pages', async () => {
      const get = mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
        makeRelease('v2.0.0', '2024-02-01T00:00:00Z', [
          'tokensMap-pandora-2.0.0.json',
        ]),
      ]);

      expect(client.getReleases().map((r) => r.tag_name)).toEqual([
        'v2.0.0',
        'v1.0.0',
      ]);
      expect(get).toBeCalled();
    });

    /**
     * @target loadReleases should append releases from subsequent pages
     * @dependencies
     * - axios client
     * - RELEASES_PAGE_SIZE is mocked to 1 so multiple pages are exercised
     * @scenario
     * - axios returns two full pages then an empty page
     * - call `loadReleases` with one seed release
     * @expected
     * - cache contains releases from all pages, newest first
     */
    it('should append releases from subsequent pages', async () => {
      const get = mockAxiosCreate();
      get
        .mockResolvedValueOnce({
          data: [
            makeRelease('v3.0.0', '2024-03-01T00:00:00Z', [
              'tokensMap-pandora-3.0.0.json',
            ]),
          ],
        })
        .mockResolvedValueOnce({
          data: [
            makeRelease('v2.0.0', '2024-02-01T00:00:00Z', [
              'tokensMap-pandora-2.0.0.json',
            ]),
          ],
        })
        .mockResolvedValueOnce({ data: [] });

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
      ]);

      expect(client.getReleases().map((r) => r.tag_name)).toEqual([
        'v3.0.0',
        'v2.0.0',
        'v1.0.0',
      ]);
    });

    /**
     * @target loadReleases should filter out draft releases
     * @dependencies
     * - axios client
     * @scenario
     * - axios returns a full page containing a draft release and an empty next page
     * @expected
     * - draft release is not in cache
     */
    it('should filter out draft releases', async () => {
      const get = mockAxiosCreate();
      get
        .mockResolvedValueOnce({
          data: [
            makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [], { draft: true }),
            makeRelease('v2.0.0', '2024-02-01T00:00:00Z', []),
          ],
        })
        .mockResolvedValueOnce({ data: [] });

      const client = makeClient();
      await client.loadReleases([]);

      expect(client.getReleases().map((r) => r.tag_name)).toEqual(['v2.0.0']);
    });
  });

  describe('sortReleasesByDateDesc', () => {
    /**
     * @target sortReleasesByDateDesc should reorder the cache by published_at descending
     * @dependencies
     * - axios client
     * @scenario
     * - seed cache with releases out of order
     * @expected
     * - cache is sorted by date, newest first
     */
    it('should sort releases by published_at descending', async () => {
      mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', []),
        makeRelease('v3.0.0', '2024-03-01T00:00:00Z', []),
        makeRelease('v2.0.0', '2024-02-01T00:00:00Z', []),
      ]);

      expect(client.getReleases().map((r) => r.tag_name)).toEqual([
        'v3.0.0',
        'v2.0.0',
        'v1.0.0',
      ]);
    });
  });

  describe('getNetworks', () => {
    /**
     * @target getNetworks should return unique networks across releases
     * @dependencies
     * - axios client
     * @scenario
     * - load releases containing tokensMap assets for different networks
     * - call `getNetworks`
     * @expected
     * - returns each network once
     */
    it('should return unique networks across releases', async () => {
      mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
          'tokensMap-ergo-1.0.0.json',
        ]),
        makeRelease('v2.0.0', '2024-02-01T00:00:00Z', [
          'tokensMap-pandora-2.0.0.json',
        ]),
      ]);

      expect(client.getNetworks().sort()).toEqual(['ergo', 'pandora']);
    });

    /**
     * @target getNetworks should recognize permissive version formats
     * @dependencies
     * - axios client
     * @scenario
     * - load assets named with versions like `7.1` and `7.1.1.1`
     * @expected
     * - both networks are included in the result
     */
    it('should recognize permissive version formats', async () => {
      mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-7.1.json',
          'tokensMap-ergo-7.1.1.1.json',
        ]),
      ]);

      expect(client.getNetworks().sort()).toEqual(['ergo', 'pandora']);
    });

    /**
     * @target getNetworks should ignore non tokensMap assets
     * @dependencies
     * - axios client
     * @scenario
     * - load releases with unrelated assets
     * @expected
     * - returns empty array
     */
    it('should ignore non tokensMap assets', async () => {
      mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'README.md',
          'checksums.txt',
        ]),
      ]);

      expect(client.getNetworks()).toEqual([]);
    });
  });

  describe('getVersions', () => {
    /**
     * @target getVersions should return "latest" followed by unique versions, newest first
     * @dependencies
     * - axios client
     * @scenario
     * - load releases with multiple versions for the same network
     * - call `getVersions`
     * @expected
     * - result starts with "latest", then versions in cache order without duplicates
     */
    it('should return latest plus unique versions in order', async () => {
      mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v2.0.0', '2024-02-01T00:00:00Z', [
          'tokensMap-pandora-2.0.0.json',
        ]),
        makeRelease('v1.0.1', '2024-01-15T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
      ]);

      expect(client.getVersions('pandora')).toEqual([
        'latest',
        '2.0.0',
        '1.0.0',
      ]);
    });

    /**
     * @target getVersions should return only "latest" when the network has no assets
     * @dependencies
     * - axios client
     * @scenario
     * - load releases with no assets for the requested network
     * @expected
     * - returns ["latest"]
     */
    it('should return only latest when network has no assets', async () => {
      mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
      ]);

      expect(client.getVersions('ergo')).toEqual(['latest']);
    });
  });

  describe('getTokenMap', () => {
    /**
     * @target getTokenMap with "latest" should pick newest stable release containing the network
     * @dependencies
     * - axios client
     * @scenario
     * - load a prerelease with a newer asset and a stable older one
     * - call `getTokenMap` with "latest"
     * @expected
     * - the stable release's asset is downloaded
     */
    it('should pick newest stable release containing the network for latest', async () => {
      const get = mockGet(tokenMapPayload);

      const client = makeClient();
      await client.loadReleases([
        makeRelease(
          'v2.0.0',
          '2024-02-01T00:00:00Z',
          ['tokensMap-pandora-2.0.0.json'],
          { prerelease: true },
        ),
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
      ]);

      await client.getTokenMap('pandora', 'latest');

      expect(get).toHaveBeenLastCalledWith(
        'https://example.com/tokensMap-pandora-1.0.0.json',
      );
    });

    /**
     * @target getTokenMap with "latest" should skip stable releases that don't contain the network
     * @dependencies
     * - axios client
     * @scenario
     * - newest stable has only networkA, older stable has networkB
     * - call `getTokenMap('networkB', 'latest')`
     * @expected
     * - older stable release's asset for networkB is used
     */
    it('should fall back to older stable release containing the network', async () => {
      const get = mockGet(tokenMapPayload);

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v2.0.0', '2024-02-01T00:00:00Z', [
          'tokensMap-networkA-2.0.0.json',
        ]),
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-networkB-1.0.0.json',
        ]),
      ]);

      await client.getTokenMap('networkB', 'latest');

      expect(get).toHaveBeenLastCalledWith(
        'https://example.com/tokensMap-networkB-1.0.0.json',
      );
    });

    /**
     * @target getTokenMap should match the exact version when not "latest"
     * @dependencies
     * - axios client
     * @scenario
     * - load releases with versions 1.0.0 and 2.0.0
     * - call `getTokenMap(network, '1.0.0')`
     * @expected
     * - the 1.0.0 asset is downloaded
     */
    it('should match exact version when not latest', async () => {
      const get = mockGet(tokenMapPayload);

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v2.0.0', '2024-02-01T00:00:00Z', [
          'tokensMap-pandora-2.0.0.json',
        ]),
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
      ]);

      await client.getTokenMap('pandora', '1.0.0');

      expect(get).toHaveBeenLastCalledWith(
        'https://example.com/tokensMap-pandora-1.0.0.json',
      );
    });

    /**
     * @target getTokenMap should throw when no release matches the version
     * @dependencies
     * - axios client
     * @scenario
     * - load releases without the requested version
     * - call `getTokenMap`
     * @expected
     * - throws an error mentioning version and network
     */
    it('should throw when version is not found', async () => {
      mockGet();

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
      ]);

      await expect(client.getTokenMap('pandora', '9.9.9')).rejects.toThrow(
        'Version [9.9.9] not found for network [pandora]',
      );
    });

    /**
     * @target getTokenMap should parse the downloaded token map
     * @dependencies
     * - axios client
     * @scenario
     * - mock download to return a tokens payload
     * - call `getTokenMap`
     * @expected
     * - returns the parsed tokens map
     */
    it('should parse the downloaded token map', async () => {
      mockGet(tokenMapPayload);

      const client = makeClient();
      await client.loadReleases([
        makeRelease('v1.0.0', '2024-01-01T00:00:00Z', [
          'tokensMap-pandora-1.0.0.json',
        ]),
      ]);

      const result = await client.getTokenMap('pandora', 'latest');
      expect(result[0]['erg']).toMatchObject({
        name: 'ERG',
        decimals: 9,
      });
    });
  });
});
