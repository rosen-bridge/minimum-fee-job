import { Result } from "ts-results-es";

import { AppError } from "../_error/app";

export type ValidationResultOk = { isValid: boolean; reason: string | null };

export type ValidationResult = Result<ValidationResultOk, AppError>;

export interface Validate {
  (tokenId: string): Promise<ValidationResult>;
}

export interface Validation {
  id: string;
  title: string;
  hint: string;
  validate: Validate;
}
