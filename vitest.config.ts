import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    server: { 
      deps: { 
        // Inline convex-test for migration tests (when they work)
        inline: ["convex-test"] 
      } 
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // Exclude convex-test integration tests due to import.meta.glob compatibility issues
      // These tests are preserved for future use when compatibility is resolved
      // Alternative testing: unit tests (*.unit.test.ts) and integration scripts
      '**/convex/migrations/**/*.test.ts'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        'dist/',
        'convex/_generated/',
        // Exclude disabled migration tests from coverage
        'convex/migrations/**/*.test.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@convex': path.resolve(__dirname, './convex'),
    },
  },
});