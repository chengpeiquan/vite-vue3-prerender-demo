import {
  createRouter as _createRouter,
  createMemoryHistory,
  createWebHistory,
} from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 提取有效的路由
 * @description 自动从 `src/views` 目录下读取 `.vue` 文件生成路由
 * @see https://cn.vitejs.dev/guide/features.html#glob-import
 * @tips 如果用 `.tsx` 之类的文件需要自己优化规则
 */
function getRoutes() {
  const pages = import.meta.glob('../views/**/*.vue')
  return Object.keys(pages)
    .map((path: string) => {
      const matched = path.match(/\.\.\/views(.*)\.vue$/)
      if (!matched) return

      // 拿到路由组件的文件名
      const [, name] = matched
      return {
        path: name === '/home' ? '/' : name,
        component: pages[path], // 等价于 () => import('./views/*.vue')
      }
    })
    .filter((item) => item) as unknown as RouteRecordRaw[]
}

/**
 * 根据当前所在环境 server/client 来使用合适的路由模式
 * @tips import.meta.env.SSR 由 Vite 注入
 * @see https://router.vuejs.org/zh/api/#creatememoryhistory
 */
export function createRouter() {
  return _createRouter({
    history: import.meta.env.SSR
      ? createMemoryHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
    routes: getRoutes(),
  })
}
