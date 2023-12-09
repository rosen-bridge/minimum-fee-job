import axios from "axios";
import { Price } from "../types";
import { ERG_ID } from "../types/consts";
import { spectrumPoolTimeLength } from "../configs";

const axiosSpectrum = axios.create({
  baseURL: "https://api.spectrum.fi/v1/price-tracking/markets",
  timeout: 8000,
});

export const fetchPriceFromSpectrumInERG = async (tokenId: string): Promise<number> => {
  const toDate = Date.now();
  const fromDate = toDate - spectrumPoolTimeLength;
  const queryParams = {
    from: fromDate,
    to: toDate
  }
  const pools = await axiosSpectrum.get('', { params: queryParams }).then(res => res.data)

  const prices: Array<Price> = []
  pools.forEach((pool: any) => {
    if (pool.baseId === ERG_ID && pool.quoteId === tokenId) {
      prices.push({
        price: 1 / (pool.lastPrice),
        volume: pool.quoteVolume.value
      })
    } else if (pool.baseId === tokenId && pool.quoteId === ERG_ID) {
      prices.push({
        price: pool.lastPrice,
        volume: pool.baseVolume.value
      })
    }
  })

  if (prices.length === 0) throw Error(`No pool found between [ERG] and [${tokenId}]`)

  const totalPrice = prices.reduce((total: Price, newPrice: Price) => ({
    price: (total.price * total.volume + newPrice.price * newPrice.volume) / (total.volume + newPrice.volume),
    volume: total.volume + newPrice.volume
  }), { price: 0, volume: 0 })

  return totalPrice.price
}
