<template>
  <div class="mx-auto">
    <div class="text-center mb-5">Bar Plot component</div>

    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>
    <div id="plot-area" class="mt-10" v-show="this.complete">
    </div>
    <div id="table-area" class=""></div>
  </div>
</template>

<script>
import * as d3 from "d3";
//import {Delaunay} from "d3-delaunay";
import DataService from "@/services/DataService.js";

import ProgressSpinner from 'primevue/progressspinner';

export default {
  name: "BarPlot",
  components: {
    ProgressSpinner,
  },
  props: { 
    msg: String,
    genes: Array,
  },
  data() {
    return {
      dataset: [],
      genesData: null,
      margin: null,
      width: null,
      height: null,
      drawable_width_scale: null,
      x: null,
      xAxis: null,
      y: null,
      yAxis: null,
      svg: null,
      complete: false,
    }
  },
  created() {
  },
  async mounted() {
    console.log('mounting')
    console.log(this.complete)
    this.genesData = this.genes.map((d) => d.name)
    this.initialize_bar_plot()
    await this.update_bar_plot()
    console.log('finished update_bar_plot')
    this.complete = true
    console.log(this.complete)
  },
  async updated () {
    this.genesData = this.genes.map((d) => d.name)
    this.update_bar_plot()
  },
  methods: {
    async get_dataset() {
      let data = await DataService
        .getExpressionDataByGenes(this.genesData.toString())
      this.dataset = data.data
    },
    initialize_bar_plot() {
      // set the dimensions and margins of the graph
      this.margin = {top: 30, right: 30, bottom: 70, left: 60}
      this.width = 700 - this.margin.left - this.margin.right,
      this.height = 500 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 4/5
      this.svg = d3.select("#plot-area")
          .append("svg")
            .attr("id", "plot-svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("class", "mx-auto")
          .append("g")
            .attr("transform", 
              `translate(${this.margin.left},${this.margin.top})`);

      // Initialize X axis
      this.x = d3.scaleBand().range([0,this.width * this.drawable_width_scale])
      this.xAxis = d3.axisBottom().scale(this.x);
      this.svg.append("g")
          .attr("transform", `translate(0, ${this.height})`)
          .attr("class","myXaxis")

      // X axis label
      this.svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", this.width * this.drawable_width_scale / 2)
        .attr("y", this.height+40)
        .text("Time Point (ZT)");

      // Initialize Y axis
      this.y = d3.scaleLinear().range([this.height, 0]);
      this.yAxis = d3.axisLeft().scale(this.y);
      this.svg.append("g")
        .attr("class","myYaxis")

      // Y axis label 
      this.svg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("y", -45)
        .attr("x",-this.height/2)
        .attr("transform", "rotate(-90)")
        .text("Gene Expression");
    },
    async update_bar_plot() {
      if (this.genesData.length) {
        await this.get_dataset()
      } else {
        this.dataset = []
      }
      console.log('update_bar_plot')
      // console.log(this.dataset)

      const time_points = [0, 2, 4, 6]
      const groups = time_points

      const dataset_filtered = this.dataset
        .filter(d => time_points.includes(d.time_point))
      // console.log('dataset_filtered')
      // console.log(dataset_filtered)
      const gene_groups = dataset_filtered.map((d,i) => [
        `${d.gene_name}_${d.group_name}`,{
        time_point: d.time_point,
        gene_expression: d.gene_expression,
        gene_group: `${d.gene_name}_${d.group_name}`,
        i: i,
        }]
      )
      // console.log('gene_groups')
      // console.log(gene_groups)

      // const sumstat = d3
      //   .group(this.dataset, d => `${d.gene_name}_${d.group_name}`);
      // console.log('sumstat')
      // console.log(sumstat)
      let timeGroups = d3
        .group(gene_groups, d => `${d[1].time_point}`)
      // console.log('timeGroups')
      // console.log(timeGroups)
      // console.log(timeGroups.keys())

      // Flatten internMap object
      function flatten(arr) {
        let result = []
        for (const key of arr.keys()) {
          let obj = {}
          obj.group = parseInt(key)
          arr.get(key).forEach(el => {
            obj[el[0]] = el[1].gene_expression
          })
          result.push(obj)
        }
        return result
      }

      const data = flatten(timeGroups)
      // console.log('flatten data')
      // console.log(data)

      const subgroups = Object.keys(data[0]).filter(el => el !== 'group')
      // console.log('subgroups')
      //['Alb_ALF', 'Fga_ALF', 'Trf_ALF', 'Alb_TRF', 'Fga_TRF', 'Trf_TRF']
      // console.log(subgroups)

      var color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create the X axis
      var x = this.x
      x.domain(groups)
        .padding([0.1])

      this.svg.selectAll(".myXaxis").transition()
        .duration(1000)
        .call(this.xAxis);

      // Another scale for subgroup position?
      const xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05])

      // console.log('xSubgroup')
      // console.log(xSubgroup.bandwidth())

      // Create the Y axis
      var y = this.y
      y.domain([0, d3.max(dataset_filtered, (d) => +d.gene_expression)])
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(1000)
          .call(this.yAxis)

      var updateInterval = 500

      // console.log('data')
      // console.log(data)
      var i =0

      // // Show the bars
      // this.svg.append("g")
      //   .selectAll("g")
      //   // Enter in data = loop group per group
      //   .data(data)
      //   .join("g")
      //     .attr("transform", d => {return `translate(${x(d.group)}, 0)`})
      //   .selectAll("rect")
      //   .data(function(d) { 
      //     return subgroups.map(function(key) { 
      //       return {key: key, value: d[key]}; }); })
      //   .join("rect")
      //     .attr("x", d => xSubgroup(d.key))
      //     .attr("y", d => y(d.value))
      //     .attr("width", xSubgroup.bandwidth())
      //     .attr("height", d => this.height - y(d.value))
      //     .attr("fill", d => color(d.key));
      // const timeMap = timeGroups.map(el => el)

      // Flatten internMap object
      function changeValues(iMap) {
        for (const key of iMap.keys()) {
          // console.log(key)
          let arrOfArrs = iMap.get(key).map(el => ({
            key: el[0], value: el[1].gene_expression}))
          // console.log(arrOfArrs)
          iMap.set(key, arrOfArrs)
        }
      }
      changeValues(timeGroups)
      console.log("================")
      console.log(timeGroups)
      console.log("================")
      

      // Show the bars
      this.svg
        //.append("g")
        .selectAll(".time-group")
        // Enter in data = loop group per group
        .data(timeGroups)
        .join(
          (enter) => {
            console.log('enter')
            console.log(enter)
            enter.append('g')
              .attr("transform", d => `translate(${x(parseInt(d[0]))}, 0)`)
              .attr("class", "time-group")
              .selectAll(".time-group-rect")
              .data(d => d[1])
              .join(
                (enter) => {
                  console.log('enter > enter')
                  console.log(enter)
                  enter.append('rect')
                    .style("opacity", 0.5)
                    .attr("class", 'time-group-rect')
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                },
                (update) => {
                  console.log('enter > update')
                  console.log(update)
                  update
                    .style("opacity", 1)
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                  
                },
                (exit) => {
                  console.log('enter > exit')
                  console.log(exit)
                  exit
                    .style('opacity', 0)
                    .transition()
                    .ease(Math.sqrt)
                    .duration(updateInterval)
                    .remove()
                }
              )
          },
          (update) => {
            console.log('update')
            console.log(update)
            update
              //.selectAll(".time-group")
              .attr("transform", d => `translate(${x(parseInt(d[0]))}, 0)`)
              .selectAll(".time-group-rect")
              .data(d => d[1])
              .join(
                (enter) => {
                  console.log('update > enter')
                  console.log(enter)
                  enter.append('rect')
                    .attr("class", "time-group-rect")
                    .style("opacity", 0.5)
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                },
                (update) => {
                  console.log('update > update')
                  console.log(update)
                  update
                    .style("opacity", 1)
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                  
                },
                (exit) => {
                  console.log('update > exit')
                  console.log(exit)
                  exit
                    // .selectAll('rect')
                    .style('opacity', 0)
                    .transition()
                    .ease(Math.sqrt)
                    .duration(updateInterval)
                    .remove()
                }
              )
          },
          (exit) => {
            console.log('exit')
            console.log(exit)
            exit
              .selectAll(".time-group-rect")
              .data(d => d[1])
              .join(
                (exit) => {
                  console.log('exit > exit')
                  console.log(exit)
                  exit
                    .style('opacity', 0)
                    .transition()
                    .ease(Math.sqrt)
                    .duration(updateInterval)
                    .remove()
                },
              )
          },
        )

      // subgroups = Nitrogen,normal,stress
      // subgroups = 
      // X axis = time_point 
      // subgroups = gene_group
      // columns = 

      
      // let sumstat_arr = this.dataset.map((d,i) => [
      //   `${d.gene_name}_${d.group_name}_${d.time_point}`,{
      //   time_point: d.time_point,
      //   gene_expression: d.gene_expression,
      //   gene_group: `${d.gene_name}_${d.group_name}`,
      //   i: i,
      //   }]
      // )
      // console.log(sumstat_arr)
      
      // sumstat_arr = sumstat_arr.filter((el) => time_points.includes(el[1].time_point))
      // console.log('sumstat_arr')
      // console.log(sumstat_arr)
      // const sumstat_map = new Map(sumstat_arr)
      // console.log('sumstat_map')
      // console.log(sumstat_map)

    





      // const sumstat = d3
      //   .group(this.dataset, d => `${d.gene_name}_${d.group_name}`);
      // const sumstat_arr = this.dataset.map((d,i) => [
      //   `${d.gene_name}_${d.group_name}_${d.time_point}`,{
      //   time_point: d.time_point,
      //   gene_expression: d.gene_expression,
      //   gene_group: `${d.gene_name}_${d.group_name}`,
      //   i: i,
      //   }]
      // )
      // const sumstat_map = new Map(sumstat_arr)
      // var color = d3.scaleOrdinal(d3.schemeCategory10);



      // // Logic for plotting lines
      // this.svg.selectAll(".line")
      //     .data(sumstat)
      //     .join(
      //       function(enter) {
      //         enter.append('path')
      //           .attr('class', 'line')
      //           .attr("d", (d) => d3.line()
      //               .curve(d3.curveNatural)
      //               .x((d) => x(d.time_point))
      //               .y((d) => y(+d.gene_expression))
      //               (d[1])
      //           )
      //           .attr("fill", "none")
      //           .attr("stroke-width", 1.5)
      //           .attr("stroke", (d) => color(d[0]))
              
      //         enter.append('g')

      //       },
      //       (update) => {
      //         update
      //           .transition()
      //           .duration(500)
      //           .attr("d", (d) => d3.line()
      //               .curve(d3.curveNatural)
      //               .x((d) => x(d.time_point))
      //               .y((d) => y(+d.gene_expression))
      //               (d[1]))
      //           .attr('stroke', (d) => color(d[0]))
      //       },
      //       (exit) => {
      //         exit  
      //           .style('stroke-opacity', 0)
      //           .transition()
      //           .ease(Math.sqrt)
      //           .duration(updateInterval)
      //           .remove()
      //       }
      //     )
      
      // // Legend color
      // var legendX = this.width*this.drawable_width_scale+20
      // this.svg.selectAll(".legendLines")
      //     .data(sumstat)
      //     .join(
      //       (enter) => {
      //         enter.append('line')
      //           .attr('class', 'legendLines')
      //           .attr('x1', legendX)
      //           .attr('x2', legendX + 15)
      //           .attr('y1', (d,i) => i*25 )
      //           .attr('y2', (d,i) => i*25 )
      //           .style("stroke", (d) => color(d[0]))
      //           .style("stroke-width", 1.5)
      //       },
      //       (update) => {
      //         update.attr('x1', legendX)
      //           .attr('x2', legendX + 15)
      //           .attr('y1', (d,i) =>  i*25 )
      //           .attr('y2', (d,i) =>  i*25 )
      //           .style("stroke", (d) => color(d[0]))
      //       },
      //       (exit) => {
      //         exit.transition()
      //           .ease(Math.sqrt)
      //           .duration(updateInterval)
      //           .style('stroke-opacity', 0)
      //           .remove()
      //       }
      //     )
      
      // // Legend text
      // this.svg.selectAll('.legendText')
      //     .data(sumstat)
      //     .join(
      //       (enter) => {
      //         enter.append('text')
      //           .attr('class', 'legendText')
      //           .attr('x', legendX+20)
      //           .attr('y', (d,i) => i*25)
      //           .style('fill', (d) => color(d[0]))
      //           .text((d) => d[0] )
      //           .attr('text-anchor', 'left')
      //           .attr('font-size', '0.7em')
      //           .style('fill-opacity', 1)
      //       },
      //       (update) => {
      //         update.attr('y', (d,i) => i*25 )
      //           .style('fill', (d) => color(d[0]))
      //           .text((d) => d[0])

      //       },
      //       (exit) => {
      //         exit.transition()
      //           .ease(Math.sqrt)
      //           .duration(updateInterval)
      //           .style('fill-opacity', 0)
      //           .remove()

      //       }
      //     )
    
      // // Draw dots on points
      // this.svg.selectAll(".dot")
      //   // Flattened sumstat array with gene_group keys
      //   .data(sumstat_map)
      //   .join(
      //     (enter) => {
      //       enter.append("circle")
      //         .attr("class", "dot")
      //         .style("fill", d => color(d[1].gene_group))
      //         .attr("cx", d => x(d[1].time_point))
      //         .attr("cy", d => y(d[1].gene_expression))
      //         .attr("r", 2)
      //         .transition()
      //         .ease(Math.sqrt)
      //         .duration(updateInterval)
      //         .style('fill-opacity', 1)
      //     },
      //     (update) => {
      //       //update
      //       update.attr('cx', d => x(d[1].time_point))
      //         .attr('cy', d => y(d[1].gene_expression))
      //         .style('fill', d => color(d[1].gene_group))
      //         .transition()
      //         .ease(Math.sqrt)
      //         .duration(updateInterval)
      //         .style('fill-opacity', 1)
      //     },
      //     (exit) => {
      //       exit.transition()
      //         .ease(Math.sqrt)
      //         .duration(updateInterval)
      //         .style('fill-opacity', 0)
      //         .remove()
      //     }
      //   )

      // // Voronoi cells to select nearest point
      // var voronoi = d3.Delaunay
      //   .from(sumstat_map, d => x(d[1].time_point), d => y(d[1].gene_expression))
      //   .voronoi([0, 0, this.width * this.drawable_width_scale, this.height])

      // //Create the voronoi grid
      // this.svg.append("g")
      //   .attr("class", "voronoiWrapper")
      //   .selectAll("path")
      //   .data(sumstat_map)
      //   .join(
      //     (enter) => {
      //       enter.append("path")
      //       .attr("opacity", 0.5)
      //       //.attr("stroke", "#ff1493") // Hide overlay
      //       .attr("fill", "none")
      //       .style("pointer-events", "all")
      //       .attr("d", (d, i) => voronoi.renderCell(i))
      //       .on("mouseover", (d,i) => {
      //         if (d.y > 1) {
      //           this.svg.append('g')
      //             .attr('class', 'tooltip')
      //             .attr("transform", `translate(${x(i[1].time_point)},${y(i[1].gene_expression)})`)
      //             .call(popover, `${i[1].gene_group} 
      //             Time: ZT${i[1].time_point} 
      //             Expr: ${Math.round(i[1].gene_expression)}`, i[1].gene_group)
      //         }
      //       })
      //       .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
      //     },
      //     (update) => {

      //     },
      //     (exit) => {
      //       exit.remove()

      //     }
      //   )
           
      // function popover(g, value, key) {
      //   if (!value) return g.style("display", "none");

      //   // tooltip group
      //   g
      //     .style("display", null)
      //     .style("pointer-events", "none")
      //     .style("font", "10px sans-serif");

      //   // tooltip container stroke
      //   const path = g.selectAll("path")
      //     .data([null])
      //     .join("path")
      //       .attr("fill", "white")
      //       .attr("fill-opacity", 1)
      //       .attr("stroke", color(key));

      //   // tooltip content
      //   const text = g.selectAll("text")
      //     .data([null])
      //     .join("text")
      //     .call(text => text
      //       .selectAll("tspan")
      //       .data((value + "").split(/\n/))
      //       .join("tspan")
      //         .attr("x", 0)
      //         .attr("y", (d, i) => `${i * 1.1}em`)
      //         .style("text-align", "center")
      //         .style("font-weight", (_, i) => i ? null : "bold")
      //         .text(d => d));

      //   // tooltip positioning
      //   const {x, y, width: w, height: h} = text.node().getBBox();
      //   text.attr("transform", `translate(${-w / 2},${15 - y})`);
        
      //   // tooltip container path
      //   path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
      // }
          
    },
  }

}
</script>

<style>

</style>