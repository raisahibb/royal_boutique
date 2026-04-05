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
          // req.url starts with '/' e.g. '/patiala-red-1.jpg'
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
})
