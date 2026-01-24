import axios from 'axios';

import { urls } from '../configs';

const axiosMinswap = axios.create({
  baseURL: urls.minswap,
  timeout: 8000,
});

export const fetchPriceFromMinswapInADA = async (
  tokenId: string,
  lpPolicyId: string,
  lpAssetName: string,
): Promise<number> => {
  const [policyId, assetName] = tokenId.split('.');
  const response = await axiosMinswap.post(
    '',
    {
      query:
        'query PriceChart($input: PriceChartInput!) {\n  priceChart(input: $input) {\n    time\n    value\n  }\n}',
      variables: {
        input: {
          assetIn: {
            currencySymbol: '',
            tokenName: '',
          },
          assetOut: {
            currencySymbol: policyId,
            tokenName: assetName,
          },
          lpAsset: {
            currencySymbol: lpPolicyId,
            tokenName: lpAssetName,
          },
          period: 'ONE_DAY',
        },
      },
      operationName: 'PriceChart',
    },
    { params: { PriceChart: '' } },
  );
  const priceChartList: Array<{ time: string; value: string }> =
    response.data.data.priceChart;
  const latestPrice = priceChartList.reduce((latestPrice, currentPrice) => {
    if (Date.parse(latestPrice.time) < Date.parse(currentPrice.time))
      return currentPrice;
    return latestPrice;
  }, priceChartList[0]);
  return Number(latestPrice.value);
};
