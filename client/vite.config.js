import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'react-helmet-async',
            'react-icons',
            'react-hot-toast',
            'react-beautiful-dnd',
            'react-big-calendar',
            'react-color',
            'react-colorful',
            'react-hotkeys-hook',
            'react-syntax-highlighter'
          ],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          utils: ['date-fns', 'lodash', 'roughjs', 'canvas-confetti', 'framer-motion']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
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
      'react-helmet-async',
      'react-icons',
      'react-hot-toast',
      'react-beautiful-dnd',
      'react-big-calendar',
      'react-color',
      'react-colorful',
      'react-hotkeys-hook',
      'react-syntax-highlighter',
      'date-fns',
      'lodash',
      'roughjs',
      'canvas-confetti',
      'framer-motion'
    ]
  },
  preview: {
    port: 3000,
    host: true
  }
});
