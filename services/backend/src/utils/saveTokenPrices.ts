import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { TokenPriceEntity } from '@rosen-bridge/token-price-entity';

import { dataSource } from '../database/dataSource';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

/**
 * Stores fetched token prices into the TokenPriceEntity table as historical records.
 *
 * @function saveTokenPrices
 * @param {Map<string, number>} prices - A map of token IDs with its price
 *
 * @returns {Promise<void>} Resolves once all valid token prices are saved.
 */
export const saveTokenPrices = async (
  prices: Map<string, number>,
): Promise<void> => {
  try {
    if (prices.size > 0) {
      const timestamp = Math.floor(Date.now() / 1000);

      await dataSource.getRepository(TokenPriceEntity).insert(
        Array.from(prices, ([tokenId, price]) => ({
          timestamp,
          tokenId,
          price,
        })),
      );

      logger.info(`Stored [${prices.size}] prices at [${timestamp}]`);
    }
  } catch (err) {
    logger.error(
      `Failed to store prices: ${err instanceof Error ? err.message : err}`,
    );
    if (err instanceof Error && err.stack) logger.error(err.stack);
  }
};
