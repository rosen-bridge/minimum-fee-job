import { fetchPriceFromCoinMarketCapInUSD } from "../network/fetchPriceFromCoinMarketCap";
import { fetchPriceFromCoingeckoInUSD } from "../network/fetchPriceFromCoingecko";
import { fetchPriceFromSpectrumInERG } from "../network/fetchPriceFromSpectrum";
import { CoinGeckoParams, CoinMarketCapParams, ManualParams, PriceBackends, SupportedTokenConfig, TokenConfig } from "../types";

export const getPrice = async (token: SupportedTokenConfig, ergPrice: number): Promise<number> => {
  switch (token.priceBackend) {
    case PriceBackends.CoinGecko:
      return await fetchPriceFromCoingeckoInUSD((token.priceBackendParams as CoinGeckoParams).network!)
    case PriceBackends.CoinMarketCap:
      return await fetchPriceFromCoinMarketCapInUSD((token.priceBackendParams as CoinMarketCapParams).slug!)
    case PriceBackends.Spectrum:
      return await fetchPriceFromSpectrumInERG(token.tokenId) * ergPrice
    case PriceBackends.Manual:
      return (token.priceBackendParams as ManualParams).price
    default:
      throw Error(`Backend [${token.priceBackend}] is not supported`)
  }
}
