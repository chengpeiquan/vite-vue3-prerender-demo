// Pre-render the app into static HTML.
// run `npm run generate` and then `dist/static` can be served as a static site.

import fs from 'fs'
import { resolve } from 'path'

const toAbsolute = (p: string) => resolve(__dirname, `../${p}`)

// determine routes to pre-render from src/views
const routesToPrerender = fs
  .readdirSync(toAbsolute('src/views'))
  .map((file) => {
    const name = file.replace(/\.vue$/, '').toLowerCase()
    return name === 'home' ? `/` : `/${name}`
  })

;(async () => {
  const manifest = (await import('../dist/static/ssr-manifest.json' as any))
    .default
  const template = fs.readFileSync(
    toAbsolute('dist/static/index.html'),
    'utf-8'
  )
  const { render } = await import('../dist/server/entry-server.js')

  // pre-render each route...
  for (const url of routesToPrerender) {
    const [appHtml, preloadLinks] = await render(url, manifest)

    const html = template
      .replace(`<!--preload-links-->`, preloadLinks)
      .replace(`<!--app-html-->`, appHtml)

    const filePath = `dist/static${url === '/' ? '/index' : url}.html`

    fs.writeFileSync(toAbsolute(filePath), html)
  }

  // done, delete ssr manifest
  fs.unlinkSync(toAbsolute('dist/static/ssr-manifest.json'))
})()
