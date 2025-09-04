import { minimumFeeConfigs } from '../configs';
import { ErgoBoxProxy } from '@rosen-bridge/ergo-box-selection';
import { ConfigOrder } from '../transaction/types';
import { generateTransaction } from '../transaction/generate';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { UpdatedFeeConfig } from '../types';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const updateConfigsTransaction = async (
  feeConfigs: Map<string, UpdatedFeeConfig>
) => {
  const inputs: Array<ErgoBoxProxy> = [];
  const order: ConfigOrder = [];
  for (const token of minimumFeeConfigs.supportedTokens) {
    const feeConfig = feeConfigs.get(token.tokenId);
    if (!feeConfig) continue;

    const currentConfigBox = feeConfig.current.getBox();

    if (!currentConfigBox)
      logger.warn(`found no current config box for token [${token.tokenId}]`);
    else inputs.push(currentConfigBox.to_js_eip12());

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
