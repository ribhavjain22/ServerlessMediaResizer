import { sentryVitePlugin } from "@sentry/vite-plugin";
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    vueJsx(), 
    vueDevTools(),
    {
      name: 'wasm',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          next();
        });
      }
    },
    sentryVitePlugin({
      org: "nerdnextdoor",
      project: "pixelperfect"
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: {
    sourcemap: true,
    target: 'esnext',
    assetsInclude: ['**/*.wasm'],
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url))
      },
      external: ['/gs.js'],
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info.pop();
          const name = info.join('.');
          
          if (name === 'gs' && (ext === 'wasm' || ext === 'js')) {
            return `assets/${name}.${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
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