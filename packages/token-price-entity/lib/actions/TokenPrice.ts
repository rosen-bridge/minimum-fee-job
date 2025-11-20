import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import {
  DataSource,
  LessThan,
  Between,
  Repository,
} from '@rosen-bridge/extended-typeorm';

import { TokenPriceEntity } from '../entities';

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
   * If maxAgeSeconds != -1 → timestamp must be in
   * [timestamp - maxAgeSeconds, timestamp] (inclusive).
   *
   * If maxAgeSeconds = -1 → only timestamp < input timestamp is applied.
   *
   * @param tokenId      native token id of the network
   * @param timestamp    reference timestamp (seconds)
   * @param maxAgeSeconds max allowed age (default: -1). Use -1 to disable.
   */
  getLatestTokenPrice = async (
    tokenId: string,
    timestamp: number,
    maxAgeSeconds: number = -1,
  ): Promise<number | undefined> => {
    if (maxAgeSeconds < -1) {
      throw new Error(
        `Invalid maxAgeSeconds [${maxAgeSeconds}]. Must be >= 0 or -1 to disable validation.`,
      );
    }

    this.logger.debug(
      `Fetching latest token price for tokenId [${tokenId}] with timestamp [${timestamp}] and maxAge [${maxAgeSeconds}]`,
    );

    const whereFilter = {
      tokenId,
      timestamp:
        maxAgeSeconds !== -1
          ? Between(timestamp - maxAgeSeconds, timestamp)
          : LessThan(timestamp),
    };

    const record = await this.repository.findOne({
      where: whereFilter,
      order: { timestamp: 'DESC' },
    });

    if (!record) {
      this.logger.debug(
        `No price found for tokenId [${tokenId}] before timestamp [${timestamp}] within maxAge.`,
      );
      return undefined;
    }

    return record.price;
  };
}
