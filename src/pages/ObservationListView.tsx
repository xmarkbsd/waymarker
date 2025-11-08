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
  CircularProgress,
  TextField,
} from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { IObservation } from '../db';
import { ObservationListItem } from './components/ObservationListItem';
import ExploreIcon from '@mui/icons-material/Explore';
import { useState } from 'react';
import { useActiveProject } from '../hooks/useActiveProject';
import Dexie from 'dexie';

interface ObservationListViewProps {
  onEdit: (id: number) => void;
}

export const ObservationListView = ({ onEdit }: ObservationListViewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedObs, setSelectedObs] = useState<IObservation | null>(null);
  const activeProjectId = useActiveProject();
  
  const [searchTerm, setSearchTerm] = useState('');

  const observations = useLiveQuery(
    () => {
      if (!activeProjectId) return [];

      const collection = db.observations
        .where('[projectId+createdAt]')
        .between(
          [activeProjectId, Dexie.minKey],
          [activeProjectId, Dexie.maxKey] // <-- FIX: Was DexDax
        );

      if (searchTerm) {
        return collection
          .reverse()
          .filter((obs) =>
            obs.coreFields.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .toArray();
      }

      return collection.reverse().toArray();
    },
    [activeProjectId, searchTerm]
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

  if (!observations || !activeProjectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasNoObservations = !observations || observations.length === 0;
  const isSearching = searchTerm.length > 0;

  return (
    <>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search observations by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      {hasNoObservations ? (
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
          <Typography variant="h6">
            {isSearching ? 'No results found' : 'No observations yet'}
          </Typography>
          <Typography>
            {isSearching
              ? 'Try a different search term.'
              : "Tap the '+' button to capture your first observation."}
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', pt: 0 }}>
          {observations.map((obs) => (
            <ObservationListItem
              key={obs.id}
              observation={obs}
              onDelete={() => openDeleteDialog(obs)}
              onEdit={() => onEdit(obs.id!)}
            />
          ))}
        </List>
      )}

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