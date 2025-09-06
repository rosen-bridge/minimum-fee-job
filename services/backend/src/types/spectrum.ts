export interface SpectrumPool {
  id: string;
  lockedX: LockedX;
  lockedY: LockedY;
  tvl: Tvl;
  volume: Volume;
  fees: Fees;
  yearlyFeesPercent: number;
}

interface LockedX {
  id: string;
  amount: number;
  ticker: string;
  decimals: number;
}

interface LockedY {
  id: string;
  amount: number;
  ticker: string;
  decimals: number;
}

interface Tvl {
  value: number;
  units: Units;
}

interface Units {
  currency: Currency;
}

interface Currency {
  id: string;
  decimals: number;
}

interface Volume {
  value: number;
  units: Units2;
  window: Window;
}

interface Units2 {
  currency: Currency2;
}

interface Currency2 {
  id: string;
  decimals: number;
}

interface Window {
  from: number;
  to: number;
}

interface Fees {
  value: number;
  units: Units3;
  window: Window2;
}

interface Units3 {
  currency: Currency3;
}

interface Currency3 {
  id: string;
  decimals: number;
}

interface Window2 {
  from: number;
  to: number;
}
