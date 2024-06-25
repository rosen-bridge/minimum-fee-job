import axios from 'axios';
import { Price } from '../types';
import { ERG_ID } from '../types/consts';
import { spectrumPoolTimeLength } from '../configs';
import { SpectrumPool } from '../types/spectrum';
import WinstonLogger from '@rosen-bridge/winston-logger';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);

const axiosSpectrum = axios.create({
  baseURL: 'https://api.spectrum.fi',
  timeout: 8000,
});

export const fetchPriceFromSpectrumInERG = async (
  tokenId: string
): Promise<number> => {
  const toDate = Date.now();
  const fromDate = toDate - spectrumPoolTimeLength;
  const queryParams = {
    from: fromDate,
    to: toDate,
  };
  const pools = await axiosSpectrum
    .get('/v1/amm/pools/stats', { params: queryParams })
    .then((res) => res.data);

  const prices: Array<Price> = [];
  pools.forEach((pool: SpectrumPool) => {
    let lockedErg: number;
    let lockedToken: number;
    let volume: number;
    if (pool.lockedX.id === ERG_ID && pool.lockedY.id === tokenId) {
      lockedErg = pool.lockedX.amount / 10 ** pool.lockedX.decimals;
      lockedToken = pool.lockedY.amount / 10 ** pool.lockedY.decimals;
      volume = pool.lockedY.amount;
    } else if (pool.lockedX.id === tokenId && pool.lockedY.id === ERG_ID) {
      lockedErg = pool.lockedY.amount / 10 ** pool.lockedY.decimals;
      lockedToken = pool.lockedX.amount / 10 ** pool.lockedX.decimals;
      volume = pool.lockedX.amount;
    } else return;
    prices.push({
      price: lockedErg / lockedToken,
      volume: volume,
    });
  });

  if (prices.length === 0)
    throw Error(`No pool found between [ERG] and [${tokenId}]`);

  logger.debug(`token [${tokenId}] Pool prices: ${JSON.stringify(prices)}`);
  const totalPrice = prices.reduce(
    (total: Price, newTvl: Price) => ({
      price:
        (total.price * total.volume + newTvl.price * newTvl.volume) /
        (total.volume + newTvl.volume),
      volume: total.volume + newTvl.volume,
    }),
    { price: 0, volume: 0 }
  );

  return totalPrice.price;
};
