<template>
  <AppLink
    v-bind="$attrs"
    class="block px-4 py-2 text-sm text-gray-700"
    active-class="bg-gray-100"
    inactive-class=""
  >
    <slot />
  </AppLink>
</template>

<script>
import AppLink from '@/components/AppLink.vue'

export default {
  name:"ProfileLink",
  components: {
    AppLink,
  }

}
</script>

<style>

</style>