import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 3000,
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.jsx'],
      strictRequires: true,
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'react-hotkeys-hook',
            'react-icons'
          ],
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase/database'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react-hotkeys-hook',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/database'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  }
});
