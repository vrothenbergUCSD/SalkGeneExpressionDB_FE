<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="graph">
    <h1>Graph</h1>

    <div id="d3svg" ref="d3svg"></div>
  </div>
</template>

<script>
import Bar from '../../functions/bar.js'
import * as d3 from "d3"

export default {
  name: "Graph",
  components: {

  },
  data() {
    return {
      loadData: [],
    }
  },
  mounted() {
    console.log('Graph mounted')
    this.fetchData()
    //Bar("d3-svg")
    //console.log(this.$refs.d3svg)
    //let el = this.$refs.d3svg 
    //el.append(Bar())
    
    //this.fetchData()
  },
  methods: {
    async fetchData() {
      console.log('fetchData')
      //let data = await d3.csv("./countries.csv");
      //console.log(data)
      Bar("d3svg")
      //this.loadData = data;
    }
  },


}
</script>

<style>
/* eslint-disable vue/multi-word-component-names  */

</style>