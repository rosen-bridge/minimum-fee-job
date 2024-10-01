"use client";

import { QRCodeSVG } from "qrcode.react";

import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { Box, Button, MobileStepper, Slider, Typography } from "@mui/material";

import useChunkedTx from "../../_hooks/useChunkedTx";

/**
 * render a qr code for a chunked tx with the ability to change pages count
 */
export const QrDisplay = ({ tx }: { tx: string }) => {
  const {
    handleSliderChange,
    pageIndex,
    pagesCount,
    pageThresholds,
    setIndex,
    value,
  } = useChunkedTx(tx);

  const renderStepper = () =>
    pagesCount > 1 && (
      <MobileStepper
        variant="text"
        steps={pagesCount}
        position="static"
        activeStep={pageIndex}
        sx={{ marginRight: 1 }}
        nextButton={
          <Button
            size="small"
            onClick={() => setIndex(pageIndex + 1)}
            disabled={pageIndex === pagesCount - 1}
            variant="text"
          >
            Next
            <KeyboardArrowRight />
          </Button>
        }
        backButton={
          <Button
            size="small"
            onClick={() => setIndex(pageIndex - 1)}
            disabled={pageIndex === 0}
            variant="text"
          >
            <KeyboardArrowLeft />
            Back
          </Button>
        }
      />
    );

  const renderSlider = () =>
    pageThresholds.max !== pageThresholds.min && (
      <Box display="flex" px={2} pb={1} pt={2} gap={3}>
        <Typography>Pages Count:</Typography>
        <Box flexGrow={1}>
          <Slider
            valueLabelDisplay="auto"
            marks
            min={pageThresholds.min}
            max={pageThresholds.max}
            value={pagesCount}
            onChange={handleSliderChange}
          />
        </Box>
      </Box>
    );

  return (
    <Box width={380} display="flex" flexDirection="column" alignItems="stretch">
      <QRCodeSVG value={value} size={380} includeMargin bgColor="transparent" />
      {renderStepper()}
      {renderSlider()}
    </Box>
  );
};

export default QrDisplay;
