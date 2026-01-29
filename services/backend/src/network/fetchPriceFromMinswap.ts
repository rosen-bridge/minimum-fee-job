import axios from 'axios';

import { urls } from '../configs';

const axiosMinswap = axios.create({
  baseURL: urls.minswap,
  timeout: 8000,
});

export const fetchPriceFromMinswapInADA = async (
  tokenId: string,
): Promise<number> => {
  const [policyId, assetName] = tokenId.split('.');
  const response = await axiosMinswap.get(
    `/v1/assets/${policyId}${assetName}/price/timeseries?period=1d`,
  );
  const priceChartList: Array<{ timestamp: string; value: string }> =
    response.data;
  const latestPrice = priceChartList.reduce((latestPrice, currentPrice) => {
    if (Date.parse(latestPrice.timestamp) < Date.parse(currentPrice.timestamp))
      return currentPrice;
    return latestPrice;
  }, priceChartList[0]);
  return Number(latestPrice.value);
};
