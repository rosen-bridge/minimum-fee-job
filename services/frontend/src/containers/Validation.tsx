import { ReactElement, useCallback, useEffect, useState } from 'react';

import { GppBad, GppMaybe, VerifiedUser } from '@mui/icons-material';
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material';

import { Validate, ValidationResultOk } from '@/types';

/**
 * Validate and render a single cell in validations table
 */
export const Validation = ({
  tokenId,
  validator,
}: {
  tokenId: string;
  validator: Validate;
}) => {
  const [value, setValue] = useState<ValidationResultOk>();

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(() => {
    setLoading(true);
    validator(tokenId)
      .then((data) => {
        setValue(data);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tokenId, validator]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Render an element and wrap it in a tooltip if a reason provided
   * @param element
   * @param reason
   */
  const renderWithReasonOption = (
    element: ReactElement,
    reason: string | null,
  ) => {
    return (
      <IconButton onClick={load}>
        {reason ? (
          <Tooltip
            sx={{ cursor: 'pointer' }}
            title={<Box whiteSpace="pre-line">{reason}</Box>}
          >
            {element}
          </Tooltip>
        ) : (
          element
        )}
      </IconButton>
    );
  };

  if (loading) {
    return <CircularProgress size={10} />;
  }

  if (error) {
    return renderWithReasonOption(<GppMaybe color="warning" />, error.message);
  }

  if (value?.isValid) {
    return renderWithReasonOption(
      <VerifiedUser color="success" />,
      value.reason,
    );
  }

  return renderWithReasonOption(
    <GppBad color="error" />,
    value?.reason ?? null,
  );
};
