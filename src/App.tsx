// src/App.tsx

import React, { useState, useRef } from 'react';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  Divider,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  Tooltip,
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
import { SettingsView } from './pages/SettingsView';
import { NewObservation } from './pages/NewObservation';
import { EditObservation } from './pages/EditObservation';
import { LoadingModal } from './pages/components/LoadingModal';
import { ZipExportDialog } from './pages/components/ZipExportDialog';
import { useTracklog } from './hooks/useTracklog';
import { useActiveProject } from './hooks/useActiveProject';

// Import Services
import { generateKML } from './services/kmlGenerator';
import { generateCSV } from './services/csvGenerator';
import { generateTextReport } from './services/textReportGenerator';
import { parseKML } from './services/kmlParser';
import { db } from './db';
import type { IProject } from './db';

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
  const [mapPlacedCoords, setMapPlacedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [moveMode, setMoveMode] = useState(false);
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

  const [isZipExportOpen, setIsZipExportOpen] = useState(false);
  const [projectToExport, setProjectToExport] = useState<IProject | null>(null);

  const activeProjectId = useActiveProject();
  useTracklog(isRecording, activeProjectId);

  const handlePlaceObservation = (lat: number, lng: number) => {
    setMapPlacedCoords({ lat, lng });
    setIsNewObservationOpen(true);
  };

  const handleCloseNewObservation = () => {
    setIsNewObservationOpen(false);
    setMapPlacedCoords(null);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // --- Export Logic ---
  const handleExportKMLOnly = async () => {
    handleMenuClose();
    if (!activeProjectId) {
      setSnackbar({ open: true, message: 'No active project to export.', severity: 'error' });
      return;
    }
    try {
      const kmlData = await generateKML(activeProjectId); 
      const blob = new Blob([kmlData], { type: 'application/vnd.google-earth.kml+xml' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      link.download = `waymarker_export_${timestamp}.kml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSnackbar({ open: true, message: 'KML Export successful.', severity: 'success' });
    } catch (error) {
      console.error('Failed to export KML:', error);
      setSnackbar({ open: true, message: 'Export failed.', severity: 'error' });
    }
  };

  const handleZipExport = async () => {
    handleMenuClose();
    if (!activeProjectId) {
      setSnackbar({ open: true, message: 'No active project to export.', severity: 'error' });
      return;
    }
    const project = await db.projects.get(activeProjectId);
    if (project) {
      setProjectToExport(project);
      setIsZipExportOpen(true);
    }
  };

  const handleExportCSV = async () => {
    handleMenuClose();
    if (!activeProjectId) {
      setSnackbar({ open: true, message: 'No active project to export.', severity: 'error' });
      return;
    }
    try {
      const csvData = await generateCSV(activeProjectId);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      link.download = `waymarker_export_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSnackbar({ open: true, message: 'CSV Export successful.', severity: 'success' });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setSnackbar({ open: true, message: 'CSV export failed.', severity: 'error' });
    }
  };

  const handleExportTextReport = async () => {
    handleMenuClose();
    if (!activeProjectId) {
      setSnackbar({ open: true, message: 'No active project to export.', severity: 'error' });
      return;
    }
    try {
      const reportData = await generateTextReport(activeProjectId);
      const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      link.download = `waymarker_report_${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSnackbar({ open: true, message: 'Text Report Export successful.', severity: 'success' });
    } catch (error) {
      console.error('Failed to export text report:', error);
      setSnackbar({ open: true, message: 'Text report export failed.', severity: 'error' });
    }
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    handleMenuClose();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProjectId) return; // 1. ADD guard for activeProjectId

    setIsLoading(true);
    const fileText = await file.text();

    try {
      // 2. PASS activeProjectId to the parser
      const { obsCount, trackCount } = await parseKML(fileText, activeProjectId);
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
        return (
          <MapView 
            onPlaceObservation={handlePlaceObservation}
            moveMode={moveMode}
            onMoveModeChange={setMoveMode}
          />
        );
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

          <Tooltip
            title={
              isRecording
                ? 'Recording tracklog (increased battery usage)'
                : activeProjectId
                  ? 'Start recording tracklog'
                  : 'Select a project to start recording'
            }
          >
            <span>
              <IconButton
                color="inherit"
                onClick={() => setIsRecording(!isRecording)}
                disabled={!activeProjectId}
              >
                {isRecording ? <StopIcon sx={{ color: 'red' }} /> : <FiberManualRecordIcon />}
              </IconButton>
            </span>
          </Tooltip>

          <IconButton color="inherit" onClick={handleMenu}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
          >
            {/* Import section */}
            <MenuItem onClick={handleImportClick} disabled={!activeProjectId}>
              Import KML
            </MenuItem>
            <Divider />
            
            {/* Export formats section */}
            <MenuItem onClick={handleExportKMLOnly} disabled={!activeProjectId}>
              Export KML Only
            </MenuItem>
            <MenuItem onClick={handleExportCSV} disabled={!activeProjectId}>
              Export CSV Only
            </MenuItem>
            <MenuItem onClick={handleExportTextReport} disabled={!activeProjectId}>
              Export Text Report
            </MenuItem>
            <Divider />
            
            {/* Bundle export section */}
            <MenuItem onClick={handleZipExport} disabled={!activeProjectId}>
              Export Zip Bundle...
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {isRecording && (
        <Alert
          severity="warning"
          sx={{
            margin: 0,
            borderRadius: 0,
            backgroundColor: '#ff6f00',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <strong>🔴 Recording Tracklog</strong> - Screen is kept awake to maintain GPS tracking.
          This uses increased battery power. Tap the recording button to stop.
        </Alert>
      )}

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
            aria-label="Map"
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
        handleClose={handleCloseNewObservation}
        mapPlacedCoords={mapPlacedCoords}
      />

      <EditObservation
        open={editingObservationId !== null}
        observationId={editingObservationId}
        handleClose={() => setEditingObservationId(null)}
        setSnackbar={setSnackbar}
      />

      <ZipExportDialog
        open={isZipExportOpen}
        onClose={() => setIsZipExportOpen(false)}
        project={projectToExport}
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