import { basename } from 'path'
import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'
import type { RouteLocationRaw } from 'vue-router'
import type { SSRContext } from 'vue/server-renderer'

/**
 * 渲染页面
 * @param url - 路由对应的 URL
 * @param manifest - SSR 资源清单
 * @returns [html, preloadLinks]
 *  html: 页面内容的 HTML 代码
 *  preloadLinks: 预加载部分的 HTML 代码
 */
export async function render(
  url: RouteLocationRaw,
  manifest: { [key: string]: any }
) {
  const { app, router } = createApp()

  // 在渲染前把当前路由设置为需要的 URL 信息，并等待路由渲染完毕
  router.push(url)
  await router.isReady()

  // 通过传递 `useSSRContext()` 拿到的上下文对象
  // @vitejs/plugin-vue 这个插件会处理到组件的 `setup()` 里
  // 渲染后， `ctx.modules` 会包含所有已实例化的组件
  const ctx: SSRContext = {}
  const html = await renderToString(app, ctx)

  // Vite 生成的 SSR 清单包含 module -> chunk/asset 的映射
  // 可以用它来确定需要预加载的资源有哪些
  const preloadLinks = renderPreloadLinks(ctx.modules, manifest)
  return [html, preloadLinks]
}

/**
 * 渲染需要预加载的所有文件
 * @param modules
 * @param manifest - SSR 的资源清单
 * @returns 完整的预加载部分的 HTML 代码
 */
function renderPreloadLinks(
  modules: string[],
  manifest: { [key: string]: any }
) {
  let links = ''
  const seen = new Set()
  modules.forEach((id: string) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file: string) => {
        if (!seen.has(file)) {
          seen.add(file)
          const filename = basename(file)
          if (manifest[filename]) {
            for (const depFile of manifest[filename]) {
              links += renderPreloadLink(depFile)
              seen.add(depFile)
            }
          }
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

/**
 * 渲染需要预加载的单个文件
 * @param file - 文件路径
 * @returns 根据资源类型返回对应的 HTML 语句
 */
function renderPreloadLink(file: string) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  } else if (file.endsWith('.woff')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
  } else if (file.endsWith('.woff2')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
  } else if (file.endsWith('.gif')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/gif">`
  } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/jpeg">`
  } else if (file.endsWith('.png')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/png">`
  } else {
    // TODO
    return ''
  }
}
