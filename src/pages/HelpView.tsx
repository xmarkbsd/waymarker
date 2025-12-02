// src/pages/HelpView.tsx

import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const HelpView = () => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Help & User Guide
      </Typography>

      <Paper sx={{ p: 0 }}>
        {/* Getting Started */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Getting Started & Creating Projects</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              WayMarker organizes your observations into <strong>projects</strong>. Each project has its own observations,
              custom fields, and track logs.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Creating Your First Project:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Go to Settings (gear icon in bottom navigation)" />
              </ListItem>
              <ListItem>
                <ListItemText primary='2. In the "Projects" section, click "Add New Project"' />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Enter a project name and optionally define custom fields" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Click Save - your new project becomes active automatically" />
              </ListItem>
            </List>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Switching Projects:</strong> Use the dropdown in Settings to change which project is active.
              All new observations will be saved to the active project.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Adding Observations */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Adding Observations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              GPS-Based Observations (Blue Markers):
            </Typography>
            <Typography variant="body2" paragraph>
              Tap the <strong>+</strong> button in the bottom navigation. Fill in the observation name, description,
              and any custom fields. Your current GPS location is captured automatically. These appear as blue markers on the map.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Map-Placed Observations (Orange Markers):
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Open the Map view" />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Tap the toolbar and select 'Place Observation on Map'" />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Tap anywhere on the map to place a marker" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Fill in the observation form and save" />
              </ListItem>
            </List>
            <Typography variant="body2" paragraph>
              Map-placed observations appear as orange markers.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Moving Existing Observations (Yellow Markers):
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Open the Map view" />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Tap the toolbar and select 'Move Observation'" />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Drag any marker to a new location" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Confirm the move in the dialog" />
              </ListItem>
            </List>
            <Typography variant="body2">
              The original location is saved in the observation's location history. Moved observations appear as yellow markers.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Custom Fields */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Custom Fields Setup</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Custom fields let you capture project-specific data beyond the standard name and description.
              Each project can have its own set of custom fields.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Available Field Types:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Text"
                  secondary="Short text input (e.g., species name, observer initials)"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Number"
                  secondary="Numeric values (e.g., count, measurement, temperature)"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Select (Dropdown)"
                  secondary="Choose from predefined options (e.g., condition: good/fair/poor)"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Photo Reference"
                  secondary="Link to photo files that can be bundled in zip exports"
                />
              </ListItem>
            </List>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              To Add Custom Fields:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Go to Settings and ensure a project is active" />
              </ListItem>
              <ListItem>
                <ListItemText primary='2. In "Custom Fields" section, click "Add Field"' />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Choose field type and configure options" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Save - the field appears in all new and existing observation forms" />
              </ListItem>
            </List>
            <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
              <strong>Note:</strong> Deleting a custom field removes all data for that field from existing observations.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Map Features */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Map Features</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              Map Layers:
            </Typography>
            <Typography variant="body2" paragraph>
              Tap the <strong>layers icon</strong> in the top-right to switch between OpenStreetMap (roads and labels)
              and ESRI Satellite Imagery.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Marker Clustering:
            </Typography>
            <Typography variant="body2" paragraph>
              When zoomed out, nearby markers automatically group into clusters showing the number of observations.
              Zoom in to see individual markers. Clusters split progressively as you zoom.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Marker Colors:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="🔵 Blue: GPS-based observations (captured at your current location)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="🟠 Orange: Map-placed observations (placed by tapping the map)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="🟡 Yellow: User-moved observations (dragged to a new location)" />
              </ListItem>
            </List>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Track Logs:
            </Typography>
            <Typography variant="body2" paragraph>
              Track logs show your movement path with a color gradient (blue at start, green at end).
              Time markers appear every 5 minutes. Toggle track log visibility or clear the current track using
              the toolbar buttons.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Map Tools:
            </Typography>
            <Typography variant="body2">
              Access tools from the bottom toolbar: place observations, move observations, filter by date/field,
              measure distance, toggle track log, and clear track log.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Offline Maps */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Offline Maps Downloading</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Download map tiles for offline use when working in areas with limited or no internet connectivity.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              How to Download:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Go to Settings > Offline Maps" />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Pan and zoom the preview map to the area you need" />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Click 'Download Area' - tiles for zoom levels 13-16 will be saved" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Wait for download to complete (progress bar shows status)" />
              </ListItem>
            </List>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              Downloaded tiles are stored locally on your device. When offline, the map automatically uses cached tiles
              for the downloaded areas.
            </Typography>
            <Typography variant="body2" color="warning.main">
              <strong>Storage:</strong> Downloaded areas can use significant storage space. Use "Clear Offline Cache"
              to free up space when tiles are no longer needed.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Filtering */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Filtering & Searching Observations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Filter observations on the map and in the list view to focus on specific data.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Date Range Filters:
            </Typography>
            <Typography variant="body2" paragraph>
              Open the map toolbar and tap "Filters". Choose to show observations from:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• All time (no filter)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Last 7 days" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Last 30 days" />
              </ListItem>
            </List>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Custom Field Filters:
            </Typography>
            <Typography variant="body2" paragraph>
              If your project has custom fields, you can filter by field values. For example, show only observations
              where "Condition = Good" or "Species = Oak". Select a field and value in the filter panel.
            </Typography>

            <Typography variant="body2" sx={{ mt: 2 }}>
              Filters apply to both the Map view and the Observations list view. Disable filtering to see all observations again.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Export Options */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Export Options</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Export your observations for analysis, reporting, or sharing. Access export options from the
              overflow menu (⋮) in the top-right or from the dedicated Export page.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Available Formats:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="KML"
                  secondary="For GIS software (Google Earth, QGIS, ArcGIS). Includes coordinates and all field data."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="CSV"
                  secondary="For spreadsheets and analysis (Excel, R, Python). Tabular format with one row per observation."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Text Report"
                  secondary="Human-readable format for printing or documentation. Each observation formatted with labels."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Zip Bundle"
                  secondary="Complete package with KML file and all photo files. Best for sharing complete field data."
                />
              </ListItem>
            </List>
            <Typography variant="body2" sx={{ mt: 2 }}>
              All exports include the currently active project's observations. Switch projects in Settings before
              exporting if you need data from a different project.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Track Log Features */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Track Log Features</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Track logs record your movement path during field work. Useful for documenting survey routes,
              calculating distances, and visualizing coverage.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Recording a Track Log:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Ensure a project is active" />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Tap the record button (⚫) in the top toolbar" />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Your device screen stays awake and GPS tracks your position" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Tap the stop button (⏹️) when finished" />
              </ListItem>
            </List>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              While recording, an orange warning banner reminds you that tracking is active and uses battery power.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Viewing Track Logs:
            </Typography>
            <Typography variant="body2" paragraph>
              Track logs appear on the map as colored polylines (blue at start, transitioning to green at end).
              Time markers show when each segment was recorded. Tap the expand button to see statistics:
              total distance, duration, and average speed.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Managing Track Logs:
            </Typography>
            <Typography variant="body2">
              Use the map toolbar to toggle track log visibility or clear the current track. Track logs are
              stored per project and persist until manually cleared.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
};
