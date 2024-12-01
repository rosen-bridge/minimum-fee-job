import { ADA, BNB, BTC, ERG, ETH, minimumFeeConfigs, tokens } from '../configs';
import { SupportedTokenConfig } from '../types';
import {
  getBitcoinHeight,
  getCardanoHeight,
  getErgoHeight,
  getBitcoinFeeRatio,
  getEthereumHeight,
  getBinanceHeight,
} from '../network/clients';
import {
  BINANCE,
  BITCOIN,
  CARDANO,
  ERGO,
  ETHEREUM,
  feeRatioDivisor,
} from '../types/consts';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { ChainFee, MinimumFeeConfig } from '@rosen-bridge/minimum-fee';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const generateNewFeeConfig = async (prices: Map<string, number>) => {
  const newFeeConfigs: Map<string, MinimumFeeConfig> = new Map();

  const rsnTokenConfig = minimumFeeConfigs.supportedTokens.find(
    (token) => token.name === 'RSN'
  );
  if (!rsnTokenConfig) throw Error(`Token [RSN] is not found in config`);
  const rsnPrice = prices.get(rsnTokenConfig.tokenId);
  if (!rsnPrice) throw Error(`RSN price is required`);

  logger.debug(`Fetching bitcoin fee ratio`);
  const bitcoinFeeRatioMap = await getBitcoinFeeRatio();

  for (const token of minimumFeeConfigs.supportedTokens) {
    logger.debug(`Generating new config for token [${token.name}]`);

    const feeConfig = await feeConfigFromPrice(
      token.tokenId,
      prices,
      rsnPrice,
      rsnTokenConfig.decimals,
      token.decimals,
      token.fee,
      bitcoinFeeRatioMap
    );
    newFeeConfigs.set(token.tokenId, feeConfig);
  }
  return newFeeConfigs;
};

export const feeConfigFromPrice = async (
  tokenId: string,
  prices: Map<string, number>,
  rsnPrice: number,
  rsnDecimal: number,
  tokenDecimal: number,
  configs: SupportedTokenConfig['fee'],
  bitcoinFeeRatioMap: Record<string, number>
): Promise<MinimumFeeConfig> => {
  const tokenPrice = prices.get(tokenId);
  if (tokenPrice == undefined)
    throw Error(`Unexpected state: token price is missing`);

  // calculating bridge fee
  const bridgeFee = BigInt(
    Math.ceil((configs.bridgeFeeUSD / tokenPrice) * 10 ** tokenDecimal)
  );

  const tokenMapData = tokens();
  const tokenSet = tokenMapData.tokens.find((set) => {
    for (const chain of Object.keys(set)) {
      if (set[chain][tokenMapData.idKeys[chain]] === tokenId) return true;
    }
    return false;
  });
  if (!tokenSet)
    throw Error(
      `Unexpected state: token [${tokenId}] is not found in token map`
    );
  const chains = Object.keys(tokenSet);
  logger.debug(`supported chains for token [${tokenId}]: ${chains}`);

  // calculating rsn ratio
  const rsnRatioRaw =
    (tokenPrice * 10 ** rsnDecimal) / (rsnPrice * 10 ** tokenDecimal);
  logger.debug(`rsnRatioRaw: ${rsnRatioRaw}`);

  let rsnRatioString = rsnRatioRaw.toString();
  if (rsnRatioString.includes('e-')) {
    // ratio is in scientific notation
    const notationIndex = rsnRatioString.indexOf('e-') + 2;
    rsnRatioString =
      '0.' +
      '0'.repeat(Number(rsnRatioString.slice(notationIndex)) - 1) +
      rsnRatioString.slice(0, notationIndex - 2).replaceAll('.', '');
  }
  logger.debug(`rsnRatioString: ${rsnRatioString}`);
  const parts = rsnRatioString.split('.');

  let rsnRatioDivisorPower;
  const fixedRatio = rsnRatioRaw.toFixed();
  if (fixedRatio.length >= minimumFeeConfigs.rsnRatioPrecision)
    rsnRatioDivisorPower = 0;
  else if (Number(fixedRatio) > 0)
    rsnRatioDivisorPower =
      minimumFeeConfigs.rsnRatioPrecision - fixedRatio.length;
  else {
    if (parts.length === 1)
      throw Error(`ImpossibleBehavior: rsn ratio is zero!`);
    let i = 0;
    while (parts[1][i] === '0') i++;
    rsnRatioDivisorPower = minimumFeeConfigs.rsnRatioPrecision + i;
  }
  const rsnRatioDivisor = BigInt(10 ** rsnRatioDivisorPower);

  const parts1 = (
    (parts.length === 1 ? '' : parts[1]) + '0'.repeat(rsnRatioDivisorPower)
  ).substring(0, rsnRatioDivisorPower);
  const rsnRatio = BigInt(parts[0] + parts1);

  // calculating fee ratio
  const feeRatio = BigInt(configs.feeRatioFloat * feeRatioDivisor);

  // calculate chain-specific configs
  const newFeeConfig = new MinimumFeeConfig();

  //  ERGO
  const ergoHeight = (await getErgoHeight()) + configs.delays.ergo;
  if (chains.includes(ERGO)) {
    const ergoNetworkFee = getErgoNetworkFee(
      prices,
      configs,
      tokenPrice,
      tokenDecimal
    );
    const ergoFee: ChainFee = {
      bridgeFee: bridgeFee,
      networkFee: ergoNetworkFee,
      rsnRatio: rsnRatio,
      feeRatio: feeRatio,
      rsnRatioDivisor,
    };
    newFeeConfig.setChainConfig(ERGO, ergoHeight, ergoFee);
  } else {
    newFeeConfig.setChainConfig(ERGO, ergoHeight, undefined);
  }

  //  CARDANO
  const cardanoHeight = (await getCardanoHeight()) + configs.delays.cardano;
  if (chains.includes(CARDANO)) {
    const cardanoNetworkFee = getCardanoNetworkFee(
      prices,
      configs,
      tokenPrice,
      tokenDecimal
    );
    const cardanoFee: ChainFee = {
      bridgeFee: bridgeFee,
      networkFee: cardanoNetworkFee,
      rsnRatio: rsnRatio,
      feeRatio: feeRatio,
      rsnRatioDivisor,
    };
    newFeeConfig.setChainConfig(CARDANO, cardanoHeight, cardanoFee);
  } else {
    newFeeConfig.setChainConfig(CARDANO, cardanoHeight, undefined);
  }

  //  BITCOIN
  const bitcoinHeight = (await getBitcoinHeight()) + configs.delays.bitcoin;
  if (chains.includes(BITCOIN)) {
    const bitcoinNetworkFee = getBitcoinNetworkFee(
      prices,
      configs,
      tokenPrice,
      tokenDecimal,
      bitcoinFeeRatioMap
    );
    const bitcoinFee: ChainFee = {
      bridgeFee: bridgeFee,
      networkFee: bitcoinNetworkFee,
      rsnRatio: rsnRatio,
      feeRatio: feeRatio,
      rsnRatioDivisor,
    };
    newFeeConfig.setChainConfig(BITCOIN, bitcoinHeight, bitcoinFee);
  } else {
    newFeeConfig.setChainConfig(BITCOIN, bitcoinHeight, undefined);
  }

  //  ETHEREUM
  const ethereumHeight = (await getEthereumHeight()) + configs.delays.ethereum;
  if (chains.includes(ETHEREUM)) {
    const ethereumNetworkFee = getEthereumNetworkFee(
      prices,
      configs,
      tokenPrice,
      tokenDecimal
    );
    const ethereumFee: ChainFee = {
      bridgeFee: bridgeFee,
      networkFee: ethereumNetworkFee,
      rsnRatio: rsnRatio,
      feeRatio: feeRatio,
      rsnRatioDivisor,
    };
    newFeeConfig.setChainConfig(ETHEREUM, ethereumHeight, ethereumFee);
  } else {
    newFeeConfig.setChainConfig(ETHEREUM, ethereumHeight, undefined);
  }

  //  BINANCE
  const binanceHeight = (await getBinanceHeight()) + configs.delays.binance;
  if (chains.includes(BINANCE)) {
    const binanceNetworkFee = getBinanceNetworkFee(
      prices,
      configs,
      tokenPrice,
      tokenDecimal
    );
    const binanceFee: ChainFee = {
      bridgeFee: bridgeFee,
      networkFee: binanceNetworkFee,
      rsnRatio: rsnRatio,
      feeRatio: feeRatio,
      rsnRatioDivisor,
    };
    newFeeConfig.setChainConfig(BINANCE, binanceHeight, binanceFee);
  } else {
    newFeeConfig.setChainConfig(BINANCE, binanceHeight, undefined);
  }

  return newFeeConfig;
};

const getErgoNetworkFee = (
  prices: Map<string, number>,
  configs: SupportedTokenConfig['fee'],
  tokenPrice: number,
  tokenDecimal: number
) => {
  const ergPrice = prices.get(ERG);
  if (!ergPrice) throw Error(`Erg price is required`);

  // calculating network fee on Ergo
  return BigInt(
    Math.ceil(
      (configs.ergNetworkFee * ergPrice * 10 ** tokenDecimal) / tokenPrice
    )
  );
};

const getCardanoNetworkFee = (
  prices: Map<string, number>,
  configs: SupportedTokenConfig['fee'],
  tokenPrice: number,
  tokenDecimal: number
) => {
  const adaPrice = prices.get(ADA);
  if (!adaPrice) throw Error(`Ada price is required`);

  // calculating network fee on Cardano
  return BigInt(
    Math.ceil(
      (configs.adaNetworkFee * adaPrice * 10 ** tokenDecimal) / tokenPrice
    )
  );
};

const getBitcoinNetworkFee = (
  prices: Map<string, number>,
  configs: SupportedTokenConfig['fee'],
  tokenPrice: number,
  tokenDecimal: number,
  bitcoinFeeRatioMap: Record<string, number>
) => {
  const btcPrice = prices.get(BTC);
  if (!btcPrice) throw Error(`Btc price is required`);

  // calculating network fee on Bitcoin
  const bitcoinFeeRatio = bitcoinFeeRatioMap[configs.bitcoinConfirmation];
  return BigInt(
    Math.ceil(
      (bitcoinFeeRatio *
        minimumFeeConfigs.bitcoinTxVSize *
        btcPrice *
        10 ** tokenDecimal) /
        (tokenPrice * 10 ** 8)
    )
  );
};

const getEthereumNetworkFee = (
  prices: Map<string, number>,
  configs: SupportedTokenConfig['fee'],
  tokenPrice: number,
  tokenDecimal: number
) => {
  const ethPrice = prices.get(ETH);
  if (!ethPrice) throw Error(`Eth price is required`);

  // calculating network fee on Ethereum
  return BigInt(
    Math.ceil(
      (minimumFeeConfigs.ethereumTxFee * ethPrice * 10 ** tokenDecimal) /
        tokenPrice
    )
  );
};

const getBinanceNetworkFee = (
  prices: Map<string, number>,
  configs: SupportedTokenConfig['fee'],
  tokenPrice: number,
  tokenDecimal: number
) => {
  const bnbPrice = prices.get(BNB);
  if (!bnbPrice) throw Error(`Bnb price is required`);

  // calculating network fee on Binance
  return BigInt(
    Math.ceil(
      (minimumFeeConfigs.binanceTxFee * bnbPrice * 10 ** tokenDecimal) /
        tokenPrice
    )
  );
};
