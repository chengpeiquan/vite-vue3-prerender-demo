import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter } from '@/router'
import App from '@/App.vue'

// 全局样式
import '@less/global.less'

/**
 * SSR 每个请求都需要一个新的应用程序实例
 * @tips 不需要显式安装 @vue/server-renderer 这个依赖了
 * @see https://v3.cn.vuejs.org/guide/ssr/getting-started.html
 */
export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter()

  app.use(router)
  app.use(createPinia())

  return {
    app,
    router,
  }
}
