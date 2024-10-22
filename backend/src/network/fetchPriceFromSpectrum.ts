import axios from 'axios';
import { ErgTokenVolumes } from '../types';
import { ERG_ID } from '../types/consts';
import { spectrumPoolTimeLength, urls } from '../configs';
import { SpectrumPool } from '../types/spectrum';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

const axiosSpectrum = axios.create({
  baseURL: urls.spectrum,
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

  const volumes: Array<ErgTokenVolumes> = [];
  pools.forEach((pool: SpectrumPool) => {
    if (pool.lockedX.id === ERG_ID && pool.lockedY.id === tokenId) {
      volumes.push({
        erg: pool.lockedX.amount / 10 ** pool.lockedX.decimals,
        token: pool.lockedY.amount / 10 ** pool.lockedY.decimals,
      });
    } else if (pool.lockedX.id === tokenId && pool.lockedY.id === ERG_ID) {
      volumes.push({
        erg: pool.lockedY.amount / 10 ** pool.lockedY.decimals,
        token: pool.lockedX.amount / 10 ** pool.lockedX.decimals,
      });
    }
  });

  if (volumes.length === 0)
    throw Error(`No pool found between [ERG] and [${tokenId}]`);

  logger.debug(`token [${tokenId}] Pool prices: ${JSON.stringify(volumes)}`);
  const totalPrice = volumes.reduce(
    (total: ErgTokenVolumes, pool: ErgTokenVolumes) => ({
      erg: total.erg + pool.erg,
      token: total.token + pool.token,
    }),
    { erg: 0, token: 0 }
  );

  return totalPrice.erg / totalPrice.token;
};
