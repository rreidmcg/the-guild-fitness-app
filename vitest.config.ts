import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,                       // enable describe/it/expect
    environment: 'node',
    coverage: { reporter: ['text', 'lcov'] },
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'], // find tests anywhere in repo
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc}.config.*',
      'client/**' // keep client app out of unit test run for now
    ],
  },
});
