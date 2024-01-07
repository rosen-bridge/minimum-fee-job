import './bootstrap';
import { RunningInterval, minimumFeeConfigs } from './configs';
import { generateNewFeeConfig } from './minimum-fee/newConfig';
import { updateConfigsTransaction } from './minimum-fee/transaction';
import { updateAndGenerateFeeConfig } from './minimum-fee/updateConfig';
import { feeConfigToRegisterValues, pricesToString } from './utils/utils';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { Notification } from './network/Notification';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const main = async () => {
  logger.info(`Starting Job`);
  if (minimumFeeConfigs.feeAddress === minimumFeeConfigs.minimumFeeAddress)
    throw Error(`Fee address and Minimum-fee config address cannot be equal`);

  // new config
  logger.info(`Generating new config`);
  const newFeeConfigs = await generateNewFeeConfig();
  const newConfig = newFeeConfigs.configs;
  const prices = newFeeConfigs.prices;

  newConfig.forEach((feeConfig, tokenId) => {
    logger.debug(
      `fee config for token [${tokenId}]: ${JsonBigInt.stringify(feeConfig)}`
    );
    logger.debug(
      `Register values: ${JsonBigInt.stringify(
        feeConfigToRegisterValues(feeConfig)
      )}`
    );
  });

  // updated config
  logger.info(`Combining new config with current config`);
  const updatedConfig = await updateAndGenerateFeeConfig(newConfig);

  updatedConfig.forEach((feeConfig, tokenId) => {
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

  if (updatedConfig.size === 0) logger.info(`No config need update`);
  else {
    // transaction
    logger.info(
      `updating config for tokens [${Array.from(updatedConfig.keys())}]`
    );
    const tx = JsonBigInt.stringify(
      await updateConfigsTransaction(updatedConfig)
    );
    logger.info(`Transaction to update minimum-fee config box generated`);

    // send notification to discord
    const discordNotification = Notification.getInstance();
    discordNotification.sendMessage(`# MinimumFee configs need to be updated`);
    discordNotification.sendMessage(`## Current Prices
      \`\`\`json\n${pricesToString(prices)}\n\`\`\`
    `);
    const tokenIds = Array.from(updatedConfig.keys());

    // send configs
    for (const tokenId of tokenIds) {
      const token = minimumFeeConfigs.supportedTokens.find(
        (token) => token.tokenId === tokenId
      )!;
      discordNotification.sendMessage(`## Token ${token.name} [${token.tokenId}]
        ergo side tokenId: \`${token.ergoSideTokenId}\`
      `);
      const tokenFeeConfig = JsonBigInt.stringify(updatedConfig.get(tokenId));
      discordNotification.sendMessage(`\`\`\`json\n${tokenFeeConfig}\n\`\`\``);
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
