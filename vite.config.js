import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        guide: resolve(__dirname, 'src/guide.html'),
        about: resolve(__dirname, 'src/about.html'),
        faq: resolve(__dirname, 'src/faq.html')
      }
    }
  }
});