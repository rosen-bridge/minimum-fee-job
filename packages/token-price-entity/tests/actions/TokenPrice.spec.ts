import { describe, it, expect, beforeEach } from 'vitest';

import { DataSource, Repository } from '@rosen-bridge/extended-typeorm';

import { TokenPriceAction } from '../../lib/actions';
import { TokenPriceEntity } from '../../lib/entities';
import { createDatabase } from '../utils';

let dataSource: DataSource;
let action: TokenPriceAction;
let repository: Repository<TokenPriceEntity>;

describe('TokenPriceAction', () => {
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
   * - call action.getLatestTokenPrice with a timestamp
   * @expected
   * - should return most recent price less than timestamp
   */
  it('should return latest valid price before timestamp', async () => {
    await repository.insert([
      { tokenId: 'ERG', price: 10, timestamp: 100 },
      { tokenId: 'ERG', price: 20, timestamp: 200 },
      { tokenId: 'ERG', price: 30, timestamp: 300 },
    ]);

    const result = await action.getLatestTokenPrice('ERG', 250);
    expect(result).toEqual(20);
  });

  /**
   * @target getLatestTokenPrice should return undefined if no price exists before timestamp
   * @dependency database
   * @scenario
   * - insert some prices
   * - call with timestamp earlier than all records
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
   * @target getLatestTokenPrice should enforce max age and return undefined if record too old
   * @dependency database
   * @scenario
   * - insert a single price
   * - timestamp - priceTimestamp > maxAge
   * @expected
   * - return undefined
   */
  it('should return undefined if the most recent price is older than maxAgeSeconds', async () => {
    await repository.insert({
      tokenId: 'ERG',
      price: 100,
      timestamp: 1000,
    });

    const result = await action.getLatestTokenPrice('ERG', 12000, 2000);
    expect(result).toBeUndefined();
  });

  /**
   * @target getLatestTokenPrice should return price if exactly on maxAgeSeconds boundary
   * @dependency database
   * @scenario
   * - insert price
   * - timestamp - priceTimestamp === maxAgeSeconds
   * @expected
   * - should return price
   */
  it('should return price when exactly at maxAgeSeconds boundary', async () => {
    await repository.insert({
      tokenId: 'ERG',
      price: 77,
      timestamp: 1000,
    });

    const result = await action.getLatestTokenPrice('ERG', 1000 + 9000, 9000);
    expect(result).toEqual(77);
  });

  /**
   * @target getLatestTokenPrice should return latest price regardless of age when maxAgeSeconds = -1
   * @dependency database
   * @scenario
   * - insert price older than default max
   * - call with maxAgeSeconds = -1
   * @expected
   * - should return price
   */
  it('should return price regardless of age when validation disabled using -1', async () => {
    await repository.insert({
      tokenId: 'ERG',
      price: 55,
      timestamp: 1000,
    });

    const result = await action.getLatestTokenPrice('ERG', 5000, -1);
    expect(result).toEqual(55);
  });

  /**
   * @target getLatestTokenPrice should throw error for invalid negative maxAgeSeconds
   * @dependency none
   * @scenario
   * - call with invalid negative maxAgeSeconds (< -1)
   * @expected
   * - throw error
   */
  it('should throw error for invalid negative maxAgeSeconds', async () => {
    await expect(action.getLatestTokenPrice('ERG', 1000, -5)).rejects.toThrow(
      'Invalid maxAgeSeconds',
    );
  });

  /**
   * @target getLatestTokenPrice should select correct record from multiple timestamps
   * @dependency repository
   * @scenario
   * - insert prices with timestamps 100, 500, 900
   * - call with timestamp 850
   * @expected
   * - return price @ timestamp 500
   */
  it('should select most recent valid price from multiple entries', async () => {
    await repository.insert([
      { tokenId: 'ERG', price: 15, timestamp: 100 },
      { tokenId: 'ERG', price: 25, timestamp: 500 },
      { tokenId: 'ERG', price: 35, timestamp: 900 },
    ]);

    const result = await action.getLatestTokenPrice('ERG', 850);
    expect(result).toEqual(25);
  });
});
