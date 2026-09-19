/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/**
 * Caminho base da aplicação.
 *
 * Em GitHub Pages o site vive em `usuario.github.io/<repo>/`, não na raiz — e
 * aí todo asset com caminho absoluto quebra. O workflow de deploy preenche
 * `BASE_PATH` com o nome do repositório, então isto funciona sem ninguém
 * precisar escrever o nome em lugar nenhum. Em desenvolvimento fica `/`.
 */
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-64.png', 'apple-touch-icon.png', 'sprites/*.png'],
      manifest: {
        name: 'Super Mimi',
        short_name: 'Super Mimi',
        description:
          'Aprenda lógica de programação guiando a tartaruga Mimi pelo rio até as vitórias régias.',
        lang: 'pt-BR',
        theme_color: '#14657a',
        background_color: '#0b3a47',
        display: 'standalone',
        orientation: 'landscape',
        // Relativos ao manifest: assim o app instalado abre no lugar certo
        // tanto na raiz quanto num subdiretório
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // As fontes do Google entram em cache para o jogo abrir offline com a
        // tipografia certa; sem isto ele cai em fonte de sistema sem avisar.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
