import { minimumFeeConfigs } from "./configs";
import { generateNewFeeConfig } from "./minimum-fee/newConfig";
import { updateConfigsTransaction } from "./minimum-fee/transaction";
import { updateAndGenerateFeeConfig } from "./minimum-fee/updateConfig";
import { feeConfigToRegisterValues } from "./utils/utils";
import loggerFactory from "./utils/logger";
import JsonBigInt from "@rosen-bridge/json-bigint";

const logger = loggerFactory(import.meta.url)

const main = async () => {
  if (minimumFeeConfigs.feeAddress === minimumFeeConfigs.minimumFeeAddress)
    throw Error(`Fee address and Minimum-fee config address cannot be equal`)

  // new config
  const newConfig = await generateNewFeeConfig();

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
    logger.info(`updating config for tokens [${Array.from(updatedConfig.keys())}]`)
    // transaction
    const tx = await updateConfigsTransaction(updatedConfig)
    const csrTx = JsonBigInt.stringify({
      CSR: JSON.stringify(tx)
    })
    logger.info(`Transaction to update minimum-fee config box generated: ${csrTx}`)


  }
}

main().then(() => null)
