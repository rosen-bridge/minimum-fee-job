import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import {
  DataSource,
  LessThan,
  Repository,
} from '@rosen-bridge/extended-typeorm';

import { TokenPriceEntity } from '../entities';

export class TokenPriceAction {
  private readonly repository: Repository<TokenPriceEntity>;
  readonly logger: AbstractLogger;

  private readonly DEFAULT_MAX_AGE = 9000; // 2.5 h

  constructor(dataSource: DataSource, logger?: AbstractLogger) {
    this.repository = dataSource.getRepository(TokenPriceEntity);
    this.logger = logger ? logger : new DummyLogger();
  }

  /**
   * Fetch the most recent price entry BEFORE a given timestamp.
   *
   * @param tokenId      native token id of the network
   * @param timestamp    reference timestamp (seconds)
   * @param maxAgeSeconds max allowed age (default: 9000). -1 to disable.
   */
  getLatestTokenPrice = async (
    tokenId: string,
    timestamp: number,
    maxAgeSeconds: number = this.DEFAULT_MAX_AGE,
  ): Promise<number | undefined> => {
    if (maxAgeSeconds < -1) {
      throw new Error(
        `Invalid maxAgeSeconds=${maxAgeSeconds}. Must be >= 0 or -1 to disable validation.`,
      );
    }

    this.logger.debug(
      `Fetching latest token price for tokenId=${tokenId}, timestamp=${timestamp}, maxAge=${maxAgeSeconds}`,
    );

    const record = await this.repository.findOne({
      where: {
        tokenId,
        timestamp: LessThan(timestamp),
      },
      order: { timestamp: 'DESC' },
    });

    if (!record) {
      this.logger.debug(`No price found before timestamp ${timestamp}`);
      return undefined;
    }

    const age = timestamp - record.timestamp;

    if (maxAgeSeconds != -1 && age > maxAgeSeconds) {
      this.logger.debug(
        `Price found but too old. Age=${age}, maxAge=${maxAgeSeconds}. Returning undefined.`,
      );
      return undefined;
    }

    return record.price;
  };
}
