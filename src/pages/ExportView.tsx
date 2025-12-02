// src/pages/ExportView.tsx

import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { useActiveProject } from '../hooks/useActiveProject';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';

interface ExportViewProps {
  onImportClick: () => void;
  onExportKML: () => void;
  onExportCSV: () => void;
  onExportTextReport: () => void;
  onExportZip: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  onImportClick,
  onExportKML,
  onExportCSV,
  onExportTextReport,
  onExportZip,
}) => {
  const activeProjectId = useActiveProject();
  const project = useLiveQuery(
    () => (activeProjectId ? db.projects.get(activeProjectId) : undefined),
    [activeProjectId]
  );

  const hasProject = !!activeProjectId;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Import & Export
      </Typography>

      {!hasProject && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fff3cd' }}>
          <Typography variant="body2" color="text.secondary">
            Select or create a project in Settings to use import and export features.
          </Typography>
        </Paper>
      )}

      {/* Import Section */}
      <Paper sx={{ p: 3, mb: 3, opacity: hasProject ? 1 : 0.5 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon /> Import
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Import KML
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Import observations from a KML file created by WayMarker or other mapping applications.
          The observations will be added to the currently active project. Custom field data will be
          preserved if the field definitions match.
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={onImportClick}
          disabled={!hasProject}
        >
          Import KML File
        </Button>
      </Paper>

      {/* Export Section */}
      <Paper sx={{ p: 3, mb: 3, opacity: hasProject ? 1 : 0.5 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon /> Export
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* KML Export */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Export KML Only
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export all observations as a KML file for use in Google Earth, QGIS, ArcGIS, or other GIS software.
            Includes observation names, descriptions, timestamps, coordinates, and all custom field data.
            Photo references are included as filenames only (not the actual image files).
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExportKML}
            disabled={!hasProject}
          >
            Export KML
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* CSV Export */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Export CSV Only
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export all observations as a CSV (comma-separated values) file for use in spreadsheets,
            databases, or statistical analysis tools. Each row represents one observation with all
            core fields and custom fields as columns. Ideal for data analysis in Excel, R, Python, etc.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExportCSV}
            disabled={!hasProject}
          >
            Export CSV
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Text Report Export */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Export Text Report
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Export all observations as a formatted plain text report. Each observation is presented
            in a human-readable format with all details clearly labeled. Perfect for printing,
            archiving, or including in written reports and documentation.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExportTextReport}
            disabled={!hasProject}
          >
            Export Text Report
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Zip Bundle Export */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Export Zip Bundle
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a complete archive containing the KML file and all associated photo files.
            The photos are organized in a "photos" folder within the zip. This is the most complete
            export option and is ideal for sharing complete field data with colleagues, backing up
            projects with photos, or submitting data packages to clients or organizations.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={onExportZip}
            disabled={!hasProject}
          >
            Export Zip Bundle...
          </Button>
        </Box>
      </Paper>

      {/* Active Project Info */}
      {project && (
        <Paper sx={{ p: 2, backgroundColor: '#e3f2fd' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Active Project:</strong> {project.name}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
