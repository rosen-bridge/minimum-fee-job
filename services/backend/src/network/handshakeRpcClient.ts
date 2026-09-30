import axios, { AxiosInstance } from 'axios';
import { randomBytes } from 'node:crypto';

import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import JsonBigInt from '@rosen-bridge/json-bigint';

import {
  HANDSHAKE_CONFIRMATION_TARGET,
  HANDSHAKE_FALLBACK_FEE_RATE,
  HANDSHAKE_MINIMUM_FEE_RATIO,
} from '../utils/consts';

export class HandshakeRpcError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = 'HandshakeRpcError';
  }
}

interface JsonRpcResult<Result> {
  id: string;
  result: Result;
  error?: { code: number; message: string } | null;
}

interface HandshakeChainInfo {
  blocks: number;
}

export class HandshakeRpcClient {
  private readonly client: AxiosInstance;

  constructor(
    baseURL: string,
    protected readonly logger?: AbstractLogger,
  ) {
    this.client = axios.create({
      baseURL,
    });
  }

  private generateRandomId = () => randomBytes(32).toString('hex');

  /**
   * validates that the response id matches the request id
   * @param requestId the request id
   * @param responseId the response id
   */
  protected validateResponseId = (
    requestId: string,
    responseId: string,
  ): void => {
    if (responseId !== requestId) {
      throw Error(
        `Request and response id are different ['${requestId}' != '${responseId}']`,
      );
    }
  };

  /**
   * calls a JSON-RPC method on the node
   *
   * hsd answers a failed call with HTTP 200 and an `error` object in the body,
   * so the failure has to be read from the response rather than from a rejected
   * request
   * @param method the rpc method name
   * @param params the rpc method params
   * @param baseError prefix of the message of any thrown error
   * @returns the result of the call
   * @throws HandshakeRpcError if the node reports the call as failed
   */
  protected callRpc = async <Result>(
    method: string,
    params: Array<unknown>,
    baseError: string,
  ): Promise<Result> => {
    const requestId = this.generateRandomId();

    let response;
    try {
      response = await this.client.post<JsonRpcResult<Result>>('', {
        method: method,
        id: requestId,
        params: params,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.response) {
        throw Error(baseError + `${JsonBigInt.stringify(e.response.data)}`);
      }
      throw Error(baseError + e.message);
    }

    this.validateResponseId(requestId, response.data.id);

    const error = response.data.error;
    if (error) {
      throw new HandshakeRpcError(
        error.code,
        baseError + JsonBigInt.stringify(error),
      );
    }

    this.logger?.debug(
      `Requested '${method}' with params ${JsonBigInt.stringify(
        params,
      )}. Response: ${JsonBigInt.stringify(response.data.result)}`,
    );

    return response.data.result;
  };

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  getHeight = async (): Promise<number> => {
    const chainInfo = await this.callRpc<HandshakeChainInfo>(
      'getblockchaininfo',
      [],
      `Failed to fetch current height from Handshake RPC: `,
    );

    return chainInfo.blocks;
  };

  /**
   * gets the estimated fee ratio
   * @returns the fee ratio in dollarydoos per vByte
   */
  getFeeRatio = async (): Promise<number> => {
    const feeRate = await this.callRpc<number>(
      'estimatefee',
      [HANDSHAKE_CONFIRMATION_TARGET], // Number of blocks to target for confirmation
      `Failed to get fee ratio from Handshake RPC: `,
    );

    // estimatefee returns -1 if it can't estimate (insufficient historical data)
    const estimatedFeeRate =
      feeRate === -1 || feeRate <= 0 ? HANDSHAKE_FALLBACK_FEE_RATE : feeRate;

    // Convert from HNS/kB (1000 bytes) to dollarydoos/vB.
    const feePerVByte = Math.round(estimatedFeeRate * 1e6) / 1000;

    // A node may estimate below the relay minimum (e.g. 0.000999 HNS/kB), which
    // would build transactions the network rejects as underpaying
    return Math.max(feePerVByte, HANDSHAKE_MINIMUM_FEE_RATIO);
  };
}
