import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In production the files in /api run as Vercel serverless functions.
// In dev, this middleware mounts the exact same handlers on the Vite server,
// so `npm run dev` exercises the real code path with no drift.
const API_ROUTES = ['deliberate', 'vote']

function devApiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server) {
      for (const route of API_ROUTES) {
        server.middlewares.use(`/api/${route}`, (req, res) => {
          server
            .ssrLoadModule(`/api/${route}.js`)
            .then((mod) => mod.default(req, res))
            .catch((err) => {
              console.error(err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'dev_server_error', message: err.message }))
            })
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose server-side keys from .env to the dev API handlers via process.env.
  // (Vite only auto-exposes VITE_-prefixed vars, and only to the client.)
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    server: { port: Number(process.env.PORT) || 5173 },
  }
})
