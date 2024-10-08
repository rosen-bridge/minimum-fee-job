import axios from 'axios';
import { CoinMarketCapPricePool, Price } from '../types';

const axiosCoinMarketCap = axios.create({
  baseURL:
    'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/market-pairs/latest',
  timeout: 8000,
});

export const fetchPriceFromCoinMarketCapInUSD = async (
  slug: string
): Promise<number> => {
  const queryParams = {
    slug: slug,
    start: 1,
    limit: 5,
    category: 'spot',
    centerType: 'all',
    sort: 'cmc_rank_advanced',
    direction: 'desc',
    spotUntracked: true,
  };
  const marketsData = await axiosCoinMarketCap
    .get('', { params: queryParams })
    .then((res) => res.data);

  const prices: Array<Price> = [];
  marketsData.data.marketPairs.forEach((pool: CoinMarketCapPricePool) => {
    if (pool.quotes[0].volume24h)
      prices.push({
        price: pool.quotes[0].price,
        volume: pool.quotes[0].volume24h,
      });
  });

  if (prices.length === 0) throw Error(`No pool found for [${slug}]`);

  const totalPrice = prices.reduce(
    (total: Price, newPrice: Price) => ({
      price:
        (total.price * total.volume + newPrice.price * newPrice.volume) /
        (total.volume + newPrice.volume),
      volume: total.volume + newPrice.volume,
    }),
    { price: 0, volume: 0 }
  );

  return totalPrice.price;
};
