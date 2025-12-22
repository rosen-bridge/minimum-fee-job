/* eslint-disable */

type AsyncFunction = (...args: any[]) => Promise<any>;

type Wrap = <Action extends AsyncFunction>(
  action: Action,
) => (...args: Parameters<Action>) => WrapResult<Action>;

type WrapResult<Action extends AsyncFunction> = Promise<{
  result?: Awaited<ReturnType<Action>>;
  error?: string;
}>;

type Unwrap = <Action extends ReturnType<Wrap>>(
  action: Action,
) => (...args: Parameters<Action>) => UnwrapResult<Action>;

type UnwrapResult<Action extends ReturnType<Wrap>> = Promise<
  NonNullable<Awaited<ReturnType<Action>>['result']>
>;

export const wrap: Wrap = (action) => {
  return async (...args) => {
    try {
      return {
        result: await action(...args),
      };
    } catch (error: any) {
      return {
        error: error?.message || 'UnknownError',
      };
    }
  };
};

export const unwrap: Unwrap = (action) => {
  return async (...args) => {
    const result = await action(...args);

    if (result.error) {
      throw new Error(result.error);
    }

    return result.result;
  };
};
