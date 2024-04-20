import { ADA, ERG, minimumFeeConfigs } from '../configs';
import { SupportedTokenConfig } from '../types';
import { getCardanoHeight, getErgoHeight } from '../network/clients';
import { feeRatioDivisor } from '../types/consts';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { ChainFee, MinimumFeeConfig } from '@rosen-bridge/minimum-fee';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

export const generateNewFeeConfig = async (prices: Map<string, number>) => {
  const newFeeConfigs: Map<string, MinimumFeeConfig> = new Map();
  const ergPrice = prices.get(ERG);
  const adaPrice = prices.get(ADA);

  const rsnTokenConfig = minimumFeeConfigs.supportedTokens.find(
    (token) => token.name === 'RSN'
  );
  if (!rsnTokenConfig) throw Error(`Token [RSN] is not found in config`);
  const rsnPrice = prices.get(rsnTokenConfig.tokenId);

  if (ergPrice == undefined || adaPrice == undefined || rsnPrice == undefined)
    throw Error(`Unexpected state: some required prices are missing`);

  const ergoHeight = await getErgoHeight();
  const cardanoHeight = await getCardanoHeight();

  for (const token of minimumFeeConfigs.supportedTokens) {
    logger.debug(`Generating new config for token [${token.name}]`);
    const price = prices.get(token.tokenId);
    if (price == undefined)
      throw Error(`Unexpected state: token price is missing`);

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
  return newFeeConfigs;
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
): MinimumFeeConfig => {
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

  // TODO: improve rsn ratio and its divisor calculation???
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

  const rsnRatioDivisor = 1000000000000n;
  const ergoFee: ChainFee = {
    bridgeFee: bridgeFee,
    networkFee: cardanoNetworkFee,
    rsnRatio: rsnRatio,
    feeRatio: feeRatio,
    rsnRatioDivisor,
  };
  const cardanoFee: ChainFee = {
    bridgeFee: bridgeFee,
    networkFee: ergoNetworkFee,
    rsnRatio: rsnRatio,
    feeRatio: feeRatio,
    rsnRatioDivisor,
  };

  const newFeeConfig = new MinimumFeeConfig();
  newFeeConfig.setChainConfig('ergo', currentErgoHeight, ergoFee);
  newFeeConfig.setChainConfig('cardano', currentCardanoHeight, cardanoFee);

  return newFeeConfig;
};
