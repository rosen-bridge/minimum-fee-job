import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DataSource, Repository } from '@rosen-bridge/extended-typeorm';

import { TokenPriceAction } from '../../lib/actions';
import { TokenPriceEntity } from '../../lib/entities';
import { createDatabase } from '../utils';

describe('TokenPriceAction', () => {
  let dataSource: DataSource;
  let action: TokenPriceAction;
  let repository: Repository<TokenPriceEntity>;

  beforeEach(async () => {
    dataSource = await createDatabase();
    action = new TokenPriceAction(dataSource);
    repository = dataSource.getRepository(TokenPriceEntity);
  });
  afterEach(async () => {
    await repository.clear();
  });

  /**
   * @target getLatestTokenPrice should return the most recent price before timestamp
   * @dependency database
   * @scenario
   * - insert multiple prices for a token
   * - call getLatestTokenPrice with a timestamp
   * - maxAgeSeconds not provided (default -1 disables age check)
   * @expected
   * - return the most recent price before the timestamp
   */
  it('should return the most recent price before timestamp', async () => {
    await repository.insert([
      { tokenId: 'ERG', price: 10, timestamp: 100 },
      { tokenId: 'ERG', price: 20, timestamp: 200 },
      { tokenId: 'ERG', price: 30, timestamp: 300 },
    ]);

    const result = await action.getLatestTokenPrice('ERG', 201);
    expect(result).toEqual(20);
  });

  /**
   * @target getLatestTokenPrice should return undefined when no price exists before timestamp
   * @dependency database
   * @scenario
   * - insert prices with timestamps greater than the query timestamp
   * - call getLatestTokenPrice
   * @expected
   * - return undefined
   */
  it('should return undefined when no price exists before timestamp', async () => {
    await repository.insert([
      { tokenId: 'ERG', price: 10, timestamp: 500 },
      { tokenId: 'ERG', price: 20, timestamp: 600 },
    ]);

    const result = await action.getLatestTokenPrice('ERG', 499);
    expect(result).toBeUndefined();
  });

  /**
   * @target getLatestTokenPrice should return undefined when record age exceeds maxAgeSeconds
   * @dependency database
   * @scenario
   * - insert a single price
   * - call with timestamp - priceTimestamp > maxAgeSeconds
   * - maxAgeSeconds explicitly set
   * @expected
   * - return undefined
   */
  it('should return undefined when record age exceeds maxAgeSeconds', async () => {
    await repository.insert({ tokenId: 'ERG', price: 100, timestamp: 1000 });
    const result = await action.getLatestTokenPrice('ERG', 3001, 2000);
    expect(result).toBeUndefined();
  });

  /**
   * @target getLatestTokenPrice should return price when maxAgeSeconds is disabled
   * @dependency database
   * @scenario
   * - insert a price
   * - call without maxAgeSeconds
   * - default maxAgeSeconds = -1 disables age check
   * @expected
   * - return the price
   */
  it('should return price when maxAgeSeconds is disabled', async () => {
    await repository.insert({ tokenId: 'ERG', price: 42, timestamp: 1000 });
    const result = await action.getLatestTokenPrice('ERG', 20000);
    expect(result).toEqual(42);
  });

  /**
   * @target getLatestTokenPrice should return price when record age equals maxAgeSeconds
   * @dependency database
   * @scenario
   * - insert a price
   * - call with timestamp - priceTimestamp = maxAgeSeconds
   * - maxAgeSeconds explicitly set
   * @expected
   * - return the price
   */
  it('should return price when record age equals maxAgeSeconds', async () => {
    await repository.insert({ tokenId: 'ERG', price: 77, timestamp: 1000 });
    const result = await action.getLatestTokenPrice('ERG', 1000 + 9000, 9000);
    expect(result).toEqual(77);
  });

  /**
   * @target getLatestTokenPrice should return price when maxAgeSeconds is disabled (-1)
   * @dependency database
   * @scenario
   * - insert a price
   * - call with maxAgeSeconds = -1
   * @expected
   * - return the price
   */
  it('should return price when maxAgeSeconds is disabled (-1)', async () => {
    await repository.insert({ tokenId: 'ERG', price: 55, timestamp: 1000 });
    const result = await action.getLatestTokenPrice('ERG', 5000, -1);
    expect(result).toEqual(55);
  });

  /**
   * @target getLatestTokenPrice should throw error for invalid maxAgeSeconds
   * @dependency none
   * @scenario
   * - call with maxAgeSeconds < -1
   * @expected
   * - throw Error
   */
  it('should throw error for invalid maxAgeSeconds', async () => {
    await expect(action.getLatestTokenPrice('ERG', 1000, -5)).rejects.toThrow(
      Error,
    );
  });

  /**
   * @target getLatestTokenPrice should return price when record age just below maxAgeSeconds
   * @dependency database
   * @scenario
   * - insert a price
   * - call with timestamp - priceTimestamp < maxAgeSeconds
   * - maxAgeSeconds explicitly set
   * @expected
   * - return the price
   */
  it('should return price when record age just below maxAgeSeconds', async () => {
    await repository.insert({ tokenId: 'ERG', price: 88, timestamp: 1000 });
    const result = await action.getLatestTokenPrice('ERG', 1000 + 8999, 9000);
    expect(result).toEqual(88);
  });

  /**
   * @target getLatestTokenPrice should return undefined when record age just above maxAgeSeconds
   * @dependency database
   * @scenario
   * - insert a price
   * - call with timestamp - priceTimestamp > maxAgeSeconds
   * - maxAgeSeconds explicitly set
   * @expected
   * - return undefined
   */
  it('should return undefined when record age just above maxAgeSeconds', async () => {
    await repository.insert({ tokenId: 'ERG', price: 99, timestamp: 1000 });
    const result = await action.getLatestTokenPrice('ERG', 1000 + 9001, 9000);
    expect(result).toBeUndefined();
  });
});
