import ValidationResult from "./ValidationResult";

import { Validate } from "@/app/_validations/types";

/**
 * Validate and render a single cell in validations table
 */
const Validation = async ({
  tokenId,
  validator,
}: {
  tokenId: string;
  validator: Validate;
}) => {
  const validationResult = await validator(tokenId);

  return <ValidationResult validationResult={validationResult} />;
};

export default Validation;
