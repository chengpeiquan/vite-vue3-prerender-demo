<template>
  <router-view :key="key" v-slot="{ Component }">
    <Suspense>
      <div>
        <component :is="Component" />
      </div>
    </Suspense>
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const key = computed(() =>
  route.name ? String(route.name) + new Date() : String(route.path) + new Date()
)
</script>
