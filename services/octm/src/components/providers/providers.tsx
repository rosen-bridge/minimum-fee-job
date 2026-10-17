'use client';

import { useState } from 'react';
import type { PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from './theme';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 180_000,
        gcTime: 300_000,
      },
    },
  });

export const Providers = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};
