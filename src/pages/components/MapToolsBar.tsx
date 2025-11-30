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
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import TimelineIcon from '@mui/icons-material/Timeline';
import LayersIcon from '@mui/icons-material/Layers';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { useLiveQuery } from 'dexie-react-hooks';
import { useActiveProject } from '../../hooks/useActiveProject';
import { db } from '../../db';
import { Polyline, Polygon, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { MapFilters } from './MapFilterPanel';
import UndoIcon from '@mui/icons-material/Undo';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import * as turf from '@turf/turf';

interface MapToolsBarProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
}

// Helpers using turf.js for accurate geodesic distance and area
const turfLineDistanceMeters = (coords: [number, number][]) => {
  if (coords.length < 2) return 0;
  const line = turf.lineString(coords.map(([lng, lat]) => [lng, lat]));
  return turf.length(line, { units: 'meters' });
};
const turfPolygonAreaMeters = (coords: [number, number][]) => {
  if (coords.length < 3) return 0;
  const poly = turf.polygon([[...coords.map(([lng, lat]) => [lng, lat]), coords[0] ? [coords[0][1], coords[0][0]] : []]]);
  return Math.max(0, turf.area(poly));
};

export const MapToolsBar: React.FC<MapToolsBarProps> = ({ filters, onFiltersChange }) => {
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

  // Filter popover
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

  useMapEvents({
    click(e) {
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

  let measureResult: string | null = null;
  if (finished && points.length > 1) {
    if (measureMode === 'line') {
      const dist = turfLineDistanceMeters(points as [number, number][]);
      measureResult = dist < 1000 ? `${dist.toFixed(1)} m` : `${(dist / 1000).toFixed(2)} km`;
    } else if (measureMode === 'polygon' && points.length > 2) {
      const area = turfPolygonAreaMeters(points as [number, number][]);
      measureResult = area < 10000 ? `${area.toFixed(1)} m²` : `${(area / 10000).toFixed(2)} ha`;
    }
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
        <Tooltip title="Measure distance">
          <IconButton
            size={isSmall ? 'medium' : 'small'}
            onClick={() => startMeasure('line')}
            className={measureMode === 'line' ? 'active' : undefined}
            aria-label="Measure distance"
          >
            <TimelineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Measure area">
          <IconButton
            size={isSmall ? 'medium' : 'small'}
            onClick={() => startMeasure('polygon')}
            className={measureMode === 'polygon' ? 'active' : undefined}
            aria-label="Measure area"
          >
            <LayersIcon />
          </IconButton>
        </Tooltip>
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
            disabled={measureMode === 'none'}
            aria-label="Clear measurement"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
        {measureMode !== 'none' && (
          <Typography variant="body2" sx={{ ml: 1 }}>
            {finished && measureResult
              ? measureResult
              : `${points.length} point${points.length === 1 ? '' : 's'}`}
            {!finished && measureMode !== 'none' && points.length > 0 && ' (double‑tap to finish)'}
          </Typography>
        )}
      </Box>

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
    </>
  );
};
