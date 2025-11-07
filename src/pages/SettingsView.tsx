// src/pages/SettingsView.tsx

import {
  Box,
  Typography,
  List,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
} from '@mui/material';
import { useSettings } from '../hooks/useSettings';
import { db } from '../db';
import type { ISettingsCustomField } from '../db';
import { useState } from 'react';
import { AddFieldDialog } from './components/AddFieldDialog';
import { CustomFieldListItem } from './components/CustomFieldListItem';
import AddIcon from '@mui/icons-material/Add';

export const SettingsView = () => {
  const { customFields, loading } = useSettings();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<ISettingsCustomField | null>(
    null
  );

  // --- Add Field Logic ---
  const handleSaveField = async (newField: ISettingsCustomField) => {
    try {
      // Add the new field to the existing array
      await db.settings.update(1, {
        customFields: [...customFields, newField],
      });
    } catch (error) {
      console.error('Failed to save new field:', error);
    }
  };

  // --- Delete Field Logic ---
  const openDeleteDialog = (field: ISettingsCustomField) => {
    setFieldToDelete(field);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setFieldToDelete(null);
    setIsDeleteOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!fieldToDelete) return;

    try {
      // Use a Dexie transaction to ensure all or nothing
      await db.transaction('rw', db.observations, db.settings, async () => {
        // 1. Get all observations
        const allObs = await db.observations.toArray();

        // 2. Remove the custom field value from each observation
        allObs.forEach((obs) => {
          if (obs.customFieldValues[fieldToDelete.id]) {
            delete obs.customFieldValues[fieldToDelete.id];
          }
        });
        await db.observations.bulkPut(allObs); // Save changes

        // 3. Remove the field definition from settings
        const newFields = customFields.filter(
          (f) => f.id !== fieldToDelete.id
        );
        await db.settings.update(1, { customFields: newFields });
      });
    } catch (error) {
      console.error('Failed to delete field and data:', error);
    }

    closeDeleteDialog();
  };

  // --- Render ---
  const renderList = () => {
    if (loading) {
      return <CircularProgress sx={{ mt: 3 }} />;
    }

    if (customFields.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          No custom fields defined.
        </Typography>
      );
    }

    return (
      <List>
        {customFields.map((field) => (
          <CustomFieldListItem
            key={field.id}
            field={field}
            onDelete={openDeleteDialog}
          />
        ))}
      </List>
    );
  };

  return (
    <>
      <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent' }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>
        
        {/* --- Custom Fields Section --- */}
        <Typography variant="h6" sx={{ mt: 3 }}>
          Custom Fields
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Define the custom data fields that will appear on the
          "New Observation" screen.
        </Typography>
        
        <Box sx={{ minHeight: '100px' }}>
          {renderList()}
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddOpen(true)}
          sx={{ mt: 2 }}
        >
          Add Field
        </Button>
      </Paper>

      {/* --- Dialogs --- */}
      <AddFieldDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveField}
      />

      <Dialog open={isDeleteOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Field?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the field "
            {fieldToDelete?.label}"?
          </DialogContentText>
          <DialogContentText color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            This will also delete ALL captured data for this field
            from ALL existing observations. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};