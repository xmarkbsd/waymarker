// --- MUI Components ---
import { Button, Typography, CssBaseline, Box } from '@mui/material'
import AddLocationIcon from '@mui/icons-material/AddLocation'

// --- Leaflet Components ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

function App() {
  // A placeholder position for the map
  const position: [number, number] = [51.505, -0.09]

  return (
    <>
      {/* Resets browser CSS for MUI */}
      <CssBaseline />
      
      <Box sx={{ padding: 2 }}>
        <Typography variant="h4" gutterBottom>
          Waymarker Environment Test
        </Typography>

        <Typography paragraph>
          This test confirms that MUI, MUI Icons, and React-Leaflet are
          all configured.
        </Typography>
        
        {/* Test 1: MUI Button with Icon */}
        <Button
          variant="contained"
          startIcon={<AddLocationIcon />}
          sx={{ marginBottom: 2 }}
        >
          MUI Button (New Observation)
        </Button>

        {/* Test 2: React-Leaflet Map */}
        <Box sx={{ height: '400px', width: '100%' }}>
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                Leaflet is working.
              </Popup>
            </Marker>
          </MapContainer>
        </Box>
      </Box>
    </>
  )
}

export default App