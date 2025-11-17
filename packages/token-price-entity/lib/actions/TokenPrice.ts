import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import {
  DataSource,
  LessThan,
  Repository,
} from '@rosen-bridge/extended-typeorm';

import { TokenPriceEntity } from '../entities';
import { TOKEN_PRICE_DEFAULT_MAX_AGE } from '../utils';

export class TokenPriceAction {
  private readonly repository: Repository<TokenPriceEntity>;
  readonly logger: AbstractLogger;

  constructor(dataSource: DataSource, logger?: AbstractLogger) {
    this.repository = dataSource.getRepository(TokenPriceEntity);
    this.logger = logger ?? new DummyLogger();
  }

  /**
   * Fetch the most recent price entry BEFORE the given timestamp.
   *
   * @param tokenId      native token id of the network
   * @param timestamp    reference timestamp (seconds)
   * @param maxAgeSeconds max allowed age (default: TOKEN_PRICE_DEFAULT_MAX_AGE). Use -1 to disable.
   */
  getLatestTokenPrice = async (
    tokenId: string,
    timestamp: number,
    maxAgeSeconds: number = TOKEN_PRICE_DEFAULT_MAX_AGE,
  ): Promise<number | undefined> => {
    if (maxAgeSeconds < -1) {
      throw new Error(
        `Invalid maxAgeSeconds [${maxAgeSeconds}]. Must be >= 0 or -1 to disable validation.`,
      );
    }

    this.logger.debug(
      `Fetching latest token price for tokenId [${tokenId}] with timestamp [${timestamp}] and maxAge [${maxAgeSeconds}]`,
    );

    const record = await this.repository.findOne({
      where: {
        tokenId,
        timestamp: LessThan(timestamp),
      },
      order: { timestamp: 'DESC' },
    });

    if (!record) {
      this.logger.debug(
        `No price found for tokenId [${tokenId}] before timestamp [${timestamp}]`,
      );
      return undefined;
    }

    const age = timestamp - record.timestamp;

    if (maxAgeSeconds !== -1 && age > maxAgeSeconds) {
      this.logger.debug(
        `Price found for tokenId [${tokenId}] but too old. Age [${age}] exceeds maxAge [${maxAgeSeconds}]. Returning undefined.`,
      );
      return undefined;
    }

    return record.price;
  };
}
