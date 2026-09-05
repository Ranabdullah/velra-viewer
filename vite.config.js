import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
