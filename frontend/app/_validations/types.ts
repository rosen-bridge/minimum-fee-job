import { Result } from "../_types/result";

export type ValidationResult = Result<{ isValid: boolean }, Error>;

export interface Validate {
  (tokenId: string): Promise<ValidationResult>;
}

export interface Validation {
  id: string;
  title: string;
  validate: Validate;
}
