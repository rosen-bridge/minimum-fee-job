'use client';

import { PropsWithChildren } from 'react';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/queries';

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <AppRouterCacheProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppRouterCacheProvider>
  );
};
