<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="p-5 font-semibold text-5xl text-center">
    RBIO-P Data Sharing
  </div>
  <div id="call-to-action">
    <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <div class="text-700 text-center">
        <div class="text-blue-600 font-bold mb-3">
          <i class="pi pi-share-alt px-1"></i>&nbsp;EMPOWERING RESEARCH</div>
        <div class="text-900 font-bold text-3xl mb-3">
          Join Our Data Sharing Community
        </div>
        <div class="text-700 text-2xl mb-5">
          Stay up to date with the latest datasets from the Salk Institute's Regulatory Biology Laboratory.
        </div>
        <Button label="Join Now" icon="pi pi-cloud" 
          class="font-bold px-5 py-3 p-button-raised p-button-rounded white-space-nowrap"
          @click="join"/>

    </div>
</div>
  </div>
</template>

<script>
// import HelloWorld from '@/components/HelloWorld.vue'
import Button from 'primevue/button'
// import getStuff from '@/main.js'

export default {
  name: "Home",
  components: {
    // HelloWorld,
    Button

  },
  data() {
    return {
      
    }
  },
  computed: {
    count () {
      return this.$store.state.count
    },
    userId() {
      // console.log('userId')
      if (this.$store.state.user) {
        return this.$store.state.user.uid
      }
      return null
    }
  },
  async mounted() {
    // console.log(import.meta.env.VITE_VAR)
  },
  methods: {
    incrementCount() {
      this.$store.state.count++
    },
    join() {
      this.$router.push({ name: "Register" });
    }
  },

}
</script>

<style>
/* eslint-disable vue/multi-word-component-names  */

</style>