import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const defaultConfig = {
  // Not necessary?
  optimizeDeps: { include: ['firebase/app', 'firebase/auth', 'firebase/firestore'] },

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

  return {
    ...defaultConfig
  }

})

