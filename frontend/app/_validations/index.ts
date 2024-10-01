import validateBridgeFeeByRsnRatio from "./validateBridgeFeeByRsnRatio";
import validateBridgeFeeByToken from "./validateBridgeFeeByToken";
import validateChainConfigsSameness from "./validateChainConfigsSameness";
import validateOldFeesConsistency from "./validateOldFeesConsistency";

import { Validation } from "./types";

/**
 * A list of all validations that should be run for supported bridge tokens
 */
const validations: Validation[] = [
  {
    validate: validateOldFeesConsistency,
    title: "Old Fees Consistency",
    id: "old-fees-consistency",
    hint: "All fees except the new one should exist in the box on the blockchain and be exactly the same",
  },
  {
    validate: validateChainConfigsSameness,
    title: "Chain Configs Sameness",
    id: "chain-configs-sameness",
    hint: "bridgeFee, feeRatio, rsnRatio, and rsnRatioDivisor should be the same for all chains in the new config",
  },
  {
    validate: validateBridgeFeeByToken,
    title: "Bridge Fee (Token)",
    id: "bridge-fee-token",
    hint: "Bridge fee calculation using token should be the expected predefined number",
  },
  {
    validate: validateBridgeFeeByRsnRatio,
    title: "Bridge Fee (RSN ratio)",
    id: "bridge-fee-rsn-ratio",
    hint: "Bridge fee calculation using rsn ratio should be the expected predefined number",
  },
];

export default validations;
