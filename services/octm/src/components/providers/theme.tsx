'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as Provider, createTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

type ThemeModeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'dark' ? '#84adff' : '#175cd3' },
          background:
            mode === 'dark'
              ? { default: '#101828', paper: '#1d2939' }
              : { default: '#f4f6f8', paper: '#ffffff' },
        },
        typography: {
          fontFamily: '"Inter", "Segoe UI", sans-serif',
        },
      }),
    [mode],
  );
  const contextValue = useMemo(
    () => ({
      mode,
      toggleMode: () =>
        setMode((currentMode) => (currentMode === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <Provider theme={theme}>
        <CssBaseline />
        {children}
      </Provider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = (): ThemeModeContextValue => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};
