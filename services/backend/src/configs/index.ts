import config from 'config';

import { TransportOptions } from '@rosen-bridge/winston-logger';

import {
  ConfigInterface,
  FeeParameters,
  SupportedTokenRawConfig,
} from '../types';

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
        logs[wrongLogTypeIndex],
      )}`,
    );
  }
  return logs;
};

export const bridgeFeeTriggerPercent = config.get<number>(
  'triggerPercent.bridgeFee',
);
export const networkFeeTriggerPercent = config.get<Record<string, number>>(
  'triggerPercent.networkFee',
);
export const rsnRatioTriggerPercent = config.get<number>(
  'triggerPercent.rsnRatio',
);

export const ERG = 'erg';
export const ADA = 'ada';
export const BTC = 'btc';
export const ETH = 'eth';
export const BNB = 'bnb';
export const DOGE = 'doge';

export const urls = {
  coinMarketCap: config.get<string>('urls.coinMarketCap'),
  coingecko: config.get<string>('urls.coingecko'),
  spectrum: config.get<string>('urls.spectrum'),
  dexHunter: config.get<string>('urls.dexHunter'),
  ergoExplorer: config.get<string>('urls.ergoExplorer'),
  cardanoKoios: config.get<string>('urls.cardanoKoios'),
  bitcoinEsplora: config.get<string>('urls.bitcoinEsplora'),
  dogeBlockcypher: config.get<string>('urls.dogeBlockcypher'),
  ethereumRpc: config.get<string>('urls.ethereumRpc'),
  binanceRpc: config.get<string>('urls.binanceRpc'),
  minswap: config.get<string>('urls.minswap'),
};

export const auth = {
  koios: config.get<string | undefined>('auth.koios'),
};

export const spectrumPoolTimeLength = 7 * 24 * 60 * 60 * 1000; // 7 days,
export const feeGuaranteeDuration = new Map<string, number>([
  ['ergo', 24 * 30], // 1 day (30 blocks per hour)
  ['cardano', 24 * 60 * 3], // 1 day (3 blocks per minute)
  ['bitcoin', 24 * 6], // 1 day (6 blocks per hour)
  ['ethereum', 24 * 60 * 5], // 1 day (5 blocks per minute)
  ['binance', 24 * 60 * 20], // 1 day (20 blocks per minute)
  ['doge', 24 * 60], // 1 day (60 blocks per hour)
  ['bitcoin-runes', 24 * 6], // 1 day (6 blocks per hour)
]);
export const RunningInterval = config.get<number>('interval') * 1000; // seconds to milliseconds

const defaultFeeParameters = config.get<FeeParameters>('minimumFee.defaultFee');
export const minimumFeeConfigs: ConfigInterface = {
  RSNTokenId: config.get<string>('minimumFee.RSN'),
  minimumFeeNFT: config.get<string>('minimumFee.NFT'),
  minimumFeeAddress: config.get<string>('minimumFee.minimumFeeAddress'),
  feeAddress: config.get<string>('minimumFee.feeAddress'),
  minBoxErg: BigInt(config.get<string>('minimumFee.minBoxErg')),
  txFee: 1100000n,
  supportedTokens: config
    .get<Array<SupportedTokenRawConfig>>('minimumFee.supportedTokens')
    .map((supportedToken) => ({
      ...supportedToken,
      fee: supportedToken.fee ? supportedToken.fee : defaultFeeParameters,
    })),
  fetchBoxRetry: config.get<number>('minimumFee.fetchBoxRetry') ?? 3,
  rsnRatioPrecision: config.get<number>('minimumFee.rsnRatioPrecision') ?? 6,
  bitcoinTxVSize: config.get<number>('minimumFee.bitcoinTxVSize') ?? 150,
  bitcoinMinUtxo: config.get<number>('minimumFee.bitcoinMinUtxo') ?? 0.00000546,
  dogeTxSize: config.get<number>('minimumFee.dogeTxSize') ?? 226,
  bitcoinRunesTxVSize:
    config.get<number>('minimumFee.bitcoinRunesTxVSize') ?? 383,
  dogeMinUtxo: config.get<number>('minimumFee.dogeMinUtxo') ?? 0.01,
  ethereumAvgGasPricePeriod:
    config.get<number>('minimumFee.ethereumAvgGasPricePeriod') ?? 7200,
  ethereumNetworkFeeMultiplier:
    config.get<number>('minimumFee.ethereumNetworkFeeMultiplier') ?? 1.5,
  binanceTxFee: config.get<number>('minimumFee.binanceTxFee') ?? 0.0001,
};

export const discordWebHookUrl = config.has('discordWebHookUrl')
  ? config.get<string>('discordWebHookUrl')
  : undefined;

export const kvRestApiUrl = config.has('kv.restApiUrl')
  ? config.get<string>('kv.restApiUrl')
  : undefined;

export const kvRestApiToken = config.has('kv.restApiToken')
  ? config.get<string>('kv.restApiToken')
  : undefined;

export const tokensPath = config.get<string>('tokensPath');
