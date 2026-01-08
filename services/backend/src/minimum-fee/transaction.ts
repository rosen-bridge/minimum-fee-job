import { ErgoBox } from 'ergo-lib-wasm-nodejs';

import { DefaultLogger } from '@rosen-bridge/abstract-logger';

import { minimumFeeConfigs } from '../configs';
import { TokenHandler } from '../tokenMap/tokenHandler';
import { generateTransaction } from '../transaction/generate';
import { ConfigOrder } from '../transaction/types';
import { UpdatedFeeConfig } from '../types';

const logger = DefaultLogger.getInstance().child(import.meta.url);

export const updateConfigsTransaction = async (
  feeConfigs: Map<string, UpdatedFeeConfig>,
) => {
  const inputs: Array<ErgoBox> = [];
  const order: ConfigOrder = [];
  for (const token of TokenHandler.getInstance().getSupportedTokens()) {
    const feeConfig = feeConfigs.get(token.tokenId);
    if (!feeConfig) continue;

    const currentConfigBox = feeConfig.current.getBox();

    if (!currentConfigBox)
      logger.warn(`found no current config box for token [${token.tokenId}]`);
    else inputs.push(currentConfigBox);

    const requiredTokens = [
      {
        id: minimumFeeConfigs.minimumFeeNFT,
        value: 1n,
      },
    ];
    if (token.tokenId !== 'erg')
      requiredTokens.push({
        id: token.ergoSideTokenId,
        value: 1n,
      });
    order.push({
      address: minimumFeeConfigs.minimumFeeAddress,
      assets: {
        nativeToken: minimumFeeConfigs.minBoxErg,
        tokens: requiredTokens,
      },
      box: feeConfig.new?.build(),
    });
  }

  return await generateTransaction(order, inputs);
};
