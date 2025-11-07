// src/pages/components/GpsStatusView.tsx

import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import { useGeolocation } from '../../hooks/useGeolocation';
import type { GeolocationState } from '../../hooks/useGeolocation';

export const GpsStatusView = () => {
  const geoState = useGeolocation(true);

  const renderStatus = (state: GeolocationState) => {
    switch (state.status) {
      case 'Acquiring':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            <Typography>Acquiring location...</Typography>
          </Box>
        );
      case 'Error':
        return <Typography color="error">GPS Error: {state.error}</Typography>;
      case 'Locked':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Latitude
              </Typography>
              <Typography variant="body2">
                {state.latitude?.toFixed(6)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Longitude
              </Typography>
              <Typography variant="body2">
                {state.longitude?.toFixed(6)}
              </Typography>
            </Grid> {/* <-- FIX: Was </Key> */}
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Accuracy
              </Typography>
              <Typography variant="body2">
                {state.accuracy ? `${state.accuracy.toFixed(1)}m` : '...'}
              </Typography>
            </Grid> {/* <-- FIX: Was </Key> */}
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Altitude
              </Typography>
              <Typography variant="body2">
                {state.altitude ? `${state.altitude.toFixed(1)}m` : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        );
    }
  };

  return (
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
        GPS Status
      </Typography>
      {renderStatus(geoState)}
    </Paper>
  );
};