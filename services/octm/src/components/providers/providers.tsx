'use client';

import { useState } from 'react';
import type { PropsWithChildren } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@/components';
import { createQueryClient } from '@/queries/queryClient';

export const Providers = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};
