// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx'; // Use named import
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme.ts'; // Import our theme

// Import Roboto font for Material Design [cite: 270]
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Provide the theme to the entire application */}
    <ThemeProvider theme={theme}>
      {/* CssBaseline applies the theme's background color */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);