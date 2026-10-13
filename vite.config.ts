import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), imagetools()],
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: app deploys don't invalidate the libraries.
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
          gsap: ['gsap', '@gsap/react', 'lenis'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
