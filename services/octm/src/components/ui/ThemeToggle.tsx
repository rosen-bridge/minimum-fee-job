'use client';

import { useThemeMode } from '../providers';
import { Button } from './base';

export const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={toggleMode}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} theme`}
    >
      {mode === 'light' ? 'Dark mode' : 'Light mode'}
    </Button>
  );
};
