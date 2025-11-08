// src/pages/components/AddProjectDialog.tsx

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
  // Typography, // <-- Removed unused import
} from '@mui/material';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
// import type { IProjectTemplate, ISettingsCustomField } from '../../db'; // <-- Removed IProjectTemplate
import type { ISettingsCustomField } from '../../db';

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, customFields: ISettingsCustomField[]) => void;
}

export const AddProjectDialog = ({
  open,
  onClose,
  onSave,
}: AddProjectDialogProps) => {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState<string>('none');
  const templates = useLiveQuery(() => db.templates.toArray(), []);

  const handleSave = () => {
    if (!name) return;

    let customFields: ISettingsCustomField[] = [];

    // Find the selected template and get its fields
    if (templateId !== 'none' && templates) {
      const selectedTemplate = templates.find(
        (t) => t.id === Number(templateId)
      );
      if (selectedTemplate) {
        // We must clone the custom fields to avoid issues with duplicate IDs
        customFields = selectedTemplate.customFields.map((field) => ({
          ...field,
          id: crypto.randomUUID(), // Give a new unique ID
        }));
      }
    }

    onSave(name, customFields);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setTemplateId('none');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Add New Project</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Project Name"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormControl variant="standard" fullWidth margin="dense" sx={{ mt: 2 }}>
          <InputLabel>From Template (Optional)</InputLabel>
          <Select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <MenuItem value={'none'}>
              <em>None (Blank Project)</em>
            </MenuItem>
            {templates ? (
              templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>Loading templates...</MenuItem>
            )}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!name}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};