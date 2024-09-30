import validateBridgeFee from "./validateBridgeFee";
import validateConfigSameness from "./validateConfigSameness";
import validateTokenHeights from "./validateTokenHeights";

import { Validation } from "./types";

/**
 * A list of all validations that should be run for supported bridge tokens
 */
const validations: Validation[] = [
  {
    validate: validateTokenHeights,
    title: "Heights",
    id: "heights",
    hint: "All heights should exist in the old config, except the last one",
  },
  {
    validate: validateConfigSameness,
    title: "Sameness",
    id: "sameness",
    hint: "bridgeFee, feeRatio, rsnRatio, and rsnRatioDivisor should be the same for all chains in the new config",
  },
  {
    validate: validateBridgeFee,
    title: "Bridge fee",
    id: "bridge-fee",
    hint: "Bridge fee should be the expected predefined number",
  },
];

export default validations;
