import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7001,
<<<<<<< HEAD
=======
    strictPort: true,
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  },
})
