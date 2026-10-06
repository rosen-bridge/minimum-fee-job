import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';

import configShared from '../../vitest.shared';

export default mergeConfig(
  configShared,
  defineProject({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      name: 'on-chain-token-map-service',
      include: ['**/*.(test|spec).?(c|m)[jt]s?(x)'],
      environment: 'node',
    },
  }),
);
