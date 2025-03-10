"use client";

import { QRCodeSVG } from "qrcode.react";
import CopyToClipboard from 'react-copy-to-clipboard';

import { ContentCopyOutlined, DownloadOutlined, KeyboardArrowLeft, KeyboardArrowRight, PauseCircleOutline, PlayCircleOutline, ZoomIn } from "@mui/icons-material";
import { Box, Button, Collapse, IconButton, MobileStepper, Slider, Stack, Typography } from "@mui/material";

import useChunkedTx from "../../_hooks/useChunkedTx";
import { ToggleIconButton } from "./ToggleIconButton";
import { useState } from "react";

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
    playing,
    clone,
    play,
  } = useChunkedTx(tx);

  const [showConfig, setShowConfig] = useState<boolean>(false);

  const renderToolbar = () => {
    return (
      <Stack direction="row" justifyContent="center" spacing={1}>
      <CopyToClipboard text={clone()}>
        <IconButton>
          <ContentCopyOutlined />
        </IconButton>
      </CopyToClipboard>
      <IconButton disabled={true}>
        <DownloadOutlined />
      </IconButton>
      <ToggleIconButton
        selected={playing}
        onClick={play}
        disabled={pagesCount <= 1}
      >
        {playing ? <PauseCircleOutline /> : <PlayCircleOutline />}
      </ToggleIconButton>
      <ToggleIconButton
        selected={showConfig && !playing}
        disabled={playing}
        onClick={() => setShowConfig(!showConfig)}
      >
        <ZoomIn />
      </ToggleIconButton>
    </Stack>
    )
  }

  const renderStepper = () => (
    <Collapse in={true}>
      <MobileStepper
        variant="text"
        steps={pagesCount}
        position="static"
        activeStep={pageIndex}
        nextButton={
          <Button
            size="small"
            onClick={() => setIndex(pageIndex + 1)}
            disabled={pageIndex === pagesCount - 1 || playing}
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
            disabled={pageIndex === 0 || playing}
            variant="text"
          >
            <KeyboardArrowLeft />
            Back
          </Button>
        }
      />
      </Collapse>
    );

  const renderSlider = () => (
    <Collapse in={showConfig && !playing}>
      <Box px={3}>
        <Typography variant="body2">
          <Typography component="span" color="text.secondary">
            Number of pages:{' '}
          </Typography>
          {pagesCount}
        </Typography>
        {pageThresholds.max !== pageThresholds.min &&  (
          <Slider
            valueLabelDisplay="auto"
            step={1}
            marks
            min={pageThresholds.min}
            onChange={handleSliderChange}
            value={pagesCount}
            max={pageThresholds.max}
            disabled={playing}
          />
        )}
      </Box>
    </Collapse>  
  ) 

  return (
    <Box display="flex" flexDirection="column" alignItems="stretch" gap={1} pb={2}>
      <QRCodeSVG value={value} size={380} includeMargin bgColor="transparent" />
      {renderStepper()}
      {renderSlider()}
      {renderToolbar()}
    </Box>
  );
};

export default QrDisplay;
