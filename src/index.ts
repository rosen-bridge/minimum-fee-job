import { minimumFeeConfigs, supportedTokens } from "./configs";
import { generateNewFeeConfig } from "./minimum-fee/newConfig";
import { updateConfigsTransaction } from "./minimum-fee/transaction";
import { updateAndGenerateFeeConfig } from "./minimum-fee/updateConfig";
import { feeConfigToRegisterValues } from "./utils/utils";
import loggerFactory from "./utils/logger";
import JsonBigInt from "@rosen-bridge/json-bigint";
import { Notification } from "./network/Notification"

const logger = loggerFactory(import.meta.url)

const main = async () => {
  if (minimumFeeConfigs.feeAddress === minimumFeeConfigs.minimumFeeAddress)
    throw Error(`Fee address and Minimum-fee config address cannot be equal`)

  // new config
  const newFeeConfigs = await generateNewFeeConfig();
  const newConfig = newFeeConfigs.configs
  const prices = newFeeConfigs.prices

  newConfig.forEach((feeConfig, tokenId) => {
    logger.debug(`fee config for token [${tokenId}]: ${JsonBigInt.stringify(feeConfig)}`)
    logger.debug(`Register values: ${JsonBigInt.stringify(feeConfigToRegisterValues(feeConfig))}`)
  })

  // updated config
  const updatedConfig = await updateAndGenerateFeeConfig(newConfig);

  updatedConfig.forEach((feeConfig, tokenId) => {
    logger.debug(`Updated fee config for token [${tokenId}]: ${JsonBigInt.stringify(feeConfig)}`)
    logger.debug(`Register values: ${JsonBigInt.stringify(feeConfigToRegisterValues(feeConfig))}`)
  })
  
  if (updatedConfig.size === 0) logger.info(`No config need update`)
  else {
    // transaction
    logger.info(`updating config for tokens [${Array.from(updatedConfig.keys())}]`)
    const tx = JsonBigInt.stringify(await updateConfigsTransaction(updatedConfig))
    logger.info(`Transaction to update minimum-fee config box generated`)  

    // send notification to discord
    Notification.getInstance().sendMessage(`# MinimumFee configs need to be updated`)
    const tokenIds = Array.from(updatedConfig.keys())

    // send configs
    for (const tokenId of tokenIds) {
      const token = supportedTokens.find(token => token.tokenId === tokenId)!
      Notification.getInstance().sendMessage(`## Token ${token.name} [${token.tokenId}]
        ergo side tokenId: \`${token.ergoSideTokenId}\`
        price: ${prices.get(tokenId)!}$
      `)
      const tokenFeeConfig = JsonBigInt.stringify(
        updatedConfig.get(tokenId)
      )
      Notification.getInstance().sendMessage(`\`\`\`json\n${tokenFeeConfig}\n\`\`\``)
    }

    // send tx
    const n = Math.ceil(tx.length / 1500)
    const chunks = Array.from(tx.match(/.{1,1500}/g)!)
    Notification.getInstance().sendMessage(`generated tx. chunks: ${n}`)
    for (let i = 0; i < n; i++) {
      const txChunk = JsonBigInt.stringify({
        CSR: chunks[i],
        n: n,
        p: i + 1
      })
      logger.info(`chunk [${i}]: ${txChunk}`)

      Notification.getInstance().sendMessage(`\`\`\`json\n${txChunk}\n\`\`\``)
    }
  }
}

main().then(() => null)
