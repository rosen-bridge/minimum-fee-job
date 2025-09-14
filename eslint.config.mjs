import pluginJs from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
  // Ignore Patterns
  {
    ignores: ['**/dist/*', '**/node_modules/*'],
  },

  // Base Configuration
  {
    files: ['**/{packages,services/backend}/**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      import: importPlugin,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,

      // --- Import Sorting ---
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true, 
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',   
            'external',  
            'internal',  
            'parent',    
            'sibling',   
            'index',     
          ],
          pathGroups: [
            {
              pattern: 'components/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'assets/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['internal'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
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
