// src/pages/components/MapToolsBar.tsx
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Popover,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import TimelineIcon from '@mui/icons-material/Timeline';
import LayersIcon from '@mui/icons-material/Layers';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import RouteIcon from '@mui/icons-material/Route';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { useLiveQuery } from 'dexie-react-hooks';
import { useActiveProject } from '../../hooks/useActiveProject';
import { db } from '../../db';
import { Polyline, Polygon, useMapEvents, Marker } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import type { MapFilters } from '../../types/mapFilters';
import UndoIcon from '@mui/icons-material/Undo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import * as turf from '@turf/turf';

interface MapToolsBarProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  onPlaceObservation?: (lat: number, lng: number) => void;
  moveMode?: boolean;
  onMoveModeChange?: (enabled: boolean) => void;
  showTrackLog?: boolean;
  onToggleTrackLog?: (show: boolean) => void;
}

// Helpers using turf.js for accurate geodesic distance and area
const turfLineDistanceMeters = (coords: [number, number][]) => {
  if (coords.length < 2) return 0;
  // Stored as [lat, lng]; turf expects [lng, lat]
  const line = turf.lineString(coords.map(([lat, lng]) => [lng, lat]));
  const km = turf.length(line, { units: 'kilometers' });
  return km * 1000;
};
const turfPolygonAreaMeters = (coords: [number, number][]) => {
  if (coords.length < 3) return 0;
  const ring = coords.map(([lat, lng]) => [lng, lat]);
  // Close ring
  if (ring.length > 0) {
    ring.push([...ring[0]]);
  }
  const poly = turf.polygon([ring]);
  return turf.area(poly);
};

export const MapToolsBar: React.FC<MapToolsBarProps> = ({ filters, onFiltersChange, onPlaceObservation, moveMode, onMoveModeChange, showTrackLog, onToggleTrackLog }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const activeProjectId = useActiveProject();
  const project = useLiveQuery(
    () => (activeProjectId ? db.projects.get(activeProjectId) : undefined),
    [activeProjectId]
  );

  // Measurement state
  const [measureMode, setMeasureMode] = useState<'none' | 'line' | 'polygon'>('none');
  const [points, setPoints] = useState<LatLngExpression[]>([]);
  const [finished, setFinished] = useState(false);

  // Placement mode state
  const [placementMode, setPlacementMode] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Move mode handlers
  const toggleMoveMode = () => {
    if (onMoveModeChange) {
      onMoveModeChange(!moveMode);
      // Disable other modes when move mode is activated
      if (!moveMode) {
        setPlacementMode(false);
        setMeasureMode('none');
        setPoints([]);
        setFinished(false);
      }
    }
  };

  // Track log handlers
  const [clearTrackLogDialogOpen, setClearTrackLogDialogOpen] = useState(false);

  // More Tools menu
  const [moreToolsAnchor, setMoreToolsAnchor] = useState<HTMLElement | null>(null);
  const moreToolsOpen = Boolean(moreToolsAnchor);
  
  const openMoreTools = (event: React.MouseEvent<HTMLElement>) => {
    setMoreToolsAnchor(event.currentTarget);
  };
  
  const closeMoreTools = () => {
    setMoreToolsAnchor(null);
  };

  const handleClearTrackLog = async () => {
    if (!activeProjectId) return;
    await db.tracklog
      .where('projectId')
      .equals(activeProjectId)
      .delete();
    setClearTrackLogDialogOpen(false);
  };

  // Filter popover
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

  useMapEvents({
    click(e) {
      // Handle placement mode
      if (placementMode) {
        setPendingLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setConfirmDialogOpen(true);
        return;
      }
      // Handle measurement mode
      if (measureMode === 'none' || finished) return;
      setPoints((p) => [...p, [e.latlng.lat, e.latlng.lng]]);
    },
    dblclick() {
      if (measureMode === 'none' || finished) return;
      setFinished(true);
    },
  });

  const startMeasure = (mode: 'line' | 'polygon') => {
    setMeasureMode(mode);
    setPoints([]);
    setFinished(false);
  };
  const clearMeasure = () => {
    setMeasureMode('none');
    setPoints([]);
    setFinished(false);
  };
  const undoLastPoint = () => {
    setPoints((p) => (p.length > 0 ? p.slice(0, -1) : p));
  };

  const togglePlacementMode = () => {
    setPlacementMode(!placementMode);
    if (placementMode) {
      // Exiting placement mode
      setPendingLocation(null);
    }
  };

  const handleConfirmPlacement = () => {
    if (pendingLocation && activeProjectId && onPlaceObservation) {
      onPlaceObservation(pendingLocation.lat, pendingLocation.lng);
      setConfirmDialogOpen(false);
      setPendingLocation(null);
      setPlacementMode(false);
    }
  };

  const handleCancelPlacement = () => {
    setConfirmDialogOpen(false);
    setPendingLocation(null);
  };

  // Live measurement preview (distance / area) even before finishing
  let liveResult: string | null = null;
  if (measureMode === 'line' && points.length > 1) {
    const dist = turfLineDistanceMeters(points as [number, number][]);
    liveResult = dist < 1000 ? `${dist.toFixed(1)} m` : `${(dist / 1000).toFixed(2)} km`;
  } else if (measureMode === 'polygon' && points.length > 2) {
    const area = turfPolygonAreaMeters(points as [number, number][]);
    liveResult = area < 10000 ? `${area.toFixed(1)} m²` : `${(area / 10000).toFixed(2)} ha`;
  }

  const openFilter = (e: React.MouseEvent<HTMLElement>) => {
    setFilterAnchor(e.currentTarget);
  };
  const closeFilter = () => setFilterAnchor(null);
  const filterOpen = Boolean(filterAnchor);

  // Filter handlers
  const toggleFiltersEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, enabled: e.target.checked });
  };
  const handleDateRangeChange = (e: any) => {
    onFiltersChange({ ...filters, dateRange: e.target.value });
  };
  const handleFieldChange = (e: any) => {
    onFiltersChange({ ...filters, customFieldId: e.target.value || null, customFieldValue: null });
  };
  const handleFieldValueChange = (e: any) => {
    onFiltersChange({ ...filters, customFieldValue: e.target.value || null });
  };

  const selectedField = project?.customFields.find((f) => f.id === filters.customFieldId);

  // Orange marker icon for placement preview
  const orangeIcon = L.divIcon({
    className: 'orange-marker',
    html: `<div style="background-color: #ff9800; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 24],
  });

  return (
    <>
      {/* Measurement graphics */}
      {measureMode !== 'none' && points.length > 0 && (
        measureMode === 'line' ? (
          <Polyline positions={points} color="blue" weight={4} />
        ) : (
          <Polygon positions={points} color="green" weight={3} fillOpacity={0.25} />
        )
      )}

      {/* Placement preview marker */}
      {pendingLocation && (
        <Marker position={[pendingLocation.lat, pendingLocation.lng]} icon={orangeIcon} />
      )}

      {/* Bottom toolbar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          zIndex: 410,
          display: 'flex',
          alignItems: 'center',
          gap: isSmall ? 0.5 : 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          backdropFilter: 'blur(4px)',
          borderRadius: 2,
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          padding: isSmall ? '8px 12px' : '6px 10px',
          overflowX: 'auto',
          '& .MuiIconButton-root': { color: '#fff' },
          '& .MuiIconButton-root.active': { color: '#4fc3f7' },
          '& .MuiIconButton-root.Mui-disabled': { color: 'rgba(255,255,255,0.35)' },
        }}
      >
        <Tooltip title="Filters">
          <IconButton
            size={isSmall ? 'medium' : 'small'}
            onClick={openFilter}
            className={filters.enabled ? 'active' : undefined}
            aria-label="Filters"
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Add observation from map">
          <IconButton
            size={isSmall ? 'medium' : 'small'}
            onClick={togglePlacementMode}
            className={placementMode ? 'active' : undefined}
            aria-label="Add observation from map"
          >
            <AddLocationIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={showTrackLog ? "Hide track log" : "Show track log"}>
          <IconButton
            size={isSmall ? 'medium' : 'small'}
            onClick={() => onToggleTrackLog?.(!showTrackLog)}
            className={showTrackLog ? 'active' : undefined}
            aria-label="Toggle track log"
          >
            <RouteIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="More tools">
          <IconButton
            size={isSmall ? 'medium' : 'small'}
            onClick={openMoreTools}
            className={moreToolsOpen ? 'active' : undefined}
            aria-label="More tools"
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        {/* Measurement mode active controls */}
        {measureMode !== 'none' && (
          <>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Undo last point">
              <IconButton
                size={isSmall ? 'medium' : 'small'}
                onClick={undoLastPoint}
                disabled={points.length === 0 || finished}
                aria-label="Undo last point"
          >
            <UndoIcon />
          </IconButton>
        </Tooltip>
            <Tooltip title="Clear measurement">
              <IconButton
                size={isSmall ? 'medium' : 'small'}
                onClick={clearMeasure}
                aria-label="Clear measurement"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {finished
                ? liveResult || `${points.length} point${points.length === 1 ? '' : 's'}`
                : `${points.length} point${points.length === 1 ? '' : 's'}`}
              {liveResult && !finished && ` • ${liveResult}`}
              {!finished && points.length > 0 && ' (double‑tap to finish)'}
            </Typography>
          </>
        )}
      </Box>

      {/* More Tools Menu */}
      <Popover
        open={moreToolsOpen}
        anchorEl={moreToolsAnchor}
        onClose={closeMoreTools}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600 }}>
            More Tools
          </Typography>
          
          <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary' }}>
            Observations
          </Typography>
          <List dense>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  toggleMoveMode();
                  closeMoreTools();
                }}
                selected={moveMode}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <OpenWithIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Move Observations" secondary="Drag markers to reposition" />
              </ListItemButton>
            </ListItem>
          </List>

          <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', mt: 1 }}>
            Track Log
          </Typography>
          <List dense>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setClearTrackLogDialogOpen(true);
                  closeMoreTools();
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DeleteSweepIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Clear Track Log" secondary="Delete all recorded points" />
              </ListItemButton>
            </ListItem>
          </List>

          <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', mt: 1 }}>
            Measurements
          </Typography>
          <List dense>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  startMeasure('line');
                  closeMoreTools();
                }}
                selected={measureMode === 'line'}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <TimelineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Measure Distance" secondary="Tap points to measure path" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  startMeasure('polygon');
                  closeMoreTools();
                }}
                selected={measureMode === 'polygon'}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LayersIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Measure Area" secondary="Tap points to measure region" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Popover>

      {/* Filter popover */}
      <Popover
        open={filterOpen}
        anchorEl={filterAnchor}
        onClose={closeFilter}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, width: 260 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Filters</Typography>
          <IconButton size="small" onClick={closeFilter}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <FormControlLabel
          control={<Switch size="small" checked={filters.enabled} onChange={toggleFiltersEnabled} />}
          label={<Typography variant="body2">Enable</Typography>}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Date Range</InputLabel>
            <Select value={filters.dateRange} label="Date Range" onChange={handleDateRangeChange}>
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
            </Select>
        </FormControl>
        {project && project.customFields.length > 0 && (
          <>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Field</InputLabel>
              <Select
                value={filters.customFieldId || ''}
                label="Field"
                onChange={handleFieldChange}
              >
                <MenuItem value="">None</MenuItem>
                {project.customFields.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedField && (
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>{selectedField.label}</InputLabel>
                <Select
                  value={filters.customFieldValue || ''}
                  label={selectedField.label}
                  onChange={handleFieldValueChange}
                >
                  <MenuItem value="">All Values</MenuItem>
                  {selectedField.options?.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        )}
      </Popover>

      {/* Placement mode indicator banner */}
      {placementMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 410,
            backgroundColor: 'rgba(255, 152, 0, 0.95)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Tap map to place new observation
          </Typography>
        </Box>
      )}

      {/* Move mode indicator banner */}
      {moveMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 410,
            backgroundColor: 'rgba(255, 193, 7, 0.95)',
            color: '#000',
            padding: '8px 16px',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Drag markers to move observations
          </Typography>
        </Box>
      )}

      {/* Placement confirmation dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelPlacement}>
        <DialogTitle>Add Observation Here?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Create a new observation at this location?
            <br />
            Coordinates: {pendingLocation?.lat.toFixed(6)}°, {pendingLocation?.lng.toFixed(6)}°
            <br />
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Note: This will be marked as a map-placed location (estimated).
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPlacement}>Cancel</Button>
          <Button onClick={handleConfirmPlacement} variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear track log confirmation dialog */}
      <Dialog open={clearTrackLogDialogOpen} onClose={() => setClearTrackLogDialogOpen(false)}>
        <DialogTitle>Clear Track Log?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete all track log points for this project? This cannot be undone.
            <br />
            <br />
            <Typography variant="caption" color="warning.main">
              Note: This only affects the track log, not your observations.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearTrackLogDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearTrackLog} color="error" variant="contained" autoFocus>
            Clear Track Log
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
