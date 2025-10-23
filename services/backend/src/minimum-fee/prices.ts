import { minimumFeeConfigs } from '../configs';
import { fetchPriceFromCoingeckoInUSD } from '../network/fetchPriceFromCoingecko';
import { fetchPriceFromCoinMarketCapInUSD } from '../network/fetchPriceFromCoinMarketCap';
import { fetchPriceFromDexHunterInADA } from '../network/fetchPriceFromDexHunter';
import { fetchPriceFromMinswapInADA } from '../network/fetchPriceFromMinswap';
import { fetchPriceFromSpectrumInERG } from '../network/fetchPriceFromSpectrum';
import {
  CoinGeckoParams,
  CoinMarketCapParams,
  DuplicateTokenParams,
  ManualParams,
  MinswapParams,
  PriceBackends,
  SupportedTokenConfig,
  PriceFetchResult,
} from '../types';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const getConfigTokenPrices = async (): Promise<PriceFetchResult> => {
  const prices = new Map<string, number>();
  const errors: string[] = [];
  let allPricesFetched = true;
  const coingeckoTokens: SupportedTokenConfig[] = [];
  const coinMarketCapTokens: SupportedTokenConfig[] = [];
  const spectrumTokens: SupportedTokenConfig[] = [];
  const dexHunterTokens: SupportedTokenConfig[] = [];
  const minswapTokens: SupportedTokenConfig[] = [];
  const duplicateTokens: SupportedTokenConfig[] = [];

  for (const token of minimumFeeConfigs.supportedTokens) {
    switch (token.priceBackend) {
      case PriceBackends.CoinGecko: {
        coingeckoTokens.push(token);
        break;
      }
      case PriceBackends.CoinMarketCap: {
        coinMarketCapTokens.push(token);
        break;
      }
      case PriceBackends.Spectrum: {
        spectrumTokens.push(token);
        break;
      }
      case PriceBackends.DexHunter: {
        dexHunterTokens.push(token);
        break;
      }
      case PriceBackends.Minswap: {
        minswapTokens.push(token);
        break;
      }
      case PriceBackends.Manual: {
        const price = (token.priceBackendParams as ManualParams).price;
        logger.debug(`Price of [${token.name}]: ${price}$`);
        prices.set(token.tokenId, price);
        break;
      }
      case PriceBackends.DuplicateToken: {
        duplicateTokens.push(token);
        break;
      }
      default: {
        throw Error(`Backend [${token.priceBackend}] is not supported`);
      }
    }
  }

  // fetch price from coingecko
  try {
    const coingeckoPrices = await fetchPriceFromCoingeckoInUSD(
      coingeckoTokens.map(
        (token) => (token.priceBackendParams as CoinGeckoParams).network,
      ),
    );
    coingeckoTokens.forEach((token) => {
      const price =
        coingeckoPrices[(token.priceBackendParams as CoinGeckoParams).network]
          .usd;
      logger.debug(`Price of [${token.name}]: ${price}$`);
      prices.set(token.tokenId, price);
    });
  } catch (error) {
    const errorMsg = `Failed to fetch prices from CoinGecko: ${error}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
    allPricesFetched = false;
  }

  // fetch price from coinMarketCap
  for (const token of coinMarketCapTokens) {
    try {
      const price = await fetchPriceFromCoinMarketCapInUSD(
        (token.priceBackendParams as CoinMarketCapParams).slug,
      );
      logger.debug(`Price of [${token.name}]: ${price}$`);
      prices.set(token.tokenId, price);
    } catch (error) {
      const errorMsg = `Failed to fetch price for [${token.name}] from CoinMarketCap: ${error}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      allPricesFetched = false;
    }
  }
  // fetch Erg price
  const ergPrice = prices.get('erg');
  if (ergPrice) {
    // fetch price from spectrum
    for (const token of spectrumTokens) {
      try {
        const price =
          (await fetchPriceFromSpectrumInERG(token.tokenId)) * ergPrice;
        logger.debug(`Price of [${token.name}]: ${price}$`);
        prices.set(token.tokenId, price);
      } catch (error) {
        const errorMsg = `Failed to fetch price for [${token.name}] from Spectrum: ${error}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
        allPricesFetched = false;
      }
    }
  } else {
    const errorMsg = `Failed to fetch price for [erg]`;
    logger.error(errorMsg);
    errors.push(errorMsg);
    allPricesFetched = false;
  }
  // fetch Ada price
  const adaPrice = prices.get('ada');
  if (adaPrice) {
    // fetch price from dexhunter
    for (const token of dexHunterTokens) {
      try {
        const price =
          (await fetchPriceFromDexHunterInADA(token.tokenId)) * adaPrice;
        logger.debug(`Price of [${token.name}]: ${price}$`);
        prices.set(token.tokenId, price);
      } catch (error) {
        const errorMsg = `Failed to fetch price for [${token.name}] from DexHunter: ${error}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
        allPricesFetched = false;
      }
    }

    // fetch price from minswap
    for (const token of minswapTokens) {
      try {
        const params = token.priceBackendParams as MinswapParams;
        const price =
          (await fetchPriceFromMinswapInADA(
            token.tokenId,
            params.lpPolicyId,
            params.lpAssetName,
          )) * adaPrice;
        logger.debug(`Price of [${token.name}]: ${price}$`);
        prices.set(token.tokenId, price);
      } catch (error) {
        const errorMsg = `Failed to fetch price for [${token.name}] from Minswap: ${error}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
        allPricesFetched = false;
      }
    }
  } else {
    const errorMsg = `Failed to fetch price for [ada]`;
    logger.error(errorMsg);
    errors.push(errorMsg);
    allPricesFetched = false;
  }
  // fetch duplicate token prices
  for (const token of duplicateTokens) {
    const price = prices.get(
      (token.priceBackendParams as DuplicateTokenParams).tokenId,
    );
    if (!price) {
      const errorMsg = `Failed to fetch price for [${token.name}]`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      allPricesFetched = false;
    } else {
      logger.debug(`Price of [${token.name}]: ${price}$`);
      prices.set(token.tokenId, price);
    }
  }

  return {
    prices,
    allPricesFetched,
    errors,
  };
};
