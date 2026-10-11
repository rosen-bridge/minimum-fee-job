'use client';

import React, { ReactNode } from 'react';

import { Stack } from '@/components/ui/base';

type AppProps = {
  header?: ReactNode;
  children: ReactNode;
};

const App = ({ children, header }: AppProps) => {
  return (
    <Stack>
      {header}
      <div>{children}</div>
    </Stack>
  );
};

export default App;
