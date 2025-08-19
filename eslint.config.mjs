/* Flat ESLint config */
import js from '@eslint/js';
import ts from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import pluginSecurity from 'eslint-plugin-security';
import pluginUnicorn from 'eslint-plugin-unicorn';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  { ignores: ['node_modules', 'dist', 'build', '.next', 'out', 'coverage', '**/*.d.ts'] },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        module: 'writable',
        require: 'writable',
        __dirname: 'readonly',
      },
      parser: ts.parser,
      parserOptions: {
      },
    },
    plugins: {
      import: pluginImport,
      n: pluginN,
      promise: pluginPromise,
      security: pluginSecurity,
      unicorn: pluginUnicorn,
      '@typescript-eslint': ts.plugin,
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      ...pluginImport.configs.recommended.rules,
      ...pluginPromise.configs.recommended.rules,
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
