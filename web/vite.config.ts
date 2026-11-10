import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function resolveBase(): string {
  // Local/default builds use root. GitHub Actions sets GITHUB_REPOSITORY=owner/repo.
  const repository = process.env.GITHUB_REPOSITORY
  if (!repository) {
    return '/'
  }

  const [owner, repo] = repository.split('/')
  if (!owner || !repo) {
    return '/'
  }

  // User/organization site repos are served from the domain root.
  if (repo === `${owner}.github.io`) {
    return '/'
  }

  return `/${repo}/`
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: resolveBase(),
  publicDir: path.resolve(rootDir, '../question-bank'),
  server: {
    fs: {
      allow: [path.resolve(rootDir, '..')],
    },
  },
})
