export type ValidationResultOk = { isValid: boolean; reason: string | null };

export interface Validate {
  (tokenId: string): Promise<ValidationResultOk>;
}

export interface Validation {
  id: string;
  title: string;
  hint: string;
  validate: Validate;
}
