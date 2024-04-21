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

  logger.debug(`Fetching network heights`);
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

  // calculating rsn ratio
  const rsnRatioRaw =
    (tokenPrice * 10 ** rsnDecimal) / (rsnPrice * 10 ** tokenDecimal);
  logger.debug(`rsnRatioRaw: ${rsnRatioRaw}`);
  let rsnRatioDivisorPower;
  const fixedRatio = rsnRatioRaw.toFixed();
  if (fixedRatio.length >= minimumFeeConfigs.rsnRatioPrecision)
    rsnRatioDivisorPower = fixedRatio.length;
  else if (Number(fixedRatio) > 0)
    rsnRatioDivisorPower = minimumFeeConfigs.rsnRatioPrecision;
  else {
    const parts = rsnRatioRaw.toString().split('.');
    if (parts.length === 1)
      throw Error(`ImpossibleBehavior: rsn ratio is zero!`);
    let i = 0;
    while (parts[1][i] === '0') i++;
    rsnRatioDivisorPower = minimumFeeConfigs.rsnRatioPrecision + i;
  }
  const rsnRatioDivisor = BigInt(10 ** rsnRatioDivisorPower);

  const parts = rsnRatioRaw.toString().split('.');
  const parts1 = (
    (parts.length === 1 ? '' : parts[1]) + '0'.repeat(rsnRatioDivisorPower)
  ).substring(0, rsnRatioDivisorPower);
  const rsnRatio = BigInt(parts[0] + parts1);

  // calculating fee ratio
  const feeRatio = BigInt(configs.feeRatioFloat * feeRatioDivisor);

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
