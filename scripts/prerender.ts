import fs from 'fs-extra'
import fg from 'fast-glob'
import { resolve } from './utils'
import seo from '../src/router/seo'

/**
 * 从 `src/views` 里读取路由组件来确定最终的路由页面
 * @tips 其中首页也就是根目录需要命名为 `home.vue` ，可以自己调整
 */
async function getRoutesToPrerender() {
  const pages = await fg('src/views/**/*.vue')
  const routesToPrerender = pages.map((file) => {
    const paths = file.replace('src/views', '').split('/')
    const lastIndex = paths.length - 1
    const name = paths[lastIndex].replace(/\.vue$/, '')
    return name === 'home'
      ? `/`
      : `${paths.slice(0, lastIndex).join('/')}/${name}`
  })
  return routesToPrerender
}

/**
 * 执行预渲染
 */
async function run() {
  // 读取服务端渲染的资源清单
  const { default: manifest } = await import(
    '../dist/static/ssr-manifest.json' as any
  )

  // 读取 HTML 模板（记得添加下面替换内容部分的两个注释标记）
  const template = fs.readFileSync(resolve('dist/static/index.html'), 'utf-8')
  const { render } = await import('../dist/server/entry-server.js' as any)

  // 预渲染每个路由...
  const routesToPrerender = await getRoutesToPrerender()

  for (const url of routesToPrerender) {
    // 根据文件所在的路径，创建存放的文件夹
    const dirs = url.split('/')
    const lastIndex = dirs.length - 1
    if (dirs.length > 2) {
      const dir = dirs.slice(1, lastIndex).join('/')
      fs.mkdirpSync(`dist/static/${dir}`)
    }

    // 根据注释标记替换成要渲染的内容
    const [appHtml, preloadLinks] = await render(url, manifest)
    let html = template
      .replace(`<!--preload-links-->`, preloadLinks)
      .replace(`<!--app-html-->`, appHtml)

    // 完善 SEO 信息
    const tkd = seo.find((item) => item.url === url)
    if (tkd) {
      const { title, description, keywords } = tkd

      // 添加标题
      html = html.replace(`<!--title-->`, `<title>${title}</title>`)

      // 添加描述
      html = html.replace(
        `<!--description-->`,
        `<meta name="description" content="${description}">`
      )

      // 添加关键词
      html = html.replace(
        `<!--keywords-->`,
        `<meta name="keywords" content="${keywords.join(',')}">`
      )
    }

    // 写入处理好的 HTML 文件
    const filePath = `dist/static${url === '/' ? '/index' : url}.html`
    fs.writeFileSync(resolve(filePath), html)
  }

  // 结束后移除服务端渲染的资源清单
  fs.unlinkSync(resolve('dist/static/ssr-manifest.json'))
}
run().catch((e) => {
  console.log(e)
})
