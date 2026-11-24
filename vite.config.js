import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleGeminiRequest } from './api/gemini.js'

const devGeminiProxyPlugin = (env) => ({
  name: 'dev-gemini-proxy',
  configureServer(server) {
    server.middlewares.use('/api/gemini', async (req, res, next) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        return
      }
      try {
        await handleGeminiRequest(req, res, env)
      } catch (err) {
        next(err)
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), devGeminiProxyPlugin(env)],
  }
})
