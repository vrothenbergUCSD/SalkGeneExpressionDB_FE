<template>
  <AppLink
    v-bind="$attrs"
    class="px-3 py-2 rounded-md text-sm font-medium"
    active-class="bg-gray-900 text-white"
    inactive-class="text-gray-300 hover:bg-gray-700 hover:text-white"
  >
    <slot />
  </AppLink>
</template>

<script>
import AppLink from '@/components/AppLink.vue'

export default {
  name:"NavLink",
  components: {
    AppLink,
  }

}
</script>

<style>

</style>