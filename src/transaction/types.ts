import { FeeConfig } from '@rosen-bridge/minimum-fee';

export interface TokenInfo {
  id: string;
  value: bigint;
}

export interface AssetBalance {
  nativeToken: bigint;
  tokens: Array<TokenInfo>;
}

export interface SinglePayment {
  address: string;
  assets: AssetBalance;
  feeConfig: FeeConfig;
}

export type ConfigOrder = Array<SinglePayment>;

export interface TransactionEIP19 {
  reducedTx: string; // Base64 encoded data of ReducedTransaction serialized bytes
  sender: string; // P2PK address
  inputs: Array<string>; // Array of Base64 encoded data of ErgoBox serialized bytes
}
