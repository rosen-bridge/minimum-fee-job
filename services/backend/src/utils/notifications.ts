import { chunk } from 'lodash-es';

import { DefaultLogger } from '@rosen-bridge/abstract-logger';

import { Notification } from '../network/notification';
import { DiscordPayloadType } from '../types';

const logger = DefaultLogger.getInstance().child(import.meta.url);

/**
 * Sends detailed notifications to Discord when price fetching for tokens fails.
 *
 * @param prices - A map of successfully fetched token prices (`token` → `price`)
 * @param priceErrors - A map of tokens that failed price fetching (`token` → `errorMessage`)
 * @returns Promise<void>
 */
export const sendPriceFetchFailureNotification = async (
  prices: Map<string, number>,
  priceErrors: Map<string, string>,
): Promise<void> => {
  logger.error(
    'Some token prices could not be fetched. Configuration update skipped',
  );

  const discordNotification = Notification.getInstance();

  const errorEntries = Array.from(priceErrors.entries());
  const failedTokens = Array.from(priceErrors.keys());

  const summaryMessage =
    `# :warning: MinimumFee Job - Price Fetching Failed\n` +
    `Not all token prices were fetched successfully. Config update skipped.\n\n` +
    `**Summary:**\n` +
    `- Total errors: ${priceErrors.size}\n` +
    `- Successful prices: ${prices.size}`;

  await discordNotification.send(DiscordPayloadType.MESSAGE, summaryMessage);

  if (failedTokens.length > 0) {
    const tokenChunks = chunk(failedTokens, 20);

    for (let i = 0; i < tokenChunks.length; i++) {
      const tokenMessage =
        `**Failed Tokens (Part ${i + 1}/${tokenChunks.length}):**\n` +
        tokenChunks[i].map((token) => `- ${token}`).join('\n');
      await discordNotification.send(DiscordPayloadType.MESSAGE, tokenMessage);
    }
  }

  if (priceErrors.size > 0) {
    const errorChunks = chunk(errorEntries, 15);
    for (let i = 0; i < errorChunks.length; i++) {
      const errorDetails =
        `# Price Fetching Errors (Part ${i + 1}/${errorChunks.length})\n\n` +
        errorChunks[i]
          .map(([token, error]) => `- **${token}**: ${error}`)
          .join('\n');
      await discordNotification.send(DiscordPayloadType.FILE, errorDetails, {
        filename: `price_errors_part_${i + 1}.md`,
      });
    }
  }
};
