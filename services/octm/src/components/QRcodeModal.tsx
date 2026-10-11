'use client';

import { Box, Modal, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

type QRcodeModalProps = {
  open: boolean;
  value: string;
  onClose: () => void;
};

export const QRcodeModal = ({ open, value, onClose }: QRcodeModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    aria-labelledby="qrcode-modal-title"
    aria-modal="true"
  >
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 24,
      }}
    >
      <Typography id="qrcode-modal-title" variant="h6">
        QR code
      </Typography>
      <QRCodeSVG value={value} size={256} />
    </Box>
  </Modal>
);
