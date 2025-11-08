// src/pages/components/SaveTemplateDialog.tsx

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState, useEffect } from 'react';

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  suggestedName: string;
}

export const SaveTemplateDialog = ({
  open,
  onClose,
  onSave,
  suggestedName,
}: SaveTemplateDialogProps) => {
  const [name, setName] = useState(suggestedName);

  // Update name if the suggestedName changes (e.g., user clicks another project)
  useEffect(() => {
    setName(suggestedName);
  }, [suggestedName]);

  const handleSave = () => {
    if (!name) return;
    onSave(name);
    onClose();
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Save as Template</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Template Name"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!name}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};