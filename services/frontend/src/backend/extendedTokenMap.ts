import { ErgoBox } from '@fleet-sdk/core';
import { hex } from '@fleet-sdk/crypto';
import { serializeBox } from '@fleet-sdk/serializer';

import { ExtendedTokenMap } from '@rosen-bridge/extended-tokens';

import { CHAIN, CHAIN_KEY } from '@/constants';
import { Residency, TokenMap } from '@/types';

/**
 * creates a token map from a list of Octm boxes
 *
 * @param boxes
 * @returns promise that resolves to a token map
 */
export const boxesToTokenMap = async (boxes: ErgoBox[]): Promise<TokenMap> => {
  const tokenMap = new ExtendedTokenMap();

  await tokenMap.updateConfigByBoxes(
    boxes.map((box) => serializeBox(box).encode(hex)),
  );

  const config = tokenMap.getRawConfig();

  const mapped: TokenMap = config.map((ts) =>
    // add chain key to each token entry and sort their object keys for consistency
    // also sort token sets by chain key
    Object.keys(ts)
      .map((chain) => ({
        chain: chain as CHAIN_KEY,
        tokenId: ts[chain].tokenId,
        name: ts[chain].name,
        decimals: ts[chain].decimals,
        type: ts[chain].type,
        residency: ts[chain].residency as Residency,
        extra:
          chain === CHAIN.cardano.key
            ? {
                policyId: ts[chain].extra.policyId,
                assetName: ts[chain].extra.assetName,
              }
            : ts[chain].extra,
      }))
      .toSorted((a, b) => a.chain.localeCompare(b.chain)),
  );

  return mapped;
};
