import nextPlugin from '@next/eslint-plugin-next';

import pluginJs from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import pluginCheckFile from 'eslint-plugin-check-file';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  // Ignore Patterns
  {
    ignores: ['**/.next/*', '**/dist/*', '**/node_modules/*'],
  },

  // Base Configuration
  {
    files: ['**/{packages,services/**}/**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true },
      ],
    },
  },

  // Backend (Node.js)
  {
    files: ['**/{packages,services/backend/**}/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      'check-file': pluginCheckFile,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/!(*-migration).{js,ts,jsx,tsx}': 'CAMEL_CASE' },
        { ignoreMiddleExtensions: true },
      ],
    },
  },

  // Frontend (Browser) - Next.js specific
  {
    files: ['**/services/frontend/**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      'react-refresh/only-export-components': 'warn',
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Prettier Integration
  prettier,
];
