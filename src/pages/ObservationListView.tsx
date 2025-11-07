// src/pages/ObservationListView.tsx

import {
  Box,
  Typography,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
// FIX: Split the value 'db' from the type 'IObservation'
import { db } from '../db';
import type { IObservation } from '../db';
import { ObservationListItem } from './components/ObservationListItem';
import ExploreIcon from '@mui/icons-material/Explore';
import { useState } from 'react';

export const ObservationListView = () => {
  // State for the delete confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedObs, setSelectedObs] = useState<IObservation | null>(null);

  const observations = useLiveQuery(
    () => db.observations.orderBy('createdAt').reverse().toArray(),
    []
  );

  const openDeleteDialog = (observation: IObservation) => {
    setSelectedObs(observation);
    setDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setSelectedObs(null);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedObs?.id) {
      try {
        await db.observations.delete(selectedObs.id);
      } catch (error) {
        console.error('Failed to delete observation:', error);
      }
    }
    closeDeleteDialog();
  };

  if (!observations) {
    return <Typography>Loading observations...</Typography>;
  }

  if (observations.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          color: 'text.secondary',
        }}
      >
        <ExploreIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6">No observations yet</Typography>
        <Typography>
          Tap the '+' button to capture your first observation.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ width: '100%' }}>
        {observations.map((obs) => (
          <ObservationListItem
            key={obs.id}
            observation={obs}
            onDelete={() => openDeleteDialog(obs)}
          />
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Observation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete '
            {selectedObs?.coreFields.name || 'this observation'}
            '? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};