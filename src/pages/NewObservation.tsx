// src/pages/NewObservation.tsx

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Button,
  Container,
  Dialog,
  IconButton,
  Toolbar,
  Typography,
  Slide,
  TextField,
  Box,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { GpsStatusView } from './components/GpsStatusView';
import { useGeolocation } from '../hooks/useGeolocation';
import type { ICustomFieldValues, IObservation } from '../db';
import { db } from '../db';
import { CustomFieldRenderer } from './components/CustomFieldRenderer';
import { useActiveProject } from '../hooks/useActiveProject'; // 1. IMPORT new hook

const Transition = React.forwardRef(
  function Transition(
    props: TransitionProps & {
      children: React.ReactElement;
    },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

interface NewObservationProps {
  open: boolean;
  handleClose: () => void;
}

export const NewObservation = ({ open, handleClose }: NewObservationProps) => {
  const [watch, setWatch] = useState(false);
  const geoState = useGeolocation(watch);
  const activeProjectId = useActiveProject(); // 2. GET active project ID

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [customFieldValues, setCustomFieldValues] =
    useState<ICustomFieldValues>({});

  useEffect(() => {
    if (open) {
      setWatch(true);
    } else {
      setWatch(false);
      setName('');
      setNotes('');
      setCustomFieldValues({});
    }
  }, [open]);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // 3. UPDATE Save logic
  const isSaveDisabled =
    geoState.status !== 'Locked' || activeProjectId === null;

  const handleSave = async () => {
    if (isSaveDisabled) {
      console.error('Save attempted with no GPS lock or no active project.');
      return;
    }

    // 4. ADD projectId to the new observation object
    const newObservation: IObservation = {
      projectId: activeProjectId!, // This is now safe
      createdAt: new Date(),
      coreFields: {
        name: name || 'Untitled Observation',
        notes: notes,
      },
      customFieldValues: customFieldValues,
      geometry: {
        latitude: geoState.latitude!,
        longitude: geoState.longitude!,
        altitude: geoState.altitude,
        accuracy: geoState.accuracy!,
      },
    };

    try {
      await db.observations.add(newObservation);
      handleClose();
    } catch (error) {
      console.error('Failed to save observation:', error);
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            New Observation
          </Typography>
          <Button
            autoFocus
            color="inherit"
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        sx={{
          py: 2,
          overflowY: 'auto',
          height: '100%',
        }}
      >
        <GpsStatusView />

        <Box component="form" noValidate autoComplete="off">
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Core Fields
          </Typography>
          <TextField
            required
            fullWidth
            margin="normal"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Custom Fields
          </Typography>
          <CustomFieldRenderer
            values={customFieldValues}
            onChange={handleCustomFieldChange}
          />
        </Box>
      </Container>
    </Dialog>
  );
};