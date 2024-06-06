import './bootstrap';
import { RunningInterval, minimumFeeConfigs } from './configs';
import { updateConfigsTransaction } from './minimum-fee/transaction';
import { feeConfigToRegisterValues } from './utils/utils';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { Notification } from './network/Notification';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { replicateV1 } from './minimum-fee/replicate';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const main = async () => {
  logger.info(`Starting Job`);

  // updated config
  logger.info(`Replicating V1 config into V0`);
  const updatedConfig = await replicateV1();

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
    discordNotification.sendMessage(
      `# MinimumFee V0 configs need to be updated`
    );
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
