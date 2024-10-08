import { getTx } from "@/app/_store";
import extractTxData from "@/app/_utils/extract-tx-data";

/**
 * Get a Result object containing either fees config indexed by token id, or an
 * error
 */
const getFeesByToken = async () => (await getTx()).andThen(extractTxData);

export default getFeesByToken;
