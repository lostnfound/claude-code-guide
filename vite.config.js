import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        guide: resolve(__dirname, 'src/pages/guide.html'),
        about: resolve(__dirname, 'src/pages/about.html'),
        faq: resolve(__dirname, 'src/pages/faq.html')
      }
    }
  }
});