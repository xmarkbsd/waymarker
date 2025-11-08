// src/App.tsx

import React, { useState, useRef } from 'react';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';

// Import Icons
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';

// Import the views
import { ObservationListView } from './pages/ObservationListView';
import { MapView } from './pages/MapView';
import { SettingsView } from './pages/SettingsView'; // <-- FIX: Was 'pagesa'
import { NewObservation } from './pages/NewObservation';
import { EditObservation } from './pages/EditObservation';
import { LoadingModal } from './pages/components/LoadingModal';
import { useTracklog } from './hooks/useTracklog';
import { useActiveProject } from './hooks/useActiveProject';

// Import Services
import { generateKML } from './services/kmlGenerator';
import { parseKML } from './services/kmlParser';

type View = 'list' | 'map' | 'settings';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export const App = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const [isRecording, setIsRecording] = useState(false);
  const [isNewObservationOpen, setIsNewObservationOpen] = useState(false);
  
  const [editingObservationId, setEditingObservationId] = useState<number | null>(
    null
  );

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProjectId = useActiveProject();
  useTracklog(isRecording, activeProjectId);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // --- Export Logic ---
  const handleExport = async () => {
    handleMenuClose();
    if (!activeProjectId) {
      setSnackbar({ open: true, message: 'No active project to export.', severity: 'error' });
      return;
    }
    try {
      const kmlData = await generateKML(); 
      const blob = new Blob([kmlData], { type: 'application/vnd.google-earth.kml+xml' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      link.download = `waymarker_export_${timestamp}.kml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSnackbar({ open: true, message: 'Export successful.', severity: 'success' });
    } catch (error) {
      console.error('Failed to export KML:', error);
      setSnackbar({ open: true, message: 'Export failed.', severity: 'error' });
    }
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    handleMenuClose();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const fileText = await file.text();

    try {
      const { obsCount, trackCount } = await parseKML(fileText);
      setSnackbar({
        open: true,
        message: `Import successful: ${obsCount} obs, ${trackCount} track points.`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to import KML:', error);
      setSnackbar({ open: true, message: 'Import failed. File is not valid.', severity: 'error' });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleEditObservation = (id: number) => {
    setEditingObservationId(id);
  };

  const renderView = () => {
    switch (currentView) {
      case 'map':
        return <MapView />;
      case 'settings':
        return <SettingsView />;
      case 'list':
      default:
        return <ObservationListView onEdit={handleEditObservation} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Waymarker
          </Typography>

          <IconButton
            color="inherit"
            onClick={() => setIsRecording(!isRecording)}
            disabled={!activeProjectId}
          >
            {isRecording ? <StopIcon sx={{ color: 'red' }} /> : <FiberManualRecordIcon />}
          </IconButton>

          <IconButton color="inherit" onClick={handleMenu}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleImportClick}>Import KML</MenuItem>
            <MenuItem onClick={handleExport} disabled={!activeProjectId}>
              Export KML
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          py: 2,
        }}
      >
        {renderView()}
      </Container>

      <Fab
        color="primary"
        aria-label="add observation"
        sx={{
          position: 'absolute',
          bottom: 82,
          right: 16,
        }}
        onClick={() => setIsNewObservationOpen(true)}
        disabled={!activeProjectId}
      >
        <AddLocationIcon />
      </Fab>

      <Paper
        sx={{ position: 'sticky', bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={currentView}
          onChange={(_event, newValue) => {
            setCurrentView(newValue as View);
          }}
        >
          <BottomNavigationAction
            label="List"
            value="list"
            icon={<ListIcon />}
          />
          <BottomNavigationAction
            label="Map"
            value="map"
            icon={<MapIcon />}
          />
          <BottomNavigationAction
            label="Settings"
            value="settings"
            icon={<SettingsIcon />}
          />
        </BottomNavigation>
      </Paper>

      {/* --- Modals & Feedback --- */}

      <NewObservation
        open={isNewObservationOpen}
        handleClose={() => setIsNewObservationOpen(false)}
      />

      <EditObservation
        open={editingObservationId !== null}
        observationId={editingObservationId}
        handleClose={() => setEditingObservationId(null)}
      />

      <LoadingModal open={isLoading} message="Importing data..." />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".kml"
        style={{ display: 'none' }}
      />
    </Box>
  );
};