// src/pages/components/AddFieldDialog.tsx

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useState } from 'react';
import type { ISettingsCustomField } from '../../db';
import { v4 as uuidv4 } from 'uuid';

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (field: ISettingsCustomField) => void;
}

type FieldType = ISettingsCustomField['type'];

export const AddFieldDialog = ({
  open,
  onClose,
  onSave,
}: AddFieldDialogProps) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [options, setOptions] = useState('');

  const handleSave = () => {
    if (!label) return; // Simple validation

    const newField: ISettingsCustomField = {
      id: uuidv4(),
      label: label,
      type: type,
      options:
        type === 'autocomplete' ? options.split('\n').filter(Boolean) : [],
    };

    onSave(newField);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setLabel('');
    setType('text');
    setOptions('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Add New Field</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Field Label"
          fullWidth
          variant="standard"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <FormControl variant="standard" fullWidth margin="dense">
          <InputLabel>Field Type</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
          >
            {/* UPDATED: Added new field types */}
            <MenuItem value={'text'}>Text</MenuItem>
            <MenuItem value={'number'}>Number</MenuItem>
            <MenuItem value={'date'}>Date</MenuItem>
            <MenuItem value={'boolean'}>Boolean (Yes/No)</MenuItem>
            <MenuItem value={'autocomplete'}>Autocomplete List</MenuItem>
            <MenuItem value={'photo_reference'}>Photo Reference</MenuItem>
          </Select>
        </FormControl>
        {type === 'autocomplete' && (
          <TextField
            margin="dense"
            label="Autocomplete Options (one per line)"
            fullWidth
            variant="standard"
            multiline
            rows={4}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!label}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};