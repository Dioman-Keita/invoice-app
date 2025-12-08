import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for Electron
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, '../common')
    }
  }
})
