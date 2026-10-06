import { ErgoBox } from '@fleet-sdk/core';
import { hex } from '@fleet-sdk/crypto';
import { serializeBox } from '@fleet-sdk/serializer';

import { ExtendedTokenMap, RosenTokens } from '@rosen-bridge/extended-tokens';

/**
 * creates a token map from a list of Octm boxes
 *
 * @param boxes
 * @returns promise that resolves to a token map
 */
export const boxesToTokenMap = async (
  boxes: ErgoBox[],
): Promise<RosenTokens> => {
  const tokenMap = new ExtendedTokenMap();

  await tokenMap.updateConfigByBoxes(
    boxes.map((box) => serializeBox(box).encode(hex)),
  );

  return tokenMap.getRawConfig();
};
