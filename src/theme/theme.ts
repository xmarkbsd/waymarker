// src/theme/theme.ts

import { createTheme } from '@mui/material/styles';
import { red, grey, blue } from '@mui/material/colors';

/**
 * Creates a theme instance.
 * This theme provides the "professional and familiar" Material Design
 * look and feel required by the PPB[cite: 50].
 *
 * It uses a high-contrast (dark) mode by default to meet the
 * "work for people working outdoors" constraint.
 */
const theme = createTheme({
  palette: {
    // Set 'dark' mode as the default. This provides better
    // high-contrast visibility for outdoor field use.
    mode: 'dark',
    primary: {
      // Use a strong, visible blue for primary actions (buttons, FABs)
      main: blue[300],
    },
    secondary: {
      // Use a neutral grey for secondary elements
      main: grey[500],
    },
    error: {
      // Standard error color
      main: red.A400,
    },
    background: {
      // Use a dark grey for the app background
      default: '#121212',
      // Use a slightly lighter grey for paper elements (cards, menus)
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: grey[500],
    },
  },
  components: {
    // Default all app bars to sit "above" other content
    MuiAppBar: {
      defaultProps: {
        elevation: 0, // A flatter, more modern look
        position: 'sticky',
      },
    },
  },
});

export default theme;