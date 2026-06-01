import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Medication & Health Tracker',
        short_name: 'MedTracker',
        description: 'Track medications, appointments, and health metrics',
        theme_color: '#0d9488',
        background_color: '#f0fdfa',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
