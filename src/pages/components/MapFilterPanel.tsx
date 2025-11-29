// src/pages/components/MapFilterPanel.tsx

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Collapse,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useActiveProject } from '../../hooks/useActiveProject';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';

export interface MapFilters {
  enabled: boolean;
  dateRange: 'all' | 'week' | 'month';
  customFieldId: string | null;
  customFieldValue: string | null;
}

interface MapFilterPanelProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
}

export const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const activeProjectId = useActiveProject();

  const project = useLiveQuery(
    () => (activeProjectId ? db.projects.get(activeProjectId) : undefined),
    [activeProjectId]
  );

  const handleToggleFilters = () => {
    setExpanded(!expanded);
  };

  const handleEnableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, enabled: event.target.checked });
  };

  const handleDateRangeChange = (event: any) => {
    onFiltersChange({
      ...filters,
      dateRange: event.target.value as 'all' | 'week' | 'month',
    });
  };

  const handleCustomFieldChange = (event: any) => {
    onFiltersChange({
      ...filters,
      customFieldId: event.target.value as string,
      customFieldValue: null, // Reset value when field changes
    });
  };

  const handleCustomFieldValueChange = (event: any) => {
    onFiltersChange({
      ...filters,
      customFieldValue: event.target.value as string,
    });
  };

  const selectedField = project?.customFields.find(
    (f) => f.id === filters.customFieldId
  );

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 401, // Above layer control (400)
        maxWidth: 320,
      }}
    >
      <Card sx={{ boxShadow: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#eeeeee' },
          }}
          onClick={handleToggleFilters}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Filter
            </Typography>
            {filters.enabled && (
              <Box
                sx={{
                  backgroundColor: '#ff6f00',
                  color: 'white',
                  borderRadius: '12px',
                  px: 0.75,
                  py: 0.25,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                ON
              </Box>
            )}
          </Box>
          <ExpandMoreIcon
            fontSize="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        </Box>

        <Collapse in={expanded} timeout="auto">
          <CardContent sx={{ pt: 1.5, pb: 1.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={filters.enabled}
                  onChange={handleEnableChange}
                />
              }
              label={
                <Typography variant="body2">Enable Filters</Typography>
              }
              sx={{ mb: 2, display: 'flex' }}
            />

            {filters.enabled && (
              <>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    label="Date Range"
                    onChange={handleDateRangeChange}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="week">Last 7 Days</MenuItem>
                    <MenuItem value="month">Last 30 Days</MenuItem>
                  </Select>
                </FormControl>

                {project && project.customFields.length > 0 && (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Filter by Field</InputLabel>
                      <Select
                        value={filters.customFieldId || ''}
                        label="Filter by Field"
                        onChange={handleCustomFieldChange}
                      >
                        <MenuItem value="">None</MenuItem>
                        {project.customFields.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedField && (
                      <FormControl fullWidth size="small">
                        <InputLabel>{selectedField.label}</InputLabel>
                        <Select
                          value={filters.customFieldValue || ''}
                          label={selectedField.label}
                          onChange={handleCustomFieldValueChange}
                        >
                          <MenuItem value="">All Values</MenuItem>
                          {selectedField.options?.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Collapse>
      </Card>
    </Box>
  );
};
