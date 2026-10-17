'use client';

import { useState } from 'react';

import { QRCodeSVG } from 'qrcode.react';

import { Box, Modal, Slider, Stepper, Typography } from './ui';

const QR_TYPE = 'CSR';
const MAX_PAYLOAD = 2800;
const MIN_CHUNK_SIZE = 200;

const ENVELOPE_SIZE = JSON.stringify({
  [QR_TYPE]: '',
  p: 99,
  n: 99,
  a: 0,
}).length;

type TransactionQRModalProps = {
  open: boolean;
  onClose: () => void;
  tx: string;
};

const TransactionQRPages = ({ tx }: { tx: string }) => {
  const min = Math.ceil(tx.length / (MAX_PAYLOAD - ENVELOPE_SIZE));
  const max = Math.max(min, Math.ceil(tx.length / MIN_CHUNK_SIZE));

  const [pagesCount, setPagesCount] = useState(min);
  const [pageIndex, setPageIndex] = useState(0);

  const chunkSize = Math.ceil(tx.length / pagesCount);
  const value = JSON.stringify({
    [QR_TYPE]: tx.slice(pageIndex * chunkSize, (pageIndex + 1) * chunkSize),
    p: pageIndex + 1,
    n: pagesCount,
    a: 0,
  });

  return (
    <Box sx={{ width: '100%', maxWidth: 420 }}>
      <QRCodeSVG
        value={value}
        size={380}
        level="L"
        includeMargin
        bgColor="#ffffff"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      <Stepper
        steps={pagesCount}
        activeStep={pageIndex}
        onChange={setPageIndex}
      />
      {max > min && (
        <Box sx={{ px: 3, pt: 1 }}>
          <Typography variant="body2">Number of pages: {pagesCount}</Typography>
          <Slider
            min={min}
            max={max}
            value={pagesCount}
            valueLabelDisplay="auto"
            onChange={(_, v) => {
              setPagesCount(v as number);
              setPageIndex(0);
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export const TransactionQRModal = ({
  open,
  onClose,
  tx,
}: TransactionQRModalProps) => (
  <Modal open={open} onClose={onClose}>
    {tx ? (
      <TransactionQRPages key={tx} tx={tx} />
    ) : (
      <Typography color="text.secondary">
        No transaction is available to encode.
      </Typography>
    )}
  </Modal>
);
