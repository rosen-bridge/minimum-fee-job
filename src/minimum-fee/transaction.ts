import { minimumFeeConfigs } from "../configs";
import { getMinimumFeeConfigBox } from "../network/clients";
import { ErgoBoxProxy } from "@rosen-bridge/ergo-box-selection";
import { ConfigOrder } from "../transaction/types";
import { generateTransaction } from "../transaction/generate";
import { FeeConfig } from "../types";
import WinstonLogger from "@rosen-bridge/winston-logger";

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

export const updateConfigsTransaction = async (feeConfigs: Map<string, FeeConfig>) => {
  const inputs: Array<ErgoBoxProxy> = []
  const order: ConfigOrder = []
  for (const token of minimumFeeConfigs.supportedTokens) {
    const feeConfig = feeConfigs.get(token.tokenId)!;
    const currentConfigBox = await getMinimumFeeConfigBox(token.ergoSideTokenId)

    if (!currentConfigBox) logger.warn(`found no current config box for token [${token.tokenId}]`)
    else inputs.push(currentConfigBox)

    const requiredTokens = [
      {
        id: minimumFeeConfigs.minimumFeeNFT,
        value: 1n
      }
    ]
    if (token.tokenId !== 'erg') requiredTokens.push(
      {
        id: token.ergoSideTokenId,
        value: 1n
      }
    )
    order.push({
      address: minimumFeeConfigs.minimumFeeAddress,
      assets: {
        nativeToken: minimumFeeConfigs.minBoxErg,
        tokens: requiredTokens
      },
      feeConfig: feeConfig
    })
  }

  return await generateTransaction(order, inputs)
}

