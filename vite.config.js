import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // DEPLOYMENT FIX: Si usás GitHub Pages con repositorio tipo
  // usuario.github.io/proyecto-agencia, necesitás el base path.
  // Si usás un dominio propio o Vercel/Netlify, dejalo como "/"
  base: '/proyecto-agencia/',
})
