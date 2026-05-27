import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://localhost:2113', // پورت بکاند داتنت شما در ویژوال استودیو
          changeOrigin: true,
          secure: false // غیرفعال کردن بررسی سختگیرانه گواهی SSL محلی (برای رفع خطای https محلی)
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/.vs/**',
          '**/bin/**',
          '**/obj/**',
          '**/.git/**',
          '**/node_modules/**',
          '**/*.vsidx'
        ]
      },
    },
  };
});
