'use client';

import type { ReactNode } from 'react';

import { Box, MuiModal } from './base';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export const Modal = ({ open, onClose, children }: ModalProps) => (
  <MuiModal open={open} onClose={onClose} aria-modal="true">
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        boxSizing: 'border-box',
        maxWidth: 'calc(100vw - 32px)',
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
      {children}
    </Box>
  </MuiModal>
);
