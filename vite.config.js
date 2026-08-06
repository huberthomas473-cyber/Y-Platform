import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// In production /api/deliberate runs as a Vercel serverless function.
// In dev, this middleware mounts the exact same handler on the Vite server,
// so `npm run dev` exercises the real code path with no drift.
function devApiPlugin() {
  return {
    name: 'dev-api-deliberate',
    configureServer(server) {
      server.middlewares.use('/api/deliberate', (req, res) => {
        server
          .ssrLoadModule('/api/deliberate.js')
          .then((mod) => mod.default(req, res))
          .catch((err) => {
            console.error(err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'dev_server_error', message: err.message }))
          })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose server-side keys from .env to the dev API handler via process.env.
  // (Vite only auto-exposes VITE_-prefixed vars, and only to the client.)
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), devApiPlugin()],
    server: { port: Number(process.env.PORT) || 5173 },
  }
})
