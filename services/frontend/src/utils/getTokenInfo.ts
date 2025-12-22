import {
  NATIVE_RESIDENCY,
  RosenChainToken,
  TokenMap,
} from '@rosen-bridge/tokens';

/**
 * Get a Rosen chain token , or an error
 */
export const getTokenInfo = (
  tokenMap: TokenMap,
  tokenId: string,
): RosenChainToken & { significantDecimals: number } => {
  const tokenSet = tokenMap.getTokenSet(tokenId);

  if (tokenSet === undefined) {
    throw new Error(`Token [${tokenId}] is not found in TokenMap`);
  }

  const nativeChain = Object.keys(tokenSet).find(
    (chain) => tokenSet[chain].residency === NATIVE_RESIDENCY,
  );

  if (nativeChain === undefined) {
    throw new Error(
      `ImpossibleBehavior: Native chain for token [${tokenId}] is not found`,
    );
  }

  return {
    ...tokenSet[nativeChain],
    significantDecimals: tokenMap.getSignificantDecimals(tokenId)!,
  };
};
