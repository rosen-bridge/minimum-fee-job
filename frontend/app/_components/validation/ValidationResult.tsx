import { GppBad, Help, VerifiedUser } from "@mui/icons-material";
import { Tooltip } from "@mui/material";

import { ValidationResult as ValidationResultType } from "@/app/_validations/types";

/**
 * Render a single cell in validations table
 */
const ValidationResult = ({
  validationResult,
}: {
  validationResult: ValidationResultType;
}) =>
  validationResult.error ? (
    <Tooltip title={validationResult.error.message}>
      <Help sx={{ cursor: "pointer" }} color="warning" />
    </Tooltip>
  ) : validationResult.value!.isValid ? (
    <VerifiedUser color="success" />
  ) : (
    <GppBad color="error" />
  );

export default ValidationResult;
