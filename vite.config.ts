import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One HTML file output: JS and CSS are inlined into dist/index.html.
// public/ (logo.png for OG) is copied next to it.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  define: { 'process.env': {} },
  build: { target: 'es2020', chunkSizeWarningLimit: 4000 },
});
