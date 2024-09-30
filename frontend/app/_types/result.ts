export type Result<Value, Error> =
  | {
      value: Value;
      error: null;
    }
  | {
      value: null;
      error: Error;
    };
