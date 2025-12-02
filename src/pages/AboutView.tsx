// src/pages/AboutView.tsx

import { Box, Typography, Paper, Link } from '@mui/material';

export const AboutView = () => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        About WayMarker
      </Typography>

      {/* App Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          WayMarker
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          A field observation and mapping application designed for environmental monitoring,
          survey work, and research activities. WayMarker helps you capture georeferenced
          observations with custom data fields, track your movements, and export data in
          standard formats for analysis and reporting.
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Built with modern web technologies to work seamlessly on desktop and mobile devices,
          with offline map support for remote field work.
        </Typography>
      </Paper>

      {/* Attribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Map Data & Services Attribution
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
          OpenStreetMap
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          © <Link href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</Link> contributors.
          Map data licensed under the Open Data Commons Open Database License (ODbL).
          OpenStreetMap is a collaborative project to create a free editable map of the world.
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
          ESRI Satellite Imagery
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP,
          and the GIS User Community. ESRI provides high-resolution satellite and aerial imagery used for
          detailed visualization and analysis.
        </Typography>

        <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
          Leaflet
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          © <Link href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</Link>.
          Leaflet is an open-source JavaScript library for mobile-friendly interactive maps, created by
          Vladimir Agafonkin and maintained by a community of contributors.
        </Typography>

        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 3 }}>
          For more information about data usage and attribution requirements, visit{' '}
          <Link href="https://developers.arcgis.com/documentation/esri-and-data-attribution/" target="_blank" rel="noopener noreferrer">
            ESRI Attribution Guidelines
          </Link> and{' '}
          <Link href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap Copyright
          </Link>.
        </Typography>
      </Paper>

      {/* Open Source & Licenses */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Open Source Technologies
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          WayMarker is built with open-source technologies including:
        </Typography>
        <Typography variant="body2" color="textSecondary" component="div">
          • React - UI library<br />
          • TypeScript - Type-safe JavaScript<br />
          • Material-UI - Component library<br />
          • Leaflet - Interactive maps<br />
          • Dexie.js - IndexedDB wrapper for offline storage<br />
          • Turf.js - Geospatial analysis<br />
          • JSZip - Archive creation<br />
        </Typography>
      </Paper>

      {/* Version Info */}
      <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          WayMarker Field Application
        </Typography>
      </Paper>
    </Box>
  );
};
