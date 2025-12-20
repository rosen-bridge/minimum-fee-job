'use server';

import { wrap } from '@/safeServerAction';
import { getTx } from '@/store';

import { extractTxData } from './extractTxData';

/**
 * Get a Result object containing either fees config indexed by token id, or an
 * error
 */
export const getFeesByToken = async () => extractTxData(await getTx());

export const getFeesByTokenSafe = wrap(getFeesByToken);
