import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: '/',
  plugins: [basicSsl()],
  server: {
    https: true,
    host: true,
    port: 8080,
    hmr: {
      host: 'localhost',
      protocol: 'wss'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
          'gsap': ['gsap'],
          'howler': ['howler'],
          'socket.io': ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    target: 'esnext',
    minify: 'terser'
  },
  optimizeDeps: {
    include: ['pixi.js', 'gsap', 'howler', 'socket.io-client']
  },
  css: {
    devSourcemap: true
  }
});
