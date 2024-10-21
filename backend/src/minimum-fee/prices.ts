import { minimumFeeConfigs } from '../configs';
import { fetchPriceFromCoingeckoInUSD } from '../network/fetchPriceFromCoingecko';
import { fetchPriceFromCoinMarketCapInUSD } from '../network/fetchPriceFromCoinMarketCap';
import { fetchPriceFromSpectrumInERG } from '../network/fetchPriceFromSpectrum';
import {
  CoinGeckoParams,
  CoinMarketCapParams,
  ManualParams,
  PriceBackends,
  SupportedTokenConfig,
} from '../types';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

export const getConfigTokenPrices = async (): Promise<Map<string, number>> => {
  const prices = new Map<string, number>();
  const coingeckoTokens: SupportedTokenConfig[] = [];
  const coinMarketCapTokens: SupportedTokenConfig[] = [];
  const spectrumTokens: SupportedTokenConfig[] = [];

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
      case PriceBackends.Manual: {
        const price = (token.priceBackendParams as ManualParams).price;
        logger.debug(`Price of [${token.name}]: ${price}$`);
        prices.set(token.tokenId, price);
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

  return prices;
};
