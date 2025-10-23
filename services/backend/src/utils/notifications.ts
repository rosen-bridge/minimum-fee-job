import { Notification } from '../network/Notification';
import { DiscordPayloadType } from '../types';
import { chunk } from 'lodash-es';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const sendPriceFetchFailureNotification = async (
  prices: Map<string, number>,
  priceErrors: Map<string, string>,
): Promise<void> => {
  logger.error(
    'Not all token prices were fetched successfully. Skipping config update.',
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
