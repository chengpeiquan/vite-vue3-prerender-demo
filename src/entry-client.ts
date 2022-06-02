import { createApp } from './main'

const { app, router } = createApp()

/**
 * 需要等待 Ready 之后才可以挂载节点
 * @see https://router.vuejs.org/zh/api/#isready
 */
router.isReady().then(() => {
  app.mount('#app')
})
