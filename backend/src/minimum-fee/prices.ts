import { minimumFeeConfigs } from '../configs';
import { fetchPriceFromCoingeckoInUSD } from '../network/fetchPriceFromCoingecko';
import { fetchPriceFromCoinMarketCapInUSD } from '../network/fetchPriceFromCoinMarketCap';
import { fetchPriceFromDexHunterInADA } from '../network/fetchPriceFromDexHunter';
import { fetchPriceFromSpectrumInERG } from '../network/fetchPriceFromSpectrum';
import {
  CoinGeckoParams,
  CoinMarketCapParams,
  DuplicateTokenParams,
  ManualParams,
  PriceBackends,
  SupportedTokenConfig,
} from '../types';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const getConfigTokenPrices = async (): Promise<Map<string, number>> => {
  const prices = new Map<string, number>();
  const coingeckoTokens: SupportedTokenConfig[] = [];
  const coinMarketCapTokens: SupportedTokenConfig[] = [];
  const spectrumTokens: SupportedTokenConfig[] = [];
  const dexHunterTokens: SupportedTokenConfig[] = [];
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
  const coingeckoPrices = await fetchPriceFromCoingeckoInUSD(
    coingeckoTokens.map(
      (token) => (token.priceBackendParams as CoinGeckoParams).network
    )
  );
  coingeckoTokens.forEach((token) => {
    const price =
      coingeckoPrices[(token.priceBackendParams as CoinGeckoParams).network]
        .usd;
    logger.debug(`Price of [${token.name}]: ${price}$`);
    prices.set(token.tokenId, price);
  });

  // fetch price from coinMarketCap
  for (const token of coinMarketCapTokens) {
    const price = await fetchPriceFromCoinMarketCapInUSD(
      (token.priceBackendParams as CoinMarketCapParams).slug
    );
    logger.debug(`Price of [${token.name}]: ${price}$`);
    prices.set(token.tokenId, price);
  }

  // fetch price from spectrum
  const ergPrice = prices.get('erg');
  if (!ergPrice) throw Error(`Erg price is not fetched yet!`);
  for (const token of spectrumTokens) {
    const price = (await fetchPriceFromSpectrumInERG(token.tokenId)) * ergPrice;
    logger.debug(`Price of [${token.name}]: ${price}$`);
    prices.set(token.tokenId, price);
  }

  // fetch price from dexhunter
  const adaPrice = prices.get('ada');
  if (!adaPrice) throw Error(`Ada price is not fetched yet!`);
  for (const token of dexHunterTokens) {
    const price =
      (await fetchPriceFromDexHunterInADA(token.tokenId)) * adaPrice;
    logger.debug(`Price of [${token.name}]: ${price}$`);
    prices.set(token.tokenId, price);
  }

  // fetch duplicate token prices
  for (const token of duplicateTokens) {
    const price = prices.get(
      (token.priceBackendParams as DuplicateTokenParams).tokenId
    );
    if (!price) throw Error(`Token [${price}] price is not fetched yet!`);
    logger.debug(`Price of [${token.name}]: ${price}$`);
    prices.set(token.tokenId, price);
  }

  return prices;
};
