import fs from 'fs-extra'
import { resolve } from './utils'
import fg from 'fast-glob'

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
    const [appHtml, preloadLinks] = await render(url, manifest)

    // 根据注释标记替换成要渲染的内容
    const html = template
      .replace(`<!--preload-links-->`, preloadLinks)
      .replace(`<!--app-html-->`, appHtml)

    // 根据文件所在的路径，创建存放的文件夹
    const dirs = url.split('/')
    if (dirs.length > 2) {
      const dir = dirs.slice(1, dirs.length - 1).join('/')
      fs.mkdirpSync(`dist/static/${dir}`)
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
