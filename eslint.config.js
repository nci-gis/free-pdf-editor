import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Allow unused vars with underscore prefix (e.g., _event)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.svelte'],
    rules: {
      // Allow @html for trusted SVG icons
      'svelte/no-at-html-tags': 'off',
      // Allow DOM manipulation for Text component cursor handling
      'svelte/no-dom-manipulating': 'warn',
      // Warn instead of error for missing each keys
      'svelte/require-each-key': 'warn',
    },
  },
  {
    ignores: [
      'src/vendor/**',
      'public/**',
      'node_modules/**',
      '*.config.js',
      '*.config.cjs',
    ],
  },
];
