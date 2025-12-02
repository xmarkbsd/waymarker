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
  // Divider, // No longer needed
} from '@mui/material';
import { useProjectCustomFields } from '../hooks/useProjectCustomFields';
import { db } from '../db';
import type { ISettingsCustomField } from '../db';
import { useState } from 'react';
import { AddFieldDialog } from './components/AddFieldDialog';
import { CustomFieldListItem } from './components/CustomFieldListItem';
import { ProjectManager } from './components/ProjectManager';
import { AddProjectDialog } from './components/AddProjectDialog';
import { MapDownloader } from './components/MapDownloader';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

export const SettingsView = () => {
  const { customFields, loading, activeProjectId } = useProjectCustomFields();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<ISettingsCustomField | null>(
    null
  );
  
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  // --- Add Field Logic ---
  const handleSaveField = async (newField: ISettingsCustomField) => {
    if (!activeProjectId) return;
    try {
      const project = await db.projects.get(activeProjectId);
      if (project) {
        await db.projects.update(activeProjectId, {
          customFields: [...project.customFields, newField],
        });
      }
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
    if (!fieldToDelete || !activeProjectId) return;
    try {
      await db.transaction(
        'rw',
        db.observations,
        db.projects,
        async () => {
          const allObs = await db.observations
            .where('projectId')
            .equals(activeProjectId)
            .toArray();

          allObs.forEach((obs) => {
            if (obs.customFieldValues[fieldToDelete.id]) {
              delete obs.customFieldValues[fieldToDelete.id];
            }
          });
          await db.observations.bulkPut(allObs);

          const project = await db.projects.get(activeProjectId);
          if (project) {
            const newFields = project.customFields.filter(
              (f) => f.id !== fieldToDelete.id
            );
            await db.projects.update(activeProjectId, {
              customFields: newFields,
            });
          }
        }
      );
    } catch (error) {
      console.error('Failed to delete field and data:', error);
    }
    closeDeleteDialog();
  };

  // --- Add Project Logic ---
  const handleAddNewProject = async (
    name: string,
    customFields: ISettingsCustomField[]
  ) => {
    try {
      const newProjectId = await db.projects.add({
        name: name,
        createdAt: new Date(),
        customFields: customFields,
      });
      await db.settings.update(1, { activeProjectId: newProjectId });
    } catch (error) {
      console.error('Failed to create new project:', error);
    }
  };

  // --- Render ---
  const renderList = () => {
    if (loading) {
      return <CircularProgress sx={{ mt: 3 }} />;
    }
    if (customFields.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          No custom fields defined for this project.
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
      <Box sx={{ p: { xs: 0, sm: 2 } }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Settings
        </Typography>

        {/* --- Project Management Section --- */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Projects</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Select an active project, or create a new one. All new data
            will be saved to the active project.
          </Typography>
          <ProjectManager />
          <Button
            variant="contained"
            startIcon={<CreateNewFolderIcon />}
            onClick={() => setIsAddProjectOpen(true)}
            sx={{ mt: 2 }}
          >
            Add New Project
          </Button>
        </Paper>

        {/* --- Offline Maps Section --- */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Offline Maps</Typography>
          <MapDownloader />
        </Paper>

        {/* --- Custom Fields Section --- */}
        <Paper sx={{ p: 2, mb: 3, opacity: activeProjectId ? 1 : 0.4 }}>
          <Typography variant="h6">Custom Fields</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            {activeProjectId
              ? 'Define custom fields for the active project.'
              : 'Select a project to manage its custom fields.'}
          </Typography>
          <Box sx={{ minHeight: '100px' }}>{renderList()}</Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddOpen(true)}
            sx={{ mt: 2 }}
            disabled={!activeProjectId}
          >
            Add Field
          </Button>
        </Paper>
      </Box>

      {/* --- Dialogs --- */}
      
      <AddProjectDialog
        open={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSave={handleAddNewProject}
      />

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
            from ALL existing observations in this project.
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