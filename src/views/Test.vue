<template>
  <div id="scatter-area" class="flex flex-col mt-10 justify-center items-center">
    <MarginTranslation/>
  </div>
</template>

<script>
import * as d3 from "d3"
import MarginTranslation from "../components/svg/MarginTranslation.vue"

export default {
  name: 'Test',
  components: {
    MarginTranslation,
    
  },
  data() {
    return {
      test_val: 0,
      width: 500,
      height: 200,
    }
  },
  mounted() {
    console.log('Test mounted');
    //this.margin_translation();

  },
  methods: {
    circles_axis() {
      var svg = d3.select("#scatter-area")
          .append("svg:svg")
            .attr("width", this.width)
            .attr("height", this.height);

      //var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');

      // Create a scale: transform value in pixel
      var x = d3.scaleLinear()
          .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
          .range([0, 400]);       // This is the corresponding value I want in Pixel
      console.log( x(25) ); 

      // Show the axis that corresponds to this scale
      svg.call(d3.axisBottom(x));

      // Add 3 dots for 0, 50 and 100%
      svg.append("circle")
        .attr("cx", x(10)).attr("cy", 100).attr("r", 40).style("fill", "blue");
      svg.append("circle")
        .attr("cx", x(50)).attr("cy", 100).attr("r", 40).style("fill", "red");
      svg.append("circle")
        .attr("cx", x(100)).attr("cy", 100).attr("r", 40).style("fill", "green");

    },
    margin_translation() {
      console.log("margin_translation from test")

      // set the dimensions and margins of the graph
      var margin = {top: 10, right: 40, bottom: 30, left: 30},
          width = 450 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var sVg = d3.select("#scatter-area")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        // translate this svg element to leave some margin.
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // X scale and Axis
      var x = d3.scaleLinear()
          .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
          .range([0, width]);       // This is the corresponding value I want in Pixel
      sVg
        .append('g')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // X scale and Axis
      var y = d3.scaleLinear()
          .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
          .range([height, 0]);       // This is the corresponding value I want in Pixel
      sVg
        .append('g')
        .call(d3.axisLeft(y));

      console.log(sVg);

    }


  },


}
</script>

<style>

</style>