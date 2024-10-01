import { GppBad, GppMaybe, VerifiedUser } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { ReactElement } from "react";

import { ValidationResult as ValidationResultType } from "@/app/_validations/types";

/**
 * Render a single cell in validations table
 */
const ValidationResult = ({
  validationResult,
}: {
  validationResult: ValidationResultType;
}) => {
  /**
   * Render an element and wrap it in a tooltip if a reason provided
   * @param element
   * @param reason
   */
  const renderWithReasonOption = (
    element: ReactElement,
    reason: string | null
  ) =>
    reason ? (
      <Tooltip sx={{ cursor: "pointer" }} title={reason}>
        {element}
      </Tooltip>
    ) : (
      element
    );

  if (validationResult.isErr()) {
    return renderWithReasonOption(
      <GppMaybe color="warning" />,
      validationResult.error.message
    );
  }

  if (validationResult.value.isValid) {
    return renderWithReasonOption(
      <VerifiedUser color="success" />,
      validationResult.value.reason
    );
  }

  return renderWithReasonOption(
    <GppBad color="error" />,
    validationResult.value.reason
  );
};

export default ValidationResult;
