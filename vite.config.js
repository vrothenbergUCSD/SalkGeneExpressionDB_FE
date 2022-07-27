import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const defaultConfig = {
  build: {
    outDir: "public",
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    const isDev = mode === 'development'
    return {
      ...defaultConfig,
      server: {
        proxy: {
          '/api': {
            target: isDev ? 'http://127.0.0.1:8000' : 'https://geneexpressiondbbe-w5oumbwxcq-uw.a.run.app',
            changeOrigin: isDev,
            secure: !isDev,
            rewrite: (path) => path.replace(/^\/api/, ""),
          }
        }
      }
    }
  } else {
    return defaultConfig
  }

  // server: {
  //   proxy: {
  //     "/api": {
  //       // target: "https://geneexpressiondbbe-w5oumbwxcq-uw.a.run.app",
  //       target: "http://127.0.0.1:8000",
  //       changeOrigin: true,
  //       secure: false,
  //       rewrite: (path) => path.replace(/^\/api/, ""),
  //     },
  //   },
  // },



})

