import { Chains } from '../types';

export const ERG_ID =
  '0000000000000000000000000000000000000000000000000000000000000000';
export const feeRatioDivisor = 10000;

export const TABLE_CHUNK_SIZE = 10;

export const SUPPORTED_CHAINS = Object.values(Chains);

export const ERC20_TRANSFER_GAS = 53000n;

export const HANDSHAKE_CONFIRMATION_TARGET = 6; // blocks
export const HANDSHAKE_FALLBACK_FEE_RATE = 0.05; // HNS/kB
export const HANDSHAKE_MINIMUM_FEE_RATIO = 1; // dollarydoos/vB (relay minimum)
