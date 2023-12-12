import {
  bridgeFeeTriggerPercent,
  cardanoNetworkFeeTriggerPercent,
  ergoNetworkFeeTriggerPercent,
} from '../configs';
import { FeeConfig, Registers } from '../types';

export const concatFeeConfigs = (
  feeConfig1: FeeConfig,
  feeConfig2: FeeConfig
): FeeConfig => {
  const finalFeeConfig = structuredClone(feeConfig1);
  Object.keys(feeConfig2).forEach((chain) => {
    Object.keys(feeConfig2[chain]).forEach((height) => {
      if (Object.hasOwn(finalFeeConfig[chain], height)) return;
      finalFeeConfig[chain][height] = feeConfig2[chain][height];
    });
  });
  return finalFeeConfig;
};

export const feeConfigToRegisterValues = (feeConfig: FeeConfig): Registers => {
  const chains = Object.keys(feeConfig);
  const heights = chains.map((chain) =>
    Object.keys(feeConfig[chain]).map(Number)
  );
  const bridgeFees = chains.map((chain) =>
    Object.keys(feeConfig[chain]).map(
      (height) => feeConfig[chain][height].bridgeFee
    )
  );
  const networkFees = chains.map((chain) =>
    Object.keys(feeConfig[chain]).map(
      (height) => feeConfig[chain][height].networkFee
    )
  );
  const rsnRatios = chains.map((chain) =>
    Object.keys(feeConfig[chain]).map(
      (height) => feeConfig[chain][height].rsnRatio
    )
  );
  const feeRatios = chains.map((chain) =>
    Object.keys(feeConfig[chain]).map(
      (height) => feeConfig[chain][height].feeRatio
    )
  );

  return {
    R4: chains,
    R5: heights,
    R6: bridgeFees,
    R7: networkFees,
    R8: rsnRatios,
    R9: feeRatios,
  };
};

export const shouldUpdateConfig = (
  currentConfig: FeeConfig,
  updatedConfig: FeeConfig
): boolean => {
  const lastErgoHeight = (feeConfig: FeeConfig) =>
    Object.keys(feeConfig['ergo']).sort((a, b) =>
      Number(a) < Number(b) ? 1 : -1
    )[0];
  const lastCardanoHeight = (feeConfig: FeeConfig) =>
    Object.keys(feeConfig['cardano']).sort((a, b) =>
      Number(a) < Number(b) ? 1 : -1
    )[0];

  const currentBridgeFee =
    updatedConfig['ergo'][lastErgoHeight(currentConfig)].bridgeFee;
  const newBridgeFee =
    updatedConfig['ergo'][lastErgoHeight(updatedConfig)].bridgeFee;

  if (
    differencePercent(currentBridgeFee, newBridgeFee) > bridgeFeeTriggerPercent
  )
    return true;

  const currentErgoNetworkFee =
    updatedConfig['cardano'][lastCardanoHeight(currentConfig)].networkFee;
  const newErgoNetworkFee =
    updatedConfig['cardano'][lastCardanoHeight(updatedConfig)].networkFee;

  if (
    differencePercent(currentErgoNetworkFee, newErgoNetworkFee) >
    ergoNetworkFeeTriggerPercent
  )
    return true;

  const currentCardanoNetworkFee =
    updatedConfig['ergo'][lastErgoHeight(currentConfig)].networkFee;
  const newCardanoNetworkFee =
    updatedConfig['ergo'][lastErgoHeight(updatedConfig)].networkFee;

  if (
    differencePercent(currentCardanoNetworkFee, newCardanoNetworkFee) >
    cardanoNetworkFeeTriggerPercent
  )
    return true;

  return false;
};

export const differencePercent = (a: bigint, b: bigint): bigint => {
  const diff = a < b ? b - a : a - b;
  return (diff * 100n) / a;
};
