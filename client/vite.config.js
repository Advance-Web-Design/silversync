import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5173  // Standard Vite port, different from Next.js default
  },
  esbuild: {
    // Remove console statements in production but keep warn and error
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  define: {
    // Ensure environment variables are properly replaced at build time
    'import.meta.env.VITE_VERBOSE_LOGGING': JSON.stringify(process.env.VITE_VERBOSE_LOGGING || 'false'),
  }
}))
