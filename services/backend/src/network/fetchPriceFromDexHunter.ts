import axios from 'axios';
import { urls } from '../configs';

const axiosDexHunter = axios.create({
  baseURL: `${urls.dexHunter}`,
  timeout: 8000,
});

export const fetchPriceFromDexHunterInADA = async (
  tokenId: string
): Promise<number> => {
  const unit = tokenId.replaceAll('.', '');
  return await axiosDexHunter
    .get<{
      averagePrice: number;
      price_ab: number;
      price_ba: number;
    }>(`swap/averagePrice/ADA/${unit}`)
    .then((res) => res.data.price_ba);
};
