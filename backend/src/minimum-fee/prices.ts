import { minimumFeeConfigs } from '../configs';
import { fetchPriceFromCoingeckoInUSD } from '../network/fetchPriceFromCoingecko';
import { getPrice } from '../utils/getPrice';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

export const getConfigTokenPrices = async (): Promise<Map<string, number>> => {
  const ergPrice = await fetchPriceFromCoingeckoInUSD('ergo');

  const rsnTokenConfig = minimumFeeConfigs.supportedTokens.find(
    (token) => token.name === 'RSN'
  );
  if (!rsnTokenConfig) throw Error(`Token [RSN] is not found in config`);

  const prices = new Map<string, number>();
  for (const token of minimumFeeConfigs.supportedTokens) {
    const price = await getPrice(token, ergPrice);
    prices.set(token.tokenId, price);
    logger.debug(`Price of [${token.name}]: ${price}$`);
  }

  return prices;
};
