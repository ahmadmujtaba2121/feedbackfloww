import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(env.VITE_FIREBASE_DATABASE_URL)
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 5000,
      assetsDir: 'assets',
      rollupOptions: {
        external: ['canvas'],
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
              'firebase/database',
              'react-colorful',
              'react-color',
              'react-beautiful-dnd',
              'react-big-calendar',
              'framer-motion',
              'react-pdf',
              'react-hot-toast',
              'react-icons',
              'react-helmet-async',
              'react-hotkeys-hook',
              'roughjs',
              'canvas-confetti',
              'date-fns',
              'emoji-picker-react',
              'lodash'
            ]
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name.endsWith('.woff2')) {
              return 'fonts/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
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
        'react-colorful',
        'react-color',
        'react-beautiful-dnd',
        'react-big-calendar',
        'framer-motion',
        'react-pdf',
        'react-hot-toast',
        'react-icons',
        'react-helmet-async',
        'react-hotkeys-hook',
        'roughjs',
        'canvas-confetti',
        'date-fns',
        'emoji-picker-react',
        'lodash'
      ],
      exclude: ['canvas']
    }
  };
});
