import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  plugins:[react()],
  build:{outDir:'dist-graph-trial',rollupOptions:{input:fileURLToPath(new URL('./graph-trial.html',import.meta.url))}},
});
