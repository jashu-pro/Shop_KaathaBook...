import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    // Allow requests proxied through Cloudflare quick tunnels (npm run tunnel)
    allowedHosts: ['.trycloudflare.com'],
  },
})

