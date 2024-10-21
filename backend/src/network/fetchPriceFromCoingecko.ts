import axios from 'axios';
import { urls } from '../configs';

const axiosCoingecko = axios.create({
  baseURL: `${urls.coingecko}/api/v3/simple/price`,
  timeout: 8000,
});

export const fetchPriceFromCoingeckoInUSD = async (
  network: string
): Promise<number> => {
  const queryParams = {
    ids: network,
    vs_currencies: 'usd',
  };
  return await axiosCoingecko
    .get('', { params: queryParams })
    .then((res) => res.data[network].usd);
};
