<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="">
    <h1>Home</h1>
    <HelloWorld/>
  </div>
</template>

<script>
import HelloWorld from '../components/HelloWorld.vue'

export default {
  name: "Home",
  components: {
    HelloWorld,

  },
  data() {
    return {
    }
  },
  mounted() {
    console.log('Home mounted')
  },
  methods: {

  },


}
</script>

<style>
/* eslint-disable vue/multi-word-component-names  */

</style>