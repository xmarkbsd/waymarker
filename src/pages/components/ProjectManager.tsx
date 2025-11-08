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
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { IProject } from '../../db';
import { useActiveProject } from '../../hooks/useActiveProject';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';

export const ProjectManager = () => {
  // --- Hooks ---
  const allProjects = useLiveQuery(() => db.projects.toArray(), []);
  const activeProjectId = useActiveProject();

  // State for Rename dialog
  const [renameProject, setRenameProject] = useState<IProject | null>(null);
  const [newName, setNewName] = useState('');

  // State for Delete dialog
  const [deleteProject, setDeleteProject] = useState<IProject | null>(null);

  // --- Handlers ---
  const handleSwitchProject = async (projectId: number) => {
    try {
      // Update the activeProjectId in the settings document
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
    setDeleteProject(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProject) return;

    try {
      // Use a transaction to delete all project data
      await db.transaction(
        'rw',
        db.projects,
        db.observations,
        db.tracklog,
        db.settings,
        async () => {
          // 1. Delete all observations for this project
          await db.observations
            .where('projectId')
            .equals(deleteProject.id!)
            .delete();

          // 2. Delete all tracklog points for this project
          await db.tracklog
            .where('projectId')
            .equals(deleteProject.id!)
            .delete();

          // 3. Delete the project itself
          await db.projects.delete(deleteProject.id!);

          // 4. Check if the deleted project was the active one
          if (activeProjectId === deleteProject.id) {
            // It was. Set active project to null.
            await db.settings.update(1, { activeProjectId: null });
          }
        }
      );
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
    closeDeleteDialog();
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
                <IconButton
                  edge="end"
                  aria-label="rename"
                  onClick={() => openRenameDialog(project)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => openDeleteDialog(project)}
                  // Prevent deleting the last project
                  disabled={allProjects.length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
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
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};