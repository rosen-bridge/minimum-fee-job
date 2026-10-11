'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  onAlternative: () => void;
};

export const ConfirmationModal = ({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  onAlternative,
}: ConfirmationModalProps) => (
  <Dialog open={open} onClose={onCancel} aria-labelledby="confirmation-title">
    <DialogTitle id="confirmation-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm}>Load this version</Button>
      <Button variant="contained" onClick={onAlternative} autoFocus>
        Load latest version
      </Button>
    </DialogActions>
  </Dialog>
);
