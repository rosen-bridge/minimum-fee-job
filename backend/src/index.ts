import './bootstrap';
import { RunningInterval, minimumFeeConfigs, redisUrl } from './configs';
import { generateNewFeeConfig } from './minimum-fee/newConfig';
import { updateConfigsTransaction } from './minimum-fee/transaction';
import { updateAndGenerateFeeConfig } from './minimum-fee/updateConfig';
import { feeConfigToRegisterValues, pricesToString } from './utils/utils';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { Notification } from './network/Notification';
import WinstonLogger from '@rosen-bridge/winston-logger';

import { flushStore, saveTokensConfig, savePrices, saveTx } from './store';
import { getConfigTokenPrices } from './minimum-fee/prices';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const main = async () => {
  logger.info(`Starting Job`);
  if (minimumFeeConfigs.feeAddress === minimumFeeConfigs.minimumFeeAddress)
    throw Error(`Fee address and Minimum-fee config address cannot be equal`);

  // fetch current prices
  const prices = await getConfigTokenPrices();

  // new config
  logger.info(`Generating new config`);
  const newFeeConfigs = await generateNewFeeConfig(prices);

  newFeeConfigs.forEach((feeConfig, tokenId) => {
    logger.debug(
      `fee config for token [${tokenId}]: ${JsonBigInt.stringify(feeConfig)}`
    );
    logger.debug(
      `Register values: ${JsonBigInt.stringify(
        feeConfigToRegisterValues([feeConfig.getConfig()])
      )}`
    );
  });

  // updated config
  logger.info(`Combining new config with current config`);
  const updateResult = await updateAndGenerateFeeConfig(newFeeConfigs);
  const updatedConfigs = updateResult.config;
  const bridgeFeeDifferences = updateResult.bridgeFeeDifferences;

  updatedConfigs.forEach((updatedConfig, tokenId) => {
    const feeConfig = updatedConfig.new.getConfigs();
    logger.debug(
      `Updated fee config for token [${tokenId}]: ${JsonBigInt.stringify(
        feeConfig
      )}`
    );
    logger.debug(
      `Register values: ${JsonBigInt.stringify(
        feeConfigToRegisterValues(feeConfig)
      )}`
    );
  });

  if (updatedConfigs.size === 0) {
    logger.info(`No config need update`);

    if (redisUrl) {
      await flushStore();
      logger.info('Flushed store');
    }
  } else {
    // transaction
    logger.info(
      `updating config for tokens [${Array.from(updatedConfigs.keys())}]`
    );
    const tx = JsonBigInt.stringify(
      await updateConfigsTransaction(updatedConfigs)
    );
    logger.info(`Transaction to update minimum-fee config box generated`);

    // send notification to discord
    const discordNotification = Notification.getInstance();
    discordNotification.sendMessage(`# MinimumFee configs need to be updated`);
    discordNotification.sendMessage(
      `## Prices\n` +
        `\`\`\`json\n${pricesToString(prices, bridgeFeeDifferences)}\n\`\`\``
    );
    const tokenIds = Array.from(updatedConfigs.keys());

    if (redisUrl) {
      // send info to redis
      discordNotification.sendMessage(
        `## Changed Tokens\n` +
          tokenIds
            .map((tokenId) => {
              const token = minimumFeeConfigs.supportedTokens.find(
                (token) => token.tokenId === tokenId
              )!;
              return `- ${token.name} [\`${token.ergoSideTokenId}\`]`;
            })
            .join('\n')
      );
      await Promise.all([
        saveTokensConfig(minimumFeeConfigs.supportedTokens),
        savePrices(prices),
        saveTx(tx),
      ]);
      logger.info('Saved data in the store');
    } else {
      // send info to discord
      for (const tokenId of tokenIds) {
        const token = minimumFeeConfigs.supportedTokens.find(
          (token) => token.tokenId === tokenId
        )!;
        discordNotification.sendMessage(`## Token ${token.name} [${token.tokenId}]
          ergo side tokenId: \`${token.ergoSideTokenId}\`
        `);
        const tokenFeeConfig = updatedConfigs.get(tokenId)!.new.getConfigs();
        discordNotification.sendMessage(
          `\`\`\`json\n${JsonBigInt.stringify(tokenFeeConfig)}\n\`\`\``
        );
      }

      // send tx
      const n = Math.ceil(tx.length / 1500);
      const chunks = Array.from(tx.match(/.{1,1500}/g)!);
      discordNotification.sendMessage(`generated tx. chunks: ${n}`);
      for (let i = 0; i < n; i++) {
        const txChunk = JsonBigInt.stringify({
          CSR: chunks[i],
          n: n,
          p: i + 1,
        });
        logger.info(`chunk [${i}]: ${txChunk}`);

        discordNotification.sendMessage(`\`\`\`json\n${txChunk}\n\`\`\``);
        logger.info('Sent data to discord');
      }
    }
  }

  logger.info(`Job done`);
};

const interval = () => {
  main()
    .then(() => {
      setTimeout(interval, RunningInterval);
    })
    .catch((e) => {
      logger.warn(`An error ocurred: ${e}`);
      if (e instanceof Error) logger.debug(e.stack);
      // send alert to discord
      const discordNotification = Notification.getInstance();
      discordNotification.sendMessage(
        `# :warning: An error occurred at minimum-fee-job\n` +
          `\`\`\`json\n${e}\n\`\`\``
      );
      setTimeout(interval, RunningInterval);
    });
};

interval();
