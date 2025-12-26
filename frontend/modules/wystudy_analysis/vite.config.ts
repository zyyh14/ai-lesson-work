import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const normalizedEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    normalizedEnv[k.replace(/^\uFEFF/, '')] = v;
  }

  console.log('[vite] mode:', mode, '| envDir:', process.cwd());
  console.log('[vite] .env.local exists:', fs.existsSync(path.join(process.cwd(), '.env.local')));
  console.log('[vite] loaded env keys:', Object.keys(normalizedEnv).filter(k => k.toUpperCase().includes('ARK') || k.toUpperCase().includes('VITE')).sort());
  console.log('[vite] env VITE_ARK_API_KEY:', normalizedEnv.VITE_ARK_API_KEY ? 'set' : 'missing');
  return {
    envDir: process.cwd(),
    server: {
      port: 3000,
      host: '0.0.0.0',
      // 配置代理解决 CORS 问题
      proxy: {
        '/api/ark': {
          target: 'https://ark.cn-beijing.volces.com',
          changeOrigin: true,
          rewrite: (reqPath) => {
            // chat/completions 需要 /api/v3/chat/completions
            if (reqPath.includes('/chat/completions')) {
              return reqPath.replace(/^\/api\/ark/, '/api/v3');
            }
            // contents/generations/tasks 需要 /api/v3/contents/generations/tasks
            return reqPath.replace(/^\/api\/ark/, '/api/v3');
          },
          secure: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(normalizedEnv.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(normalizedEnv.GEMINI_API_KEY),
      'import.meta.env.VITE_ARK_API_KEY': JSON.stringify(normalizedEnv.VITE_ARK_API_KEY ?? ''),
      'import.meta.env.VITE_ARK_MODEL': JSON.stringify(normalizedEnv.VITE_ARK_MODEL ?? ''),
      '__ARK_API_KEY__': JSON.stringify(normalizedEnv.VITE_ARK_API_KEY ?? '')
      ,'__ARK_MODEL__': JSON.stringify(normalizedEnv.VITE_ARK_MODEL ?? '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
