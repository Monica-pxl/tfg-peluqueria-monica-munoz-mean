import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuración para recursos públicos
  publicDir: 'public',
  server: {
    port: 5174
  }
})
