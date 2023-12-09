import { minimumFeeConfigs } from "./configs";
import { generateNewFeeConfig } from "./minimum-fee/newConfig";
import { updateConfigsTransaction } from "./minimum-fee/transaction";
import { updateAndGenerateFeeConfig } from "./minimum-fee/updateConfig";
import { feeConfigToRegisterValues } from "./utils";
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
    logger.info(`Updated fee config for token [${tokenId}]: ${JsonBigInt.stringify(feeConfig)}`)
    logger.debug(`Register values: ${JsonBigInt.stringify(feeConfigToRegisterValues(feeConfig))}`)
  })

  // transaction
  const tx = await updateConfigsTransaction(updatedConfig)
  logger.info(`Transaction to update minimum-fee config box generated: ${JsonBigInt.stringify({
    CSR: JSON.stringify(tx)
  })}`)
}

main().then(() => null)
