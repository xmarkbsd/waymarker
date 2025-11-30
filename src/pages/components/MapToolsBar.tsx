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

interface MapToolsBarProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
}

// Distance between two lat/lon points (meters)
const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// Approximate polygon area (sq meters) using planar shoelace + rough conversion
const polygonAreaMeters = (coords: [number, number][]) => {
  if (coords.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % coords.length];
    sum += x1 * y2 - x2 * y1;
  }
  const raw = Math.abs(sum / 2);
  // Very rough scaling factor: degrees to meters (latitude ~111.139km)
  return raw * 111139 * 111139;
};

export const MapToolsBar: React.FC<MapToolsBarProps> = ({ filters, onFiltersChange }) => {
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

  let measureResult: string | null = null;
  if (finished && points.length > 1) {
    if (measureMode === 'line') {
      let dist = 0;
      for (let i = 1; i < points.length; i++) {
        dist += haversine(points[i - 1] as [number, number], points[i] as [number, number]);
      }
      measureResult = dist < 1000 ? `${dist.toFixed(1)} m` : `${(dist / 1000).toFixed(2)} km`;
    } else if (measureMode === 'polygon' && points.length > 2) {
      const area = polygonAreaMeters(points as [number, number][]);
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
          gap: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          backdropFilter: 'blur(4px)',
          borderRadius: 2,
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          padding: '6px 10px',
          overflowX: 'auto',
          '& .MuiIconButton-root': { color: '#fff' },
          '& .MuiIconButton-root.active': { color: '#4fc3f7' },
          '& .MuiIconButton-root.Mui-disabled': { color: 'rgba(255,255,255,0.35)' },
        }}
      >
        <Tooltip title="Filters">
          <IconButton
            size="small"
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
            size="small"
            onClick={() => startMeasure('line')}
            className={measureMode === 'line' ? 'active' : undefined}
            aria-label="Measure distance"
          >
            <TimelineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Measure area">
          <IconButton
            size="small"
            onClick={() => startMeasure('polygon')}
            className={measureMode === 'polygon' ? 'active' : undefined}
            aria-label="Measure area"
          >
            <LayersIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear measurement">
          <IconButton
            size="small"
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
