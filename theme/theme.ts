import { createTheme } from '@mui/material/styles'

const restaurantColors = {
  primary: '#e65100',
  primaryDark: '#b23c00',
  primaryLight: '#ff8b00',
  secondary: '#2e7d32',
  accent: '#ff9800',
  bdt: '#e65100',
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: restaurantColors.primary,
      dark: restaurantColors.primaryDark,
      light: restaurantColors.primaryLight,
      contrastText: '#ffffff',
    },
    secondary: { main: restaurantColors.secondary, contrastText: '#ffffff' },
    background: { default: '#f8f5f2', paper: '#ffffff' },
    text: { primary: '#2b2d31', secondary: '#5a5f66', disabled: '#9a9fa5' },
    action: { hover: '#f3f0eb', selected: '#fff4e5' },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  typography: {
    fontFamily:
      "'Hind Siliguri', 'Noto Sans Bengali', 'Bangla Solveig', system-ui, -apple-system, sans-serif",
    h1: { fontWeight: 700, fontSize: '1.9rem' },
    h2: { fontWeight: 700, fontSize: '1.45rem' },
    h3: { fontWeight: 600, fontSize: '1.15rem' },
    h4: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '0.98rem', lineHeight: 1.55 },
    body2: { fontSize: '0.86rem', lineHeight: 1.5 },
  },
  components: {
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 12 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiOutlinedInput: { styleOverrides: { root: { height: '44px' } } },
  },
})

export { theme, restaurantColors }
export default theme
