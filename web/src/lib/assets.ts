/** Resolve a bank-relative path under the Vite/GitHub Pages base URL. */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedPath = relativePath.replace(/^\/+/, '')
  return `${normalizedBase}${normalizedPath}`
}
