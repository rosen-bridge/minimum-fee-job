import { Fee } from '@rosen-bridge/minimum-fee';
import {
  bridgeFeeTriggerPercent,
  minimumFeeConfigs,
  networkFeeTriggerPercent,
  rsnRatioTriggerPercent,
} from '../configs';
import {
  AnsiColor,
  DifferencePercent,
  Direction,
  FeeDifferencePercents,
  Registers,
  TableData,
  TableRow,
} from '../types';
import { SUPPORTED_CHAINS, TABLE_CHUNK_SIZE } from './consts';
import { intersection, chunk } from 'lodash-es';

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
): FeeDifferencePercents => {
  const chains = intersection(
    Object.keys(currentConfig.configs),
    Object.keys(newConfig.configs)
  );
  if (chains.length === 0)
    throw Error(
      `impossible behavior: no intersection between the current and new config chains`
    );

  // bridge fee difference
  const anyChain = chains[0];
  const currentBridgeFee = currentConfig.configs[anyChain].bridgeFee;
  const newBridgeFee = newConfig.configs[anyChain].bridgeFee;

  const bridgeFeeDifference = differencePercent(currentBridgeFee, newBridgeFee);

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

  // network fee difference for each chain
  const networkFeeDifferences: Record<string, DifferencePercent | undefined> =
    {};
  SUPPORTED_CHAINS.forEach((chain) => {
    let networkFeeDifference: DifferencePercent | undefined;
    if (chains.includes(chain)) {
      const currentNetworkFee = currentConfig.configs[chain].networkFee;
      const newNetworkFee = newConfig.configs[chain].networkFee;

      networkFeeDifference = differencePercent(
        currentNetworkFee,
        newNetworkFee
      );
    }
    networkFeeDifferences[chain] = networkFeeDifference;
  });

  return {
    bridgeFee: bridgeFeeDifference,
    rsnRatio: rsnRatioDifference,
    networkFee: networkFeeDifferences,
  };
};

export const differencePercent = (a: bigint, b: bigint): DifferencePercent => {
  let direction: Direction;
  if (a < b) direction = Direction.UP;
  else if (a === b) direction = Direction.NONE;
  else direction = Direction.DOWN;

  const diff = a < b ? b - a : a - b;
  return {
    value: (diff * 100n) / a,
    direction: direction,
  };
};

export const pricesToStringChunk = (
  prices: Map<string, number>,
  feeDifferences: Map<string, FeeDifferencePercents | undefined>
) => {
  // generate table headers
  const headers = [
    'Name',
    'Price',
    'Bridge Fee',
    'Rsn Ratio',
    ...SUPPORTED_CHAINS.map(
      (chain) => chain.charAt(0).toUpperCase() + chain.slice(1)
    ),
  ].map((header) => ({ value: header, color: AnsiColor.RESET }));

  // generate token data
  const tableData: TableData = [];
  prices.forEach((value, key) => {
    const token = minimumFeeConfigs.supportedTokens.find(
      (token) => token.tokenId === key
    )!;
    const feeDifference = feeDifferences.get(key);
    if (!feeDifference)
      throw Error(
        `ImpossibleBehavior: no fee difference for token [${token.name}] with id [${key}]`
      );

    const bridgeFeeDifference = conditionalColorize(
      feeDifference.bridgeFee,
      bridgeFeeTriggerPercent
    );
    const rsnRatioDifference = conditionalColorize(
      feeDifference.rsnRatio,
      rsnRatioTriggerPercent
    );
    const networkFeeDifferences = SUPPORTED_CHAINS.map((chain) => {
      const networkFeeDifference = conditionalColorize(
        feeDifference.networkFee[chain],
        networkFeeTriggerPercent[chain]
      );
      return {
        chain,
        difference: networkFeeDifference,
      };
    });

    tableData.push([
      { value: token.name, color: AnsiColor.RESET },
      { value: value.toString(), color: AnsiColor.BLUE },
      bridgeFeeDifference,
      rsnRatioDifference,
      ...networkFeeDifferences.map(
        (networkFeeDifference) => networkFeeDifference.difference
      ),
    ]);
  });
  const result = chunk(tableData, TABLE_CHUNK_SIZE).map((priceChunk) =>
    generateAsciiTable([headers, ...priceChunk])
  );
  if (result.some((chunkString) => chunkString.length > 2000))
    throw Error(
      `Table string passed 2000 character limitation! Please reduce chunk size. Current chunk: ${TABLE_CHUNK_SIZE}`
    );

  return result;
};

const colorizeText = (text: string, color: AnsiColor) => {
  if (color === AnsiColor.RESET) return text;
  return `[2;${color}m${text}[0m`;
};

const conditionalColorize = (
  feeDifference: DifferencePercent | undefined,
  threshold: number
) => {
  if (feeDifference === undefined)
    return { value: '-', color: AnsiColor.RESET };

  const value = Number(feeDifference.value);

  const finalText =
    feeDifference.direction + feeDifference.value.toString() + '%';
  if (value < threshold) return { value: finalText, color: AnsiColor.GREEN };
  else if (value >= threshold && value < 2 * threshold)
    return { value: finalText, color: AnsiColor.YELLOW };
  return { value: finalText, color: AnsiColor.RED };
};

/**
 * Generate an ASCII table from a 2D array.
 * @param data - The 2D array of rows.
 * @returns A formatted ASCII table as a string.
 */
const generateAsciiTable = (data: TableData): string => {
  if (data.length === 0) return '';

  const colWidths = data[0].map((_, colIndex) =>
    Math.max(...data.map((row) => row[colIndex].value.length))
  );

  const horizontalLine = (
    char: string,
    cornerLeft: string,
    cornerRight: string,
    separator: string
  ) =>
    cornerLeft +
    colWidths.map((w) => char.repeat(w + 2)).join(separator) +
    cornerRight;

  const formatRow = (row: TableRow) =>
    '| ' +
    row
      .map((cell, i) =>
        colorizeText(cell.value.padEnd(colWidths[i], ' '), cell.color)
      )
      .join(' | ') +
    ' |';

  const topBorder = horizontalLine('─', '┌', '┐', '┬');
  const midBorder = horizontalLine('─', '├', '┤', '┼');
  const bottomBorder = horizontalLine('─', '└', '┘', '┴');

  const header = formatRow(data[0]);
  const body = data.slice(1).map(formatRow).join('\n');

  return [topBorder, header, midBorder, body, bottomBorder].join('\n');
};
