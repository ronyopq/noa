'use client'

// components/ThemeWrapper.tsx — client-side MUI theme provider + CssBaseline.
// The theme object contains functions (breakpoints, etc.), so it is created and
// held inside the client boundary; server components never pass it across RSC.
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@/theme/theme'

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
