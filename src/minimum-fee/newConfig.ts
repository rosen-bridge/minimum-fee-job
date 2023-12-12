import { minimumFeeConfigs } from '../configs';
import { fetchPriceFromCoingeckoInUSD } from '../network/fetchPriceFromCoingecko';
import { Fee, FeeConfig, SupportedTokenConfig } from '../types';
import { getCardanoHeight, getErgoHeight } from '../network/clients';
import { getPrice } from '../utils/getPrice';
import { feeRatioDivisor } from '../types/consts';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

export const generateNewFeeConfig = async () => {
  const newFeeConfigs: Map<string, FeeConfig> = new Map();
  const ergPrice = await fetchPriceFromCoingeckoInUSD('ergo');
  const adaPrice = await fetchPriceFromCoingeckoInUSD('cardano');

  const rsnTokenConfig = minimumFeeConfigs.supportedTokens.find(
    (token) => token.name === 'RSN'
  );
  if (!rsnTokenConfig) throw Error(`Token [RSN] is not found in config`);
  const rsnPrice = await getPrice(rsnTokenConfig, ergPrice);

  const ergoHeight = await getErgoHeight();
  const cardanoHeight = await getCardanoHeight();

  const prices = new Map<string, number>();
  for (const token of minimumFeeConfigs.supportedTokens) {
    logger.debug(`Generating new config for token [${token.name}]`);
    const price = await getPrice(token, ergPrice);
    prices.set(token.tokenId, price);
    logger.debug(`Price of [${token.name}]: ${price}$`);

    const feeConfig = feeConfigFromPrice(
      ergPrice,
      adaPrice,
      rsnPrice,
      rsnTokenConfig.decimals,
      price,
      token.decimals,
      token.fee,
      ergoHeight,
      cardanoHeight
    );
    newFeeConfigs.set(token.tokenId, feeConfig);
  }
  return {
    configs: newFeeConfigs,
    prices: prices,
  };
};

export const feeConfigFromPrice = (
  ergPrice: number,
  adaPrice: number,
  rsnPrice: number,
  rsnDecimal: number,
  tokenPrice: number,
  tokenDecimal: number,
  configs: SupportedTokenConfig['fee'],
  currentErgoHeight: number,
  currentCardanoHeight: number
): FeeConfig => {
  // calculating bridge fee
  const bridgeFee = BigInt(
    Math.ceil((configs.bridgeFeeUSD / tokenPrice) * 10 ** tokenDecimal)
  );

  // calculating network fee on Ergo
  const ergoNetworkFee = BigInt(
    Math.ceil(
      (configs.ergNetworkFee * ergPrice * 10 ** tokenDecimal) / tokenPrice
    )
  );

  // calculating network fee on Cardano
  const cardanoNetworkFee = BigInt(
    Math.ceil(
      (configs.adaNetworkFee * adaPrice * 10 ** tokenDecimal) / tokenPrice
    )
  );

  // calculating rsn ratio
  const rsnRatioStr = (
    (tokenPrice * 10 ** rsnDecimal) /
    (rsnPrice * 10 ** tokenDecimal)
  ).toString();
  const parts = rsnRatioStr.split('.');
  const parts1 = (
    (parts.length === 1 ? '' : parts[1]) + '000000000000'
  ).substring(0, 12);
  const rsnRatio = BigInt(parts[0] + parts1);

  // calculating fee ratio
  const feeRatio = BigInt(configs.feeRatioFloat * feeRatioDivisor);

  const ergoFee: Fee = {
    bridgeFee: bridgeFee,
    networkFee: cardanoNetworkFee,
    rsnRatio: rsnRatio,
    feeRatio: feeRatio,
  };
  const cardanoFee: Fee = {
    bridgeFee: bridgeFee,
    networkFee: ergoNetworkFee,
    rsnRatio: rsnRatio,
    feeRatio: feeRatio,
  };

  return {
    ergo: {
      [configs.ergoHeightDelay + currentErgoHeight]: ergoFee,
    },
    cardano: {
      [configs.cardanoHeightDelay + currentCardanoHeight]: cardanoFee,
    },
  };
};
