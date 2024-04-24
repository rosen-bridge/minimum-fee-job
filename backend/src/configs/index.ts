import config from 'config';
import { ConfigInterface, SupportedTokenConfig } from '../types';
import { TransportOptions } from '@rosen-bridge/winston-logger';

export const logConfigs = () => {
  const logs = config.get<TransportOptions[]>('logs');
  const wrongLogTypeIndex = logs.findIndex((log) => {
    const logTypeValidation = ['console', 'file', 'loki'].includes(log.type);
    let loggerChecks = true;
    if (log.type === 'loki') {
      loggerChecks =
        log.host != undefined &&
        typeof log.host === 'string' &&
        log.level != undefined &&
        typeof log.level === 'string' &&
        (log.serviceName ? typeof log.serviceName === 'string' : true) &&
        (log.basicAuth ? typeof log.basicAuth === 'string' : true);
    } else if (log.type === 'file') {
      loggerChecks =
        log.path != undefined &&
        typeof log.path === 'string' &&
        log.level != undefined &&
        typeof log.level === 'string' &&
        log.maxSize != undefined &&
        typeof log.maxSize === 'string' &&
        log.maxFiles != undefined &&
        typeof log.maxFiles === 'string';
    }
    return !(loggerChecks && logTypeValidation);
  });
  if (wrongLogTypeIndex >= 0) {
    throw new Error(
      `unexpected config at path logs[${wrongLogTypeIndex}]: ${JSON.stringify(
        logs[wrongLogTypeIndex]
      )}`
    );
  }
  return logs;
};

export const bridgeFeeTriggerPercent = config.get<number>(
  'triggerPercent.bridgeFee'
);
export const cardanoNetworkFeeTriggerPercent = config.get<number>(
  'triggerPercent.cardanoNetworkFee'
);
export const ergoNetworkFeeTriggerPercent = config.get<number>(
  'triggerPercent.ergoNetworkFee'
);
export const rsnRatioTriggerPercent = config.get<number>(
  'triggerPercent.rsnRatio'
);

export const ERG = 'erg';
export const ADA = 'ada';

export const explorerBaseUrl = 'https://api.ergoplatform.com';
export const koiosBaseUrl = 'https://api.koios.rest/api/v1';

export const spectrumPoolTimeLength = 7 * 24 * 60 * 60 * 1000; // 7 days,
export const feeGuaranteeDuration = new Map<string, number>([
  ['ergo', 24 * 30], // 1 day (30 blocks per hour)
  ['cardano', 24 * 60 * 3], // 1 day (3 blocks per minute)
]);
export const RunningInterval = config.get<number>('interval') * 1000; // seconds to miliseconds

export const minimumFeeConfigs: ConfigInterface = {
  minimumFeeNFT: config.get<string>('minimumFee.NFT'),
  minimumFeeAddress: config.get<string>('minimumFee.minimumFeeAddress'),
  feeAddress: config.get<string>('minimumFee.feeAddress'),
  minBoxErg: 200000n,
  txFee: 1100000n,
  supportedTokens: config.get<Array<SupportedTokenConfig>>(
    'minimumFee.supportedTokens'
  ),
  fetchBoxRetry: config.get<number>('minimumFee.fetchBoxRetry') ?? 3,
  rsnRatioPrecision: config.get<number>('minimumFee.rsnRatioPrecision') ?? 6,
};

export const discordWebHookUrl = config.has('discordWebHookUrl')
  ? config.get<string>('discordWebHookUrl')
  : undefined;

export const redisUrl = config.has('redisUrl')
  ? config.get<string>('redisUrl')
  : undefined;
