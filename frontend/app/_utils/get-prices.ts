import { getPrices } from "@/app/_store";

import { Result } from "../_types/result";

/**
 * Get a Result object containing either prices, or an error
 */
const getPricesWrapped = async (): Promise<
  Result<Record<string, string>, Error>
> => {
  try {
    const possiblePrices = await getPrices();
    if (!possiblePrices) {
      throw new Error("Prices was fetched from the store, but it was null");
    }
    return {
      error: null,
      value: possiblePrices,
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
        "An unknown error occurred while fetching prices from the store"
      ),
      value: null,
    };
  }
};

export default getPricesWrapped;
