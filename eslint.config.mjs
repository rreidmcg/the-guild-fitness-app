/* Flat ESLint config (no typed rules for now) */
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
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: ts.parser,
      parserOptions: {
        // No project service yet → avoid typed rules for now
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        module: 'writable',
        require: 'writable',
        __dirname: 'readonly',
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
      'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
    },
    rules: {
      ...js.configs.recommended.rules,
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'unicorn/filename-case': 'off',
      ...ts.configs.recommended.rules,
      ...pluginImport.configs.recommended.rules,
      ...pluginPromise.configs.recommended.rules,

      // Reasonable defaults
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        },
      ],

      // Disable typed rules for now
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
{
  files: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  languageOptions: {
    globals: {
      describe: 'readonly',
      it: 'readonly',
      test: 'readonly',
      expect: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
    },
  },
},
];
