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
      `unexpected config at path logs[${wrongLogTypeIndex}]: ${JSON.stringify(logs[wrongLogTypeIndex])}`
    );
  }
  return logs;
}

export const feeConfig = {
  ergoHeightDelay: config.get<number>('fee.ergoHeightDelay'),
  cardanoHeightDelay: config.get<number>('fee.cardanoHeightDelay'),
  bridgeFeeUSD: config.get<number>('fee.bridgeFeeUSD'),
  ergNetworkFee: config.get<number>('fee.ergNetworkFee'),
  adaNetworkFee: config.get<number>('fee.adaNetworkFee'),
  feeRatioFloat: config.get<number>('fee.feeRatioFloat')
}

export const bridgeFeeTriggerPercent = config.get<number>('triggerPercent.bridgeFee')
export const cardanoNetworkFeeTriggerPercent = config.get<number>('triggerPercent.cardanoNetworkFee')
export const ergoNetworkFeeTriggerPercent = config.get<number>('triggerPercent.ergoNetworkFee')

export const ERG = 'erg'
export const ADA = 'ada'

export const supportedTokens: Array<SupportedTokenConfig> = [
  {
    tokenId: ERG,
    ergoSideTokenId: 'erg',
    name: 'ERG',
    decimals: 9,
    priceBackend: 'coingecko',
    priceBackendParams: {
      network: 'ergo'
    },
    fee: feeConfig
  },
  {
    tokenId: ADA,
    ergoSideTokenId: 'e023c5f382b6e96fbd878f6811aac73345489032157ad5affb84aefd4956c297',
    name: 'ADA',
    decimals: 6,
    priceBackend: 'coingecko',
    priceBackendParams: {
      network: 'cardano'
    },
    fee: feeConfig
  },
  {
    tokenId: '8b08cdd5449a9592a9e79711d7d79249d7a03c535d17efaee83e216e80a44c4b',
    ergoSideTokenId: '8b08cdd5449a9592a9e79711d7d79249d7a03c535d17efaee83e216e80a44c4b',
    name: 'RSN',
    decimals: 3,
    priceBackend: 'spectrum',
    priceBackendParams: {},
    fee: feeConfig
  },
  {
    tokenId: '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
    ergoSideTokenId: '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
    name: 'SigUSD',
    decimals: 2,
    priceBackend: 'spectrum',
    priceBackendParams: {},
    fee: feeConfig
  },
  {
    tokenId: '003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0',
    ergoSideTokenId: '003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0',
    name: 'SigRSV',
    decimals: 0,
    priceBackend: 'spectrum',
    priceBackendParams: {},
    fee: feeConfig
  }
]

export const explorerBaseUrl = 'https://api.ergoplatform.com';
export const koiosBaseUrl = 'https://api.koios.rest/api/v1';

export const spectrumPoolTimeLength = 7 * 24 * 60 * 60 * 1000; // 7 days,
export const feeGuaranteeDurationOnErgo = 24 * 30; // 1 day,
export const feeGuaranteeDurationOnCardano = 24 * 60 * 3; // 1 day,

export const minimumFeeConfigs: ConfigInterface = {
  minimumFeeNFT: config.get<string>('minimumFee.NFT'),
  minimumFeeAddress: config.get<string>('minimumFee.minimumFeeAddress'),
  feeAddress: config.get<string>('minimumFee.feeAddress'),
  minBoxErg: 200000n,
  txFee: 1100000n,
  supportedTokens: config.get<Array<string>>('minimumFee.supportedTokens'),
}

export const discordWebHookUrl = config.has('discordWebHookUrl')
  ? config.get<string>('discordWebHookUrl')
  : undefined
