import { Fee } from '@rosen-bridge/minimum-fee';
import { minimumFeeConfigs } from '../configs';
import { Registers } from '../types';

export const feeConfigToRegisterValues = (feeConfig: Fee[]): Registers => {
  // generate register values
  //  extract chains
  const chains: Array<string> = [];
  feeConfig.forEach((fee) => {
    Object.keys(fee.heights).forEach((feeChain) => {
      if (!chains.includes(feeChain)) chains.push(feeChain);
    });
  });
  chains.sort();
  //  extract configs
  const heights: Array<Array<number>> = [];
  const bridgeFees: Array<Array<string>> = [];
  const networkFees: Array<Array<string>> = [];
  const rsnRatios: Array<Array<Array<string>>> = [];
  const feeRatios: Array<Array<string>> = [];

  feeConfig.forEach((fee) => {
    const heightsConfigs: Array<number> = [];
    const bridgeFeesConfigs: Array<string> = [];
    const networkFeesConfigs: Array<string> = [];
    const rsnRatiosConfigs: Array<Array<string>> = [];
    const feeRatiosConfigs: Array<string> = [];

    chains.forEach((chain) => {
      if (Object.hasOwn(fee.heights, chain))
        heightsConfigs.push(fee.heights[chain]);
      else heightsConfigs.push(-1);

      if (Object.hasOwn(fee.configs, chain)) {
        bridgeFeesConfigs.push(fee.configs[chain].bridgeFee.toString());
        networkFeesConfigs.push(fee.configs[chain].networkFee.toString());
        rsnRatiosConfigs.push([
          fee.configs[chain].rsnRatio.toString(),
          fee.configs[chain].rsnRatioDivisor.toString(),
        ]);
        feeRatiosConfigs.push(fee.configs[chain].feeRatio.toString());
      } else {
        bridgeFeesConfigs.push('-1');
        networkFeesConfigs.push('-1');
        rsnRatiosConfigs.push(['-1', '-1']);
        feeRatiosConfigs.push('-1');
      }
    });

    heights.push(heightsConfigs);
    bridgeFees.push(bridgeFeesConfigs);
    networkFees.push(networkFeesConfigs);
    rsnRatios.push(rsnRatiosConfigs);
    feeRatios.push(feeRatiosConfigs);
  });

  return {
    R4: chains,
    R5: heights,
    R6: bridgeFees,
    R7: networkFees,
    R8: rsnRatios,
    R9: feeRatios,
  };
};

export const getConfigDifferencePercent = (
  currentConfig: Fee,
  newConfig: Fee
) => {
  // bridge fee difference
  const anyChain = Object.keys(currentConfig.configs)[0];
  const currentBridgeFee = currentConfig.configs[anyChain].bridgeFee;
  const newBridgeFee = newConfig.configs[anyChain].bridgeFee;

  const bridgeFeeDifference = differencePercent(currentBridgeFee, newBridgeFee);

  // to-Ergo network fee difference
  const currentErgoNetworkFee = currentConfig.configs['ergo'].networkFee;
  const newErgoNetworkFee = newConfig.configs['ergo'].networkFee;

  const ergoNetworkFeeDifference = differencePercent(
    currentErgoNetworkFee,
    newErgoNetworkFee
  );

  // to-Cardano fee difference
  const currentCardanoNetworkFee = currentConfig.configs['cardano'].networkFee;
  const newCardanoNetworkFee = newConfig.configs['cardano'].networkFee;

  const cardanoNetworkFeeDifference = differencePercent(
    currentCardanoNetworkFee,
    newCardanoNetworkFee
  );
  // rsn ratio difference
  const rsnRatioDivisorQuotient =
    currentConfig.configs[anyChain].rsnRatioDivisor !==
    newConfig.configs[anyChain].rsnRatioDivisor
      ? currentConfig.configs[anyChain].rsnRatioDivisor /
        newConfig.configs[anyChain].rsnRatioDivisor
      : 1n;
  const currentRatio = currentConfig.configs[anyChain].rsnRatio;
  const newRatio =
    newConfig.configs[anyChain].rsnRatio * rsnRatioDivisorQuotient;

  const rsnRatioDifference = differencePercent(currentRatio, newRatio);

  return {
    bridgeFee: bridgeFeeDifference,
    ergoNetworkFee: ergoNetworkFeeDifference,
    cardanoNetworkFee: cardanoNetworkFeeDifference,
    rsnRatio: rsnRatioDifference,
  };
};

export const differencePercent = (a: bigint, b: bigint): bigint => {
  const diff = a < b ? b - a : a - b;
  return (diff * 100n) / a;
};

export const pricesToString = (
  prices: Map<string, number>,
  bridgeFeeDifferences: Map<string, bigint | undefined>
) => {
  const result: Array<string> = [];
  prices.forEach((value, key) => {
    const token = minimumFeeConfigs.supportedTokens.find(
      (token) => token.tokenId === key
    )!;
    const bridgeFeeDifference = bridgeFeeDifferences.get(key)!;
    const differenceText =
      bridgeFeeDifference != undefined
        ? ` (${bridgeFeeDifference}% change)`
        : '';
    result.push(`${token.name} => ${value}$${differenceText}`);
  });
  return result.join('\n');
};
