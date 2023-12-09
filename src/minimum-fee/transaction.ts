import { minimumFeeConfigs, supportedTokens } from "../configs";
import { getMinimumFeeConfigBox } from "../network/clients";
import { ErgoBoxProxy } from "@rosen-bridge/ergo-box-selection";
import { ConfigOrder } from "../transaction/types";
import { generateTransaction } from "../transaction/generate";
import { FeeConfig } from "../types";

export const updateConfigsTransaction = async (feeConfigs: Map<string, FeeConfig>) => {
  const inputs: Array<ErgoBoxProxy> = []
  const order: ConfigOrder = []
  for (const tokenId of minimumFeeConfigs.supportedTokens) {
    const token = supportedTokens.find(token => token.tokenId === tokenId)
    if (!token) throw Error(`Token [${tokenId}] is not found in supported tokens list`)

    const feeConfig = feeConfigs.get(tokenId)!;
    const currentConfigBox = await getMinimumFeeConfigBox(token.ergoSideTokenId)

    if (!currentConfigBox) console.log(`found no current config box for token [${tokenId}]`)
    else inputs.push(currentConfigBox)

    const requiredTokens = [
      {
        id: minimumFeeConfigs.minimumFeeNFT,
        value: 1n
      }
    ]
    if (tokenId !== 'erg') requiredTokens.push(
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

