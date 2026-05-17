import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Serve /models folder at the /images/models URL path
    {
      name: 'serve-models-as-images',
      configureServer(server) {
        server.middlewares.use('/images/models', (req, res, next) => {
          const modelsDir = path.resolve(__dirname, 'models')
          const filePath = path.join(modelsDir, req.url)
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase()
            const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
            res.setHeader('Content-Type', mimeMap[ext] || 'image/jpeg')
            res.setHeader('Cache-Control', 'public, max-age=3600')
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
    },
  ],
  // ── Dev proxy: /api → Express server on :4000 ─────────────────────────────
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})

