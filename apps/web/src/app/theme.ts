import { createTheme } from '@mui/material/styles';

export const momentGridTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B57D0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#495E8C',
    },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#191C1E',
      secondary: '#5F6368',
    },
    divider: '#C3C6D6',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roboto Flex", "Noto Sans SC", system-ui, sans-serif',
    h1: {
      fontFamily: '"Noto Sans SC", sans-serif',
      fontWeight: 700,
      fontSize: 'clamp(2rem, 6vw, 3.5rem)',
      lineHeight: 1.12,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '"Noto Sans SC", sans-serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 999,
          paddingInline: 24,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 1px 3px rgba(31, 31, 31, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
  },
});
