import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '.lighthouseci/',
      'research/',
      'plan/',
      '.claude-protocol/',
      '.claude/',
      'media/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  // WCAG 2.2 AA target (decision Q9): markup-level a11y rules on every .astro template.
  ...astro.configs['jsx-a11y-strict'],
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
];
