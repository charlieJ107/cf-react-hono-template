/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // One project .env at the repo root; only VITE_-prefixed variables reach client code.
  envDir: '..',
  server: {
    // Fixed: the OIDC redirect URI registered at the identity provider includes this port.
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    name: 'frontend',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
