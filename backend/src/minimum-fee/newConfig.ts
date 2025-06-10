import {
  ADA,
  BNB,
  BTC,
  DOGE,
  ERG,
  ETH,
  minimumFeeConfigs,
  tokens,
} from '../configs';
import { Chains, SupportedTokenConfig } from '../types';
import { getBitcoinFeeRatio, getDogeFeeRatio } from '../network/clients';
import { feeRatioDivisor } from '../utils/consts';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { ChainFee, MinimumFeeConfig } from '@rosen-bridge/minimum-fee';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const generateNewFeeConfig = async (
  prices: Map<string, number>,
  chainHeights: Map<Chains, number>
) => {
  const newFeeConfigs: Map<string, MinimumFeeConfig> = new Map();

  const rsnTokenConfig = minimumFeeConfigs.supportedTokens.find(
    (token) => token.name === 'RSN'
  );
  if (!rsnTokenConfig) throw Error(`Token [RSN] is not found in config`);
  const rsnPrice = prices.get(rsnTokenConfig.tokenId);
  if (!rsnPrice) throw Error(`RSN price is required`);

  logger.debug(`Fetching bitcoin fee ratio`);
  const bitcoinFeeRatioMap = await getBitcoinFeeRatio();

  logger.debug(`Fetching doge fee ratio`);
  const dogeFeeRatio = await getDogeFeeRatio();

  for (const token of minimumFeeConfigs.supportedTokens) {
    logger.debug(`Generating new config for token [${token.name}]`);

    const feeConfig = await feeConfigFromPrice(
      token.tokenId,
      prices,
      chainHeights,
      rsnPrice,
      rsnTokenConfig.decimals,
      token.decimals,
      token.fee,
      bitcoinFeeRatioMap,
      dogeFeeRatio
    );
    newFeeConfigs.set(token.tokenId, feeConfig);
  }
  return newFeeConfigs;
};

export const feeConfigFromPrice = async (
  tokenId: string,
  prices: Map<string, number>,
  chainHeights: Map<Chains, number>,
  rsnPrice: number,
  rsnDecimal: number,
  tokenDecimal: number,
  configs: SupportedTokenConfig['fee'],
  bitcoinFeeRatioMap: Record<string, number>,
  dogeFeeRatio: number
): Promise<MinimumFeeConfig> => {
  const getCurrentHeight = (chain: Chains) => {
    const currentHeight = chainHeights.get(chain);
    if (!currentHeight)
      throw Error(
        `Impossible behavior: chain [${chain}] is supported but its height is not fetched`
      );
    return currentHeight;
  };

  const tokenPrice = prices.get(tokenId);
  if (tokenPrice == undefined)
    throw Error(`Unexpected state: token price is missing`);

  // calculating bridge fee
  const bridgeFee = BigInt(
    Math.ceil((configs.bridgeFeeUSD / tokenPrice) * 10 ** tokenDecimal)
  );

  const tokenMapData = tokens();
  const tokenSet = tokenMapData.find((set) => {
    for (const chain of Object.keys(set)) {
      if (set[chain].tokenId === tokenId) return true;
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
  const ergoHeight = getCurrentHeight(Chains.ERGO) + configs.delays.ergo;
  if (chains.includes(Chains.ERGO)) {
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
    newFeeConfig.setChainConfig(Chains.ERGO, ergoHeight, ergoFee);
  } else {
    newFeeConfig.setChainConfig(Chains.ERGO, ergoHeight, undefined);
  }

  //  CARDANO
  const cardanoHeight =
    getCurrentHeight(Chains.CARDANO) + configs.delays.cardano;
  if (chains.includes(Chains.CARDANO)) {
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
    newFeeConfig.setChainConfig(Chains.CARDANO, cardanoHeight, cardanoFee);
  } else {
    newFeeConfig.setChainConfig(Chains.CARDANO, cardanoHeight, undefined);
  }

  //  BITCOIN
  const bitcoinHeight =
    getCurrentHeight(Chains.BITCOIN) + configs.delays.bitcoin;
  if (chains.includes(Chains.BITCOIN)) {
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
    newFeeConfig.setChainConfig(Chains.BITCOIN, bitcoinHeight, bitcoinFee);
  } else {
    newFeeConfig.setChainConfig(Chains.BITCOIN, bitcoinHeight, undefined);
  }

  //  ETHEREUM
  const ethereumHeight =
    getCurrentHeight(Chains.ETHEREUM) + configs.delays.ethereum;
  if (chains.includes(Chains.ETHEREUM)) {
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
    newFeeConfig.setChainConfig(Chains.ETHEREUM, ethereumHeight, ethereumFee);
  } else {
    newFeeConfig.setChainConfig(Chains.ETHEREUM, ethereumHeight, undefined);
  }

  //  BINANCE
  const binanceHeight =
    getCurrentHeight(Chains.BINANCE) + configs.delays.binance;
  if (chains.includes(Chains.BINANCE)) {
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
    newFeeConfig.setChainConfig(Chains.BINANCE, binanceHeight, binanceFee);
  } else {
    newFeeConfig.setChainConfig(Chains.BINANCE, binanceHeight, undefined);
  }

  //  DOGE
  const dogeHeight = getCurrentHeight(Chains.DOGE) + configs.delays.doge;
  if (chains.includes(Chains.DOGE)) {
    const dogeNetworkFee = getDogeNetworkFee(
      prices,
      configs,
      tokenPrice,
      tokenDecimal,
      dogeFeeRatio
    );
    const dogeFee: ChainFee = {
      bridgeFee: bridgeFee,
      networkFee: dogeNetworkFee,
      rsnRatio: rsnRatio,
      feeRatio: feeRatio,
      rsnRatioDivisor,
    };
    newFeeConfig.setChainConfig(Chains.DOGE, dogeHeight, dogeFee);
  } else {
    newFeeConfig.setChainConfig(Chains.DOGE, dogeHeight, undefined);
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

const getDogeNetworkFee = (
  prices: Map<string, number>,
  configs: SupportedTokenConfig['fee'],
  tokenPrice: number,
  tokenDecimal: number,
  dogeFeeRatio: number
) => {
  const dogePrice = prices.get(DOGE);
  if (!dogePrice) throw Error(`Doge price is required`);

  // calculating network fee on Dogecoin
  return BigInt(
    Math.ceil(
      (dogeFeeRatio *
        minimumFeeConfigs.dogeTxVSize *
        dogePrice *
        10 ** tokenDecimal) /
        (tokenPrice * 10 ** 8)
    )
  );
};
