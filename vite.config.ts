/* eslint-env node */
import { defaultUploadLocation as defaultUploadLocation_, defineConfig } from 'viteburner';
import { resolve } from 'path';

function defaultUploadLocation(file: string) {
  return defaultUploadLocation_(file).replace(/\.tsx$/, '.jsx');
}

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
          return [{ server: 'home', filename: defaultUploadLocation(file) }];
        },
      },
      {
        pattern: 'src/**/*.{script,txt}',
      },
    ],
    sourcemap: 'inline',
  },
});
