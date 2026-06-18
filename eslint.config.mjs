import js from '@eslint/js'
import globals from 'globals'
import pluginReact from 'eslint-plugin-react'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  // Backend (Node)
  {
    files: ['monitoring-app/alert-receiver/**/*.js'],
    extends: [js.configs.recommended], // 👈 usa la config recomendada de JS
    languageOptions: { globals: globals.node },
  },
  // Frontend (React/browser)
  {
    files: ['monitoring-app/node-app/**/*.{js,jsx,mjs,cjs}'],
    extends: [js.configs.recommended, pluginReact.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    settings: {
      react: {
        version: '18.0',
      },
    },
  },
  {
    ignores: ['node_modules', 'dist', 'build'],
  },
])
