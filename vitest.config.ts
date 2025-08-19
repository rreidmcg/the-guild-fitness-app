import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // <-- gives you describe/it/expect globally
    environment: 'node',
    coverage: { reporter: ['text', 'lcov'] },
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
