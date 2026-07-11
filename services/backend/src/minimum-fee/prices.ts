import { isAxiosError } from 'axios';

import { DefaultLogger } from '@rosen-bridge/abstract-logger';

import { fetchPriceFromCoingeckoInUSD } from '../network/fetchPriceFromCoingecko';
import { fetchPriceFromCoinMarketCapInUSD } from '../network/fetchPriceFromCoinMarketCap';
import { fetchPriceFromDexHunterInADA } from '../network/fetchPriceFromDexHunter';
import { fetchPriceFromMinswapInADA } from '../network/fetchPriceFromMinswap';
import { fetchPriceFromSpectrumInERG } from '../network/fetchPriceFromSpectrum';
import { TokenHandler } from '../tokenMap/tokenHandler';
import {
  CoinGeckoParams,
  CoinMarketCapParams,
  DuplicateTokenParams,
  ManualParams,
  PriceBackends,
  SupportedTokenConfig,
  PriceFetchResult,
} from '../types';
import { extractAxiosErrorMessage } from '../utils/utils';

const logger = DefaultLogger.getInstance().child(import.meta.url);

export const getConfigTokenPrices = async (): Promise<PriceFetchResult> => {
  const prices = new Map<string, number>();
  const errors = new Map<string, string>();
  let fetched = true;
  const coingeckoTokens: SupportedTokenConfig[] = [];
  const coinMarketCapTokens: SupportedTokenConfig[] = [];
  const spectrumTokens: SupportedTokenConfig[] = [];
  const dexHunterTokens: SupportedTokenConfig[] = [];
  const minswapTokens: SupportedTokenConfig[] = [];
  const duplicateTokens: SupportedTokenConfig[] = [];

  for (const token of TokenHandler.getInstance().getSupportedTokens()) {
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
    const errorMsg = isAxiosError(error)
      ? extractAxiosErrorMessage(error)
      : `${error}`;
    logger.error(`Failed to fetch prices from CoinGecko: ${errorMsg}`);
    coingeckoTokens.forEach((token) => {
      errors.set(token.name, errorMsg);
    });
    fetched = false;
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
      const errorMsg = isAxiosError(error)
        ? extractAxiosErrorMessage(error)
        : `${error}`;
      logger.error(
        `Failed to fetch price for [${token.name}] from CoinMarketCap: ${errorMsg}`,
      );
      errors.set(token.name, errorMsg);
      fetched = false;
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
        const errorMsg = isAxiosError(error)
          ? extractAxiosErrorMessage(error)
          : `${error}`;
        logger.error(
          `Failed to fetch price for [${token.name}] from Spectrum: ${errorMsg}`,
        );
        errors.set(token.name, errorMsg);
        fetched = false;
      }
    }
  } else {
    const errorMsg = `Skipped fetching prices from Spectrum due to unavailable [ERG] price.`;
    logger.error(errorMsg);
    spectrumTokens.forEach((token) => {
      errors.set(token.name, errorMsg);
    });
    fetched = false;
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
        const errorMsg = isAxiosError(error)
          ? extractAxiosErrorMessage(error)
          : `${error}`;
        logger.error(
          `Failed to fetch price for [${token.name}] from DexHunter: ${errorMsg}`,
        );
        errors.set(token.name, errorMsg);
        fetched = false;
      }
    }

    // fetch price from minswap
    for (const token of minswapTokens) {
      try {
        const price =
          (await fetchPriceFromMinswapInADA(token.tokenId)) * adaPrice;
        logger.debug(`Price of [${token.name}]: ${price}$`);
        prices.set(token.tokenId, price);
      } catch (error) {
        const errorMsg = isAxiosError(error)
          ? extractAxiosErrorMessage(error)
          : `${error}`;
        logger.error(
          `Failed to fetch price for [${token.name}] from Minswap: ${errorMsg}`,
        );
        errors.set(token.name, errorMsg);
        fetched = false;
      }
    }
  } else {
    const errorMsg = `Skipped fetching prices from minswap and dexhunter due to unavailable [ADA] price.`;
    logger.error(errorMsg);
    dexHunterTokens.forEach((token) => {
      errors.set(token.name, errorMsg);
    });
    minswapTokens.forEach((token) => {
      errors.set(token.name, errorMsg);
    });
    fetched = false;
  }
  // fetch duplicate token prices
  for (const token of duplicateTokens) {
    const dependantToken = (token.priceBackendParams as DuplicateTokenParams)
      .tokenId;
    const price = prices.get(dependantToken);
    if (!price) {
      const errorMsg = `Cannot set price for [${token.name}]: Price of [${dependantToken}] is unavailable`;
      logger.error(errorMsg);
      errors.set(token.name, errorMsg);
      fetched = false;
    } else {
      logger.debug(`Price of [${token.name}]: ${price}$`);
      prices.set(token.tokenId, price);
    }
  }

  return {
    prices,
    fetched,
    errors,
  };
};
