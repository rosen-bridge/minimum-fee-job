import { describe, it, expect, beforeEach } from 'vitest';

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

  /**
   * @target getLatestTokenPrice should return the most recent price before timestamp
   * @dependency database
   * @scenario
   * - insert multiple prices for a token
   * - call getLatestTokenPrice with a timestamp
   * @expected
   * - return the most recent price before timestamp
   */
  it('should return the most recent price before timestamp', async () => {
    await repository.insert([
      { tokenId: 'ERG', price: 10, timestamp: 100 },
      { tokenId: 'ERG', price: 20, timestamp: 200 },
      { tokenId: 'ERG', price: 30, timestamp: 300 },
    ]);

    const result = await action.getLatestTokenPrice('ERG', 250);
    expect(result).toEqual(20);
  });

  /**
   * @target getLatestTokenPrice should return undefined when no price exists before timestamp
   * @dependency database
   * @scenario
   * - insert prices with timestamps greater than query timestamp
   * - call getLatestTokenPrice
   * @expected
   * - return undefined
   */
  it('should return undefined when no price exists before timestamp', async () => {
    await repository.insert([
      { tokenId: 'ERG', price: 10, timestamp: 500 },
      { tokenId: 'ERG', price: 20, timestamp: 600 },
    ]);

    const result = await action.getLatestTokenPrice('ERG', 100);
    expect(result).toBeUndefined();
  });

  /**
   * @target getLatestTokenPrice should return undefined when the latest price is older than maxAgeSeconds
   * @dependency database
   * @scenario
   * - insert a single price
   * - ensure timestamp - priceTimestamp > maxAgeSeconds
   * @expected
   * - return undefined
   */
  it('should return undefined when the latest price is older than maxAgeSeconds', async () => {
    await repository.insert({
      tokenId: 'ERG',
      price: 100,
      timestamp: 1000,
    });

    const result = await action.getLatestTokenPrice('ERG', 12000, 2000);
    expect(result).toBeUndefined();
  });

  /**
   * @target getLatestTokenPrice should return undefined when the latest price is older than default maxAgeSeconds
   * @dependency database
   * @scenario
   * - insert a price
   * - call without passing maxAgeSeconds (use default)
   * @expected
   * - return undefined
   */
  it('should return undefined when the latest price is older than default maxAgeSeconds', async () => {
    await repository.insert({
      tokenId: 'ERG',
      price: 100,
      timestamp: 1000,
    });

    const result = await action.getLatestTokenPrice('ERG', 20000);
    expect(result).toBeUndefined();
  });

  /**
   * @target getLatestTokenPrice should return the price when record age equals maxAgeSeconds
   * @dependency database
   * @scenario
   * - insert a price
   * - call with (timestamp - priceTimestamp) equals maxAgeSeconds
   * @expected
   * - return the price
   */
  it('should return the price when record age equals maxAgeSeconds', async () => {
    await repository.insert({
      tokenId: 'ERG',
      price: 77,
      timestamp: 1000,
    });

    const result = await action.getLatestTokenPrice('ERG', 1000 + 9000, 9000);
    expect(result).toEqual(77);
  });

  /**
   * @target getLatestTokenPrice should return the price when maxAgeSeconds is disabled using -1
   * @dependency database
   * @scenario
   * - insert an old price
   * - call with maxAgeSeconds = -1
   * @expected
   * - return the price
   */
  it('should return the price when maxAgeSeconds is disabled using -1', async () => {
    await repository.insert({
      tokenId: 'ERG',
      price: 55,
      timestamp: 1000,
    });

    const result = await action.getLatestTokenPrice('ERG', 5000, -1);
    expect(result).toEqual(55);
  });

  /**
   * @target getLatestTokenPrice should throw error for invalid maxAgeSeconds
   * @dependency none
   * @scenario
   * - call with a negative maxAgeSeconds less than -1
   * @expected
   * - throw error
   */
  it('should throw error for invalid maxAgeSeconds', async () => {
    await expect(action.getLatestTokenPrice('ERG', 1000, -5)).rejects.toThrow(
      Error,
    );
  });
});
