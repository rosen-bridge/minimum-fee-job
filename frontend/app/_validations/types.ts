import { Result } from "../_types/result";

export type ValidationResult = Result<
  { isValid: boolean; reason: string | null },
  Error
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
