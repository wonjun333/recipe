import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const sslKeyPath = env.SSL_KEY_PATH ? path.resolve(__dirname, env.SSL_KEY_PATH) : ''
  const sslCertPath = env.SSL_CERT_PATH ? path.resolve(__dirname, env.SSL_CERT_PATH) : ''

  console.log('[vite] mode:', mode)
  console.log('[vite] cwd:', process.cwd())
  console.log('[vite] SSL_KEY_PATH env:', env.SSL_KEY_PATH)
  console.log('[vite] SSL_CERT_PATH env:', env.SSL_CERT_PATH)
  console.log('[vite] resolved key:', sslKeyPath, '→ exists:', sslKeyPath ? fs.existsSync(sslKeyPath) : false)
  console.log('[vite] resolved cert:', sslCertPath, '→ exists:', sslCertPath ? fs.existsSync(sslCertPath) : false)

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined
  if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    }
  }

  return {
    plugins: [vue()],
    base: process.env.NODE_ENV === 'development'
      ? (process.env.VITE_DEV_BASE ?? './')
      : './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 8282,
      https: httpsOptions,
      proxy: {
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 8282,
      https: httpsOptions,
      proxy: {
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
  }
})
