import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['framer-motion', 'react-router-dom', 'react-leaflet', 'leaflet', 'lucide-react', '@supabase/supabase-js', 'date-fns', 'zod']
  },
  build: {
    rollupOptions: {
      external: []
    }
  }
});