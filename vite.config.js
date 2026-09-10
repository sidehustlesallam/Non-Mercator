import { defineConfig } from 'vite';

export default defineConfig({
  base: '/non-mercator/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
  },
});
