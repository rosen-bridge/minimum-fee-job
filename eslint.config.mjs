import pluginJs from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore Patterns
  {
    ignores: ['**/dist/*', '**/node_modules/**'],
  },

  // Base Configuration
  {
    files: ['packages/**/*.{js,ts}', 'services/backend/*.{js,ts}'],
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
    },
  },

  // Backend (Node.js)
  {
    files: ['services/backend/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Extra Rules
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true },
      ],
    },
  },

  // Prettier Integration
  prettier,
];
