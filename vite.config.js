import { sentryVitePlugin } from "@sentry/vite-plugin";
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools(), sentryVitePlugin({
    org: "nerdnextdoor",
    project: "pixelperfect"
  })],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: {
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      // Ensure gs.js and gs.wasm are copied to the build output
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        gs: fileURLToPath(new URL('./public/gs.js', import.meta.url))
      }
    }
  },

  // Configure WASM file handling
  optimizeDeps: {
    exclude: ['gs.wasm']
  },

  // Properly serve WASM files in development
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
})