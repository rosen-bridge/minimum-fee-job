import { Result } from "ts-results-es";

import { AppError } from "../_error/app";

export type ValidationResult = Result<
  { isValid: boolean; reason: string | null },
  AppError
>;

export interface Validate {
  (tokenId: string): Promise<ValidationResult>;
}

export interface Validation {
  id: string;
  title: string;
  hint: string;
  validate: Validate;
}
