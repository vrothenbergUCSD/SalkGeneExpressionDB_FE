import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const defaultConfig = {
  // Not necessary?
  optimizeDeps: { include: ['firebase/app', 'firebase/auth', 'firebase/firestore/lite'] },

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

// export default ({ mode }) => {
//   // Load app-level env vars to node-level env vars.
//   process.env = {...process.env, ...loadEnv(mode, process.cwd())};

//   return defineConfig({
//     // To access env vars here use process.env.TEST_VAR
//   });
// }

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {

  // process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };



  return {
    ...defaultConfig
  }
  // const isDev = mode === 'development'
  // return {
  //   ...defaultConfig,
  //   server: {
  //     proxy: {
  //       '/api': {
  //         target: isDev ? 'http://127.0.0.1:8000' : 'https://geneexpressiondbbe-w5oumbwxcq-uw.a.run.app',
  //         changeOrigin: isDev,
  //         secure: !isDev,
  //         rewrite: (path) => path.replace(/^\/api/, ""),
  //       }
  //     }
  //   }
  // }


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

