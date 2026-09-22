import hash from 'object-hash';

import { ERGO_CHAIN } from '@/constants';
import { IdentifiableRosenToken, TokenMap } from '@/types';

/**
 * transforms a token map into a flat array of identifiable rosen tokens
 *
 * @param tokenMap
 * @returns array of identifiable rosen tokens
 */
export const transformTokenMap = (
  tokenMap: TokenMap,
): IdentifiableRosenToken[] => {
  return tokenMap.flatMap((tokenSet) => {
    // extract ergoTokenId or empty string for unbridgeable tokens
    const ergoTokenId =
      tokenSet.find((token) => token.chain === ERGO_CHAIN)?.tokenId ?? '';

    return tokenSet.map((token) => ({ ...token, ergoTokenId }));
  });
};

/**
 * checks if two identifiable rosen tokens represent the same logical token
 *
 * @param token1 - first token to compare
 * @param token2 - second token to compare
 * @returns true if both tokens represent the same logical token
 */
const isMatchingToken = (
  token1: IdentifiableRosenToken,
  token2: IdentifiableRosenToken,
) => {
  return token1.chain === token2.chain && token1.tokenId === token2.tokenId;
};

/**
 * compares updated and current token arrays and classifies them into
 * unchanged, changed, removed and new groups
 *
 * @param updatedTokens - array of tokens from the updated token map
 * @param currentTokens - array of tokens from the current on-chain token map
 * @returns object with arrays: unchangedTokens, changedTokens, removedTokens and newTokens
 */
export const compareTokens = (
  updatedTokens: IdentifiableRosenToken[],
  currentTokens: IdentifiableRosenToken[],
) => {
  const currentTokenMap = new Map<string, IdentifiableRosenToken>();
  currentTokens.forEach((token) => currentTokenMap.set(hash(token), token));

  const updatedTokenMap = new Map<string, IdentifiableRosenToken>();
  updatedTokens.forEach((token) => updatedTokenMap.set(hash(token), token));

  const unchangedTokens: IdentifiableRosenToken[] = [];
  const changedTokens: IdentifiableRosenToken[] = [];
  const removedTokens: IdentifiableRosenToken[] = [];
  const newTokens: IdentifiableRosenToken[] = [];

  updatedTokens.forEach((token) => {
    if (currentTokenMap.has(hash(token))) {
      unchangedTokens.push(token);
    } else {
      const found = currentTokens.find((t) => isMatchingToken(token, t));
      if (found) {
        changedTokens.push(token);
      } else {
        newTokens.push(token);
      }
    }
  });

  // detect removed tokens by checking which current tokens are not in the updated token map
  currentTokens.forEach((token) => {
    const stillExists = updatedTokens.find((t) => isMatchingToken(token, t));
    if (!stillExists) {
      removedTokens.push(token);
    }
  });

  return { unchangedTokens, changedTokens, removedTokens, newTokens };
};
