/* eslint-env node */
import { defaultUploadLocation, defineConfig } from 'viteburner';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '/src': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
  },
  viteburner: {
    watch: [
      {
        pattern: 'src/**/*.{js,ts,jsx,tsx}',
        transform: true,
        location: (file) => {
          const match = file.match(/^src\/servers\/([^\/]+)\/(.*)$/);

          if (match) {
            return [{ server: match[1], filename: defaultUploadLocation(match[2]) }];
          }

          return [{ server: 'home', filename: defaultUploadLocation(file) }];
        },
      },
      {
        pattern: 'src/**/*.{script,txt}',
        location: (file) => {
          const match = file.match(/^src\/servers\/([^\/]+)\/(.*)$/);

          if (match) {
            return [{ server: match[1], filename: match[2] }];
          }

          return null;
        },
      },
    ],
    sourcemap: 'inline',
  },
});
