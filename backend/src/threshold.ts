import './bootstrap';
import axios from 'axios';
import { tokens as loadTokens } from './configs';
import JsonBi from '@rosen-bridge/json-bigint';
import { getConfigTokenPrices } from './minimum-fee/prices';
import { writeFileSync } from 'fs';

interface TokenType {
  [chain: string]: {
    maxNativeTransfer: bigint;
    tokens: {
      [tokenId: string]: {
        low: bigint;
        high: bigint;
      };
    };
  };
}

const MAX_NATIVE_TRANSFER: { [chain: string]: bigint } = {
  ergo: 1000000000n,
  cardano: 10000000n,
  bitcoin: 1000000n,
  ethereum: 0n,
};

const TOKENS_MAX: { [key: string]: number } = {
  erg: 600000,
};

const TOKENS_MIN: { [key: string]: number } = {
  erg: 350000,
};

const roundWithDigits = (value: number, significantDigits: number = 3) => {
  const valueBigint = BigInt(Math.ceil(value));
  const valueString = valueBigint.toString();
  if (significantDigits < valueString.length) {
    const roundValue =
      '5' +
      Array(valueString.length - significantDigits - 1)
        .fill('0')
        .join('');
    const newValueString = (valueBigint + BigInt(roundValue)).toString();
    return BigInt(
      newValueString.substring(0, significantDigits) +
        Array(newValueString.length - significantDigits)
          .fill('0')
          .join('')
    );
  }
  return valueBigint;
};

const ergoTokenSupply = async (tokenId: string) => {
  try {
    const res = await axios.get<{ emissionAmount: number; decimals?: number }>(
      `https://api.ergoplatform.com/api/v1/tokens/${tokenId}`
    );
    return res.data.emissionAmount / Math.pow(10, res.data.decimals ?? 0);
  } catch (error) {
    return 0;
  }
};

const getLowAmount = (tokenId: string, price: number) => {
  const filtered = Object.keys(TOKENS_MIN).filter((item) =>
    new RegExp(item).test(tokenId)
  );
  if (filtered.length === 0) return 150000 / price;
  return TOKENS_MIN[filtered[0]];
};
const getHighAmount = (tokenId: string, price: number) => {
  const filtered = Object.keys(TOKENS_MAX).filter((item) =>
    new RegExp(item).test(tokenId)
  );
  if (filtered.length === 0) return 300000 / price;
  return TOKENS_MAX[filtered[0]];
};

const threshold = async () => {
  const prices = await getConfigTokenPrices();
  const tokens = loadTokens();
  const thresholds: TokenType = {};
  const chains = Object.keys(MAX_NATIVE_TRANSFER);
  chains.forEach((chain) => {
    thresholds[chain] = {
      maxNativeTransfer: MAX_NATIVE_TRANSFER[chain],
      tokens: {},
    };
  });
  for (const item of tokens.tokens) {
    const nativeChain = chains.filter(
      (chain) => item[chain] && item[chain].metaData.residency === 'native'
    );
    if (nativeChain.length > 0) {
      const price = prices.get(item[nativeChain[0]].tokenId);
      if (price) {
        const totalSupply = await ergoTokenSupply(item.ergo.tokenId);
        let high = getHighAmount(item.ergo.tokenId, price);
        let low = getLowAmount(item.ergo.tokenId, price);
        if (totalSupply > 0 && high > totalSupply / 3) {
          high = totalSupply / 3;
          low = high / 2;
        }
        chains.forEach((chain) => {
          if (item[chain]) {
            const decimals = item[chain].decimals;
            const chainLow = low * Math.pow(10, decimals);
            const chainHigh = high * Math.pow(10, decimals);
            const tokenId = item[chain].tokenId;
            thresholds[chain].tokens[tokenId] = {
              low: roundWithDigits(chainLow, 3),
              high: roundWithDigits(chainHigh, 3),
            };
          }
        });
      }
    }
  }
  writeFileSync('thresholds.json', JsonBi.stringify(thresholds, undefined, 4));
  console.log(JsonBi.stringify(thresholds, undefined, 4));
};

threshold().then(() => null);
// console.log(roundWithDigits(12345, 1));
