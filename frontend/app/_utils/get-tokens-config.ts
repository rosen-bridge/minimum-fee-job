import { getTokensConfig } from "@/app/_store";

import { Result } from "../_types/result";
import { PartialSupportedTokenConfig } from "../_types/token-config";

/**
 * Get a Result object containing either fees config indexed by token id, or an
 * error
 */
const getTokensConfigWrapped = async (): Promise<
  Result<PartialSupportedTokenConfig[], Error>
> => {
  try {
    const possibleTokensConfig = await getTokensConfig();
    if (!possibleTokensConfig) {
      throw new Error(
        "Tokens config was fetched from the store, but it was null or an empty string"
      );
    }
    return {
      error: null,
      value: possibleTokensConfig,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        error,
        value: null,
      };
    }
    return {
      error: new Error(
        "An unknown error occurred while fetching tokens config from the store"
      ),
      value: null,
    };
  }
};

export default getTokensConfigWrapped;
