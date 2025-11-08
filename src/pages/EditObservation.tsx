// src/pages/EditObservation.tsx

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
  Paper,
  Grid,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
// FIX: Removed unused 'IObservation' type
import type { ICustomFieldValues } from '../db';
import { CustomFieldRenderer } from './components/CustomFieldRenderer';

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

interface EditObservationProps {
  observationId: number | null; // The ID of the obs to edit
  open: boolean;
  handleClose: () => void;
}

// Helper to display saved GPS data
const GpsDataItem = ({
  title,
  value,
}: {
  title: string;
  value: string | number | null | undefined;
}) => (
  <Grid item xs={6} sm={3}>
    <Typography variant="caption" color="textSecondary">
      {title}
    </Typography>
    <Typography variant="body2">{value != null ? value : '...'}</Typography>
  </Grid>
);

export const EditObservation = ({
  observationId,
  open,
  handleClose,
}: EditObservationProps) => {
  // 1. Fetch the observation from the DB
  const observation = useLiveQuery(
    () => (observationId ? db.observations.get(observationId) : undefined),
    [observationId]
  );

  // 2. Form state
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [customFieldValues, setCustomFieldValues] =
    useState<ICustomFieldValues>({});

  // 3. Populate form when observation data loads
  useEffect(() => {
    if (observation) {
      setName(observation.coreFields.name);
      setNotes(observation.coreFields.notes);
      setCustomFieldValues(observation.customFieldValues);
    } else {
      // Reset form if dialog is closed or obs is not found
      setName('');
      setNotes('');
      setCustomFieldValues({});
    }
  }, [observation]);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // 4. Implement Update (Save) logic
  const handleSave = async () => {
    if (!observationId) return;

    try {
      await db.observations.update(observationId, {
        coreFields: {
          name: name,
          notes: notes,
        },
        customFieldValues: customFieldValues,
      });
      handleClose(); // Close dialog on success
    } catch (error) {
      console.error('Failed to update observation:', error);
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      // FIX: Removed non-existent 'onExited' prop
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
            Edit Observation
          </Typography>
          <Button autoFocus color="inherit" onClick={handleSave}>
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
        {/* 5. Display SAVED GPS data (not live) */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Saved Location
          </Typography>
          {observation ? (
            <Grid container spacing={2}>
              <GpsDataItem
                title="Latitude"
                value={observation.geometry.latitude.toFixed(6)}
              />
              <GpsDataItem
                title="Longitude"
                value={observation.geometry.longitude.toFixed(6)}
              />
              <GpsDataItem
                title="Accuracy"
                value={`${observation.geometry.accuracy.toFixed(1)}m`}
              />
              <GpsDataItem
                title="Altitude"
                value={
                  observation.geometry.altitude
                    ? `${observation.geometry.altitude.toFixed(1)}m`
                    : 'N/A'
                }
              />
            </Grid>
          ) : (
            <Typography>Loading location data...</Typography>
          )}
        </Paper>

        {/* 6. Form Fields (same as NewObservation) */}
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