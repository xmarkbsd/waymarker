// src/pages/components/ProjectManager.tsx

import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Box,
  Typography,
  Tooltip,
  CircularProgress, // 1. IMPORT CircularProgress
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { IProject } from '../../db';
import { useActiveProject } from '../../hooks/useActiveProject';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from 'react';
import { SaveTemplateDialog } from './SaveTemplateDialog';

export const ProjectManager = () => {
  // --- Hooks ---
  const allProjects = useLiveQuery(() => db.projects.toArray(), []);
  const activeProjectId = useActiveProject();

  // --- State ---
  const [renameProject, setRenameProject] = useState<IProject | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteProject, setDeleteProject] = useState<IProject | null>(null);
  const [templateProject, setTemplateProject] = useState<IProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // 2. ADD isDeleting state

  // --- Handlers ---
  const handleSwitchProject = async (projectId: number) => {
    try {
      await db.settings.update(1, { activeProjectId: projectId });
    } catch (error) {
      console.error('Failed to switch project:', error);
    }
  };

  // --- Rename Logic ---
  const openRenameDialog = (project: IProject) => {
    setRenameProject(project);
    setNewName(project.name);
  };
  const closeRenameDialog = () => {
    setRenameProject(null);
    setNewName('');
  };
  const handleConfirmRename = async () => {
    if (!renameProject || !newName) return;
    try {
      await db.projects.update(renameProject.id!, { name: newName });
    } catch (error) {
      console.error('Failed to rename project:', error);
    }
    closeRenameDialog();
  };

  // --- Delete Logic ---
  const openDeleteDialog = (project: IProject) => {
    setDeleteProject(project);
  };
  const closeDeleteDialog = () => {
    if (isDeleting) return; // Prevent close
    setDeleteProject(null);
  };
  
  // 3. UPDATE handleConfirmDelete
  const handleConfirmDelete = async () => {
    if (!deleteProject) return;

    setIsDeleting(true); // 4. SET deleting state
    try {
      await db.transaction(
        'rw',
        db.projects,
        db.observations,
        db.tracklog,
        db.settings,
        async () => {
          await db.observations
            .where('projectId')
            .equals(deleteProject.id!)
            .delete();
          await db.tracklog
            .where('projectId')
            .equals(deleteProject.id!)
            .delete();
          await db.projects.delete(deleteProject.id!);
          if (activeProjectId === deleteProject.id) {
            await db.settings.update(1, { activeProjectId: null });
          }
        }
      );
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false); // 5. UNSET deleting state
      closeDeleteDialog();
    }
  };

  // --- Save Template Logic ---
  const openTemplateDialog = (project: IProject) => {
    setTemplateProject(project);
  };
  const closeTemplateDialog = () => {
    setTemplateProject(null);
  };
  const handleConfirmSaveTemplate = async (templateName: string) => {
    if (!templateProject) return;
    try {
      await db.templates.add({
        name: templateName,
        customFields: templateProject.customFields,
      });
    } catch (error) {
      console.error('Failed to save template:', error);
    }
    closeTemplateDialog();
  };

  // --- Render ---
  if (!allProjects) {
    return <Typography>Loading projects...</Typography>;
  }

  return (
    <Box>
      <List>
        {allProjects.map((project) => (
          <ListItem
            key={project.id}
            secondaryAction={
              <>
                <Tooltip title="Save as Template">
                  <IconButton
                    edge="end"
                    aria-label="save as template"
                    onClick={() => openTemplateDialog(project)}
                  >
                    <SaveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rename">
                  <IconButton
                    edge="end"
                    aria-label="rename"
                    onClick={() => openRenameDialog(project)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <span>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => openDeleteDialog(project)}
                      disabled={allProjects.length <= 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            }
          >
            <ListItemIcon>
              <IconButton
                edge="start"
                onClick={() => handleSwitchProject(project.id!)}
              >
                {activeProjectId === project.id ? (
                  <RadioButtonCheckedIcon color="primary" />
                ) : (
                  <RadioButtonUncheckedIcon />
                )}
              </IconButton>
            </ListItemIcon>
            <ListItemText
              primary={project.name}
              secondary={project.createdAt.toLocaleDateString()}
            />
          </ListItem>
        ))}
      </List>

      {/* Rename Dialog */}
      <Dialog open={!!renameProject} onClose={closeRenameDialog}>
        <DialogTitle>Rename Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="standard"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRenameDialog}>Cancel</Button>
          <Button onClick={handleConfirmRename} disabled={!newName}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      {/* 6. UPDATE Dialog Actions */}
      <Dialog open={!!deleteProject} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "
            {deleteProject?.name}"?
          </DialogContentText>
          <DialogContentText color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            This will also delete ALL observations and tracklogs
            in this project. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={!!templateProject}
        onClose={closeTemplateDialog}
        onSave={handleConfirmSaveTemplate}
        suggestedName={templateProject?.name || ''}
      />
    </Box>
  );
};