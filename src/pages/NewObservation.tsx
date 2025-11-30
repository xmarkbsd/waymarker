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
  CircularProgress,
  Alert,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { GpsStatusView } from './components/GpsStatusView';
import { useGeolocation } from '../hooks/useGeolocation';
import type { ICustomFieldValues, IObservation } from '../db';
import { db } from '../db';
import { CustomFieldRenderer } from './components/CustomFieldRenderer';
import { useActiveProject } from '../hooks/useActiveProject';

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
  const location = useLocation();
  const mapPlacedLocation = location.state as { lat?: number; lng?: number; source?: string } | null;
  
  const [watch, setWatch] = useState(false);
  const geoState = useGeolocation(watch && !mapPlacedLocation); // Don't watch GPS if map-placed
  const activeProjectId = useActiveProject();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [customFieldValues, setCustomFieldValues] =
    useState<ICustomFieldValues>({});
  
  const [isSaving, setIsSaving] = useState(false);

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

  const hasLocation = mapPlacedLocation?.lat != null || geoState.status === 'Locked';
  const isSaveDisabled = !hasLocation || activeProjectId === null;

  const handleSave = async () => {
    if (isSaveDisabled || isSaving) return; // Prevent double-click

    setIsSaving(true); // 3. SET saving state

    const newObservation: IObservation = {
      projectId: activeProjectId!,
      createdAt: new Date(),
      coreFields: {
        name: name || 'Untitled Observation',
        notes: notes,
      },
      customFieldValues: customFieldValues,
      geometry: mapPlacedLocation?.lat != null ? {
        latitude: mapPlacedLocation.lat,
        longitude: mapPlacedLocation.lng!,
        altitude: null,
        accuracy: 0,
        source: 'map-placed',
      } : {
        latitude: geoState.latitude!,
        longitude: geoState.longitude!,
        altitude: geoState.altitude,
        accuracy: geoState.accuracy!,
        source: 'gps',
      },
      locationHistory: [],
    };

    try {
      await db.observations.add(newObservation);
      handleClose();
    } catch (error) {
      console.error('Failed to save observation:', error);
      // In a real app, show a snackbar error
    } finally {
      setIsSaving(false); // 4. UNSET saving state
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
            disabled={isSaving} // 5. DISABLE back button
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
            // 6. UPDATE button state
            disabled={isSaveDisabled || isSaving}
          >
            {isSaving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Save'
            )}
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
        {mapPlacedLocation?.lat != null ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Map-Placed Location (Estimated)
            </Typography>
            <Typography variant="caption">
              Coordinates: {mapPlacedLocation.lat.toFixed(6)}°, {mapPlacedLocation.lng?.toFixed(6)}°
              <br />
              No GPS altitude or accuracy available.
            </Typography>
          </Alert>
        ) : (
          <GpsStatusView />
        )}

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