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
import ShareIcon from '@mui/icons-material/Share'; // 1. IMPORT ShareIcon
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { ICustomFieldValues, IProject } from '../db';
import { CustomFieldRenderer } from './components/CustomFieldRenderer';
import type { IPhotoReference } from './components/PhotoReferenceInput';

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
  observationId: number | null;
  open: boolean;
  handleClose: () => void;
  // 2. ADD snackbar prop for clipboard fallback
  setSnackbar: (state: { open: boolean; message: string; severity: 'success' | 'error' }) => void;
}

// Helper
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
  setSnackbar, // 3. ACCEPT snackbar prop
}: EditObservationProps) => {
  // 1. Fetch the observation
  const observation = useLiveQuery(
    () => (observationId ? db.observations.get(observationId) : undefined),
    [observationId]
  );
  
  // 4. FETCH the project to get custom field labels
  const project = useLiveQuery(
    () => (observation ? db.projects.get(observation.projectId) : undefined),
    [observation]
  ) as IProject | undefined;

  // 2. Form state
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [customFieldValues, setCustomFieldValues] =
    useState<ICustomFieldValues>({});

  // 3. Populate form
  useEffect(() => {
    if (observation) {
      setName(observation.coreFields.name);
      setNotes(observation.coreFields.notes);
      setCustomFieldValues(observation.customFieldValues);
    } else {
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
      handleClose();
    } catch (error) {
      console.error('Failed to update observation:', error);
    }
  };

  // 5. IMPLEMENT Share logic
  const handleShare = async () => {
    if (!observation || !project) return;

    // A. Build the text summary
    let summary = `Waymarker Observation: ${observation.coreFields.name}\n`;
    summary += `Coordinates: ${observation.geometry.latitude.toFixed(6)}, ${observation.geometry.longitude.toFixed(6)}\n`;
    summary += `Timestamp: ${observation.createdAt.toLocaleString()}\n`;
    summary += '---\n';
    if (observation.coreFields.notes) {
      summary += `Notes:\n${observation.coreFields.notes}\n---\n`;
    }

    // B. Add custom fields
    summary += 'Custom Fields:\n';
    const fieldMap = new Map(project.customFields.map(f => [f.id, f.label]));
    let customCount = 0;
    for (const [fieldId, value] of Object.entries(observation.customFieldValues)) {
      const label = fieldMap.get(fieldId);
      if (label && value) {
        customCount++;
        let displayValue = value;
        if (typeof value === 'object' && value.name) {
          displayValue = (value as IPhotoReference).name;
        }
        summary += `${label}: ${displayValue}\n`;
      }
    }
    if (customCount === 0) {
      summary += '(None)\n';
    }

    // C. Attempt to use Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Waymarker: ${observation.coreFields.name}`,
          text: summary,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // D. Fallback to clipboard
      try {
        await navigator.clipboard.writeText(summary);
        setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
      } catch (error) {
        console.error('Clipboard write failed:', error);
        setSnackbar({ open: true, message: 'Failed to copy to clipboard', severity: 'error' });
      }
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
            Edit Observation
          </Typography>
          {/* 6. ADD Share Button */}
          <IconButton
            color="inherit"
            onClick={handleShare}
            disabled={!observation || !project}
          >
            <ShareIcon />
          </IconButton>
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
        {/* Saved GPS data */}
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

        {/* Form Fields */}
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