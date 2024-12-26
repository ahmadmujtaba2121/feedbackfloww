import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      external: ['canvas-confetti'],
      output: {
        globals: {
          'canvas-confetti': 'confetti'
        },
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'react-hotkeys-hook'
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
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/database',
      'react-hotkeys-hook',
      'canvas-confetti'
    ]
  },
  server: {
    port: 3000,
    host: true
  }
});
