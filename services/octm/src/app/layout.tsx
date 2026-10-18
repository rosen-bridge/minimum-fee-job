import type { Metadata } from 'next';
import { PropsWithChildren } from 'react';

import { Providers } from '@/components';

export const metadata: Metadata = {
  title: 'Rosen OCTM',
  description: 'Rosen Bridge OCTM App',
};

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
