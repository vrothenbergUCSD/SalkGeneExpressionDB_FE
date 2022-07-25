<template>
  <div class="mx-auto">
    <div class="text-center mb-5">Line Plot component</div>

    <div id="spinner" class="mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full"/>
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
  name: "LinePlot",
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
    this.initialize_line_plot()
    await this.update_line_plot()
    console.log('finished update_line_plot')
    this.complete = true
    console.log(this.complete)
  },
  async updated () {
    this.genesData = this.genes.map((d) => d.name)
    this.update_line_plot()
  },
  methods: {
    async get_dataset() {
      let data = await DataService.getExpressionDataByGenes(this.genesData.toString())
      this.dataset = data.data
    },
    initialize_line_plot() {
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
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      // Initialize X axis
      this.x = d3.scaleLinear().range([0,this.width * this.drawable_width_scale])
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
    async update_line_plot() {
      if (this.genesData.length) {
        await this.get_dataset()
      } else {
        this.dataset = []
      }

      const sumstat = d3
        .group(this.dataset, d => `${d.gene_name}_${d.group_name}`);
      const sumstat_arr = this.dataset.map((d,i) => [
        `${d.gene_name}_${d.group_name}_${d.time_point}`,{
        time_point: d.time_point,
        gene_expression: d.gene_expression,
        gene_group: `${d.gene_name}_${d.group_name}`,
        i: i,
        }]
      )
      const sumstat_map = new Map(sumstat_arr)
      var color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create the X axis
      var x = this.x
      x.domain([0, d3.max(this.dataset, (d) => d.time_point )])
      this.svg.selectAll(".myXaxis").transition()
        .duration(1000)
        .call(this.xAxis);

      // Create the Y axis
      var y = this.y
      y.domain([0, d3.max(this.dataset, (d) => +d.gene_expression)])
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(1000)
          .call(this.yAxis)

      var updateInterval = 500

      // Logic for plotting lines
      this.svg.selectAll(".line")
          .data(sumstat)
          .join(
            function(enter) {
              enter.append('path')
                .attr('class', 'line')
                .attr("d", (d) => d3.line()
                    .curve(d3.curveNatural)
                    .x((d) => x(d.time_point))
                    .y((d) => y(+d.gene_expression))
                    (d[1])
                )
                .attr("fill", "none")
                .attr("stroke-width", 1.5)
                .attr("stroke", (d) => color(d[0]))
              
              enter.append('g')

            },
            (update) => {
              update
                .transition()
                .duration(500)
                .attr("d", (d) => d3.line()
                    .curve(d3.curveNatural)
                    .x((d) => x(d.time_point))
                    .y((d) => y(+d.gene_expression))
                    (d[1]))
                .attr('stroke', (d) => color(d[0]))
            },
            (exit) => {
              exit  
                .style('stroke-opacity', 0)
                .transition()
                .ease(Math.sqrt)
                .duration(updateInterval)
                .remove()
            }
          )
      
      // Legend color
      var legendX = this.width*this.drawable_width_scale+20
      this.svg.selectAll(".legendLines")
          .data(sumstat)
          .join(
            (enter) => {
              enter.append('line')
                .attr('class', 'legendLines')
                .attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) => i*25 )
                .attr('y2', (d,i) => i*25 )
                .style("stroke", (d) => color(d[0]))
                .style("stroke-width", 1.5)
            },
            (update) => {
              update.attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) =>  i*25 )
                .attr('y2', (d,i) =>  i*25 )
                .style("stroke", (d) => color(d[0]))
            },
            (exit) => {
              exit.transition()
                .ease(Math.sqrt)
                .duration(updateInterval)
                .style('stroke-opacity', 0)
                .remove()
            }
          )
      
      // Legend text
      this.svg.selectAll('.legendText')
          .data(sumstat)
          .join(
            (enter) => {
              enter.append('text')
                .attr('class', 'legendText')
                .attr('x', legendX+20)
                .attr('y', (d,i) => i*25)
                .style('fill', (d) => color(d[0]))
                .text((d) => d[0] )
                .attr('text-anchor', 'left')
                .attr('font-size', '0.7em')
                .style('fill-opacity', 1)
            },
            (update) => {
              update.attr('y', (d,i) => i*25 )
                .style('fill', (d) => color(d[0]))
                .text((d) => d[0])

            },
            (exit) => {
              exit.transition()
                .ease(Math.sqrt)
                .duration(updateInterval)
                .style('fill-opacity', 0)
                .remove()

            }
          )
    
      // Draw dots on points
      this.svg.selectAll(".dot")
        // Flattened sumstat array with gene_group keys
        .data(sumstat_map)
        .join(
          (enter) => {
            enter.append("circle")
              .attr("class", "dot")
              .style("fill", d => color(d[1].gene_group))
              .attr("cx", d => x(d[1].time_point))
              .attr("cy", d => y(d[1].gene_expression))
              .attr("r", 2)
              .transition()
              .ease(Math.sqrt)
              .duration(updateInterval)
              .style('fill-opacity', 1)
          },
          (update) => {
            //update
            update.attr('cx', d => x(d[1].time_point))
              .attr('cy', d => y(d[1].gene_expression))
              .style('fill', d => color(d[1].gene_group))
              .transition()
              .ease(Math.sqrt)
              .duration(updateInterval)
              .style('fill-opacity', 1)
          },
          (exit) => {
            exit.transition()
              .ease(Math.sqrt)
              .duration(updateInterval)
              .style('fill-opacity', 0)
              .remove()
          }
        )

      // Voronoi cells to select nearest point
      var voronoi = d3.Delaunay
        .from(sumstat_map, d => x(d[1].time_point), d => y(d[1].gene_expression))
        .voronoi([0, 0, this.width * this.drawable_width_scale, this.height])

      //Create the voronoi grid
      this.svg.append("g")
        .attr("class", "voronoiWrapper")
        .selectAll("path")
        .data(sumstat_map)
        .join(
          (enter) => {
            enter.append("path")
            .attr("opacity", 0.5)
            //.attr("stroke", "#ff1493") // Hide overlay
            .attr("fill", "none")
            .style("pointer-events", "all")
            .attr("d", (d, i) => voronoi.renderCell(i))
            .on("mouseover", (d,i) => {
              if (d.y > 1) {
                this.svg.append('g')
                  .attr('class', 'tooltip')
                  .attr("transform", `translate(${x(i[1].time_point)},${y(i[1].gene_expression)})`)
                  .call(popover, `${i[1].gene_group} 
                  Time: ZT${i[1].time_point} 
                  Expr: ${Math.round(i[1].gene_expression)}`, i[1].gene_group)
              }
            })
            .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
          },
          (update) => {

          },
          (exit) => {
            exit.remove()

          }
        )
           
      function popover(g, value, key) {
        if (!value) return g.style("display", "none");

        // tooltip group
        g
          .style("display", null)
          .style("pointer-events", "none")
          .style("font", "10px sans-serif");

        // tooltip container stroke
        const path = g.selectAll("path")
          .data([null])
          .join("path")
            .attr("fill", "white")
            .attr("fill-opacity", 1)
            .attr("stroke", color(key));

        // tooltip content
        const text = g.selectAll("text")
          .data([null])
          .join("text")
          .call(text => text
            .selectAll("tspan")
            .data((value + "").split(/\n/))
            .join("tspan")
              .attr("x", 0)
              .attr("y", (d, i) => `${i * 1.1}em`)
              .style("text-align", "center")
              .style("font-weight", (_, i) => i ? null : "bold")
              .text(d => d));

        // tooltip positioning
        const {x, y, width: w, height: h} = text.node().getBBox();
        text.attr("transform", `translate(${-w / 2},${15 - y})`);
        
        // tooltip container path
        path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
      }
          
    },
    tabulate(data, columns) {
      console.log("Tabulating")
      var table = d3.select("#table-area").append("table")
              .attr("style", "margin-left: 0px")
              .style("border-collapse", "collapse")// <= Add this line in
              .style("border", "2px black solid") // <= Add this line in
              .attr("class", "mx-auto"),
          thead = table.append("thead"),
          tbody = table.append("tbody");

      // append the header row
      thead.append("tr")
          .selectAll("th")
          .data(columns)
          .enter()
          .append("th")
              .text(function(column) { return column; });

      // create a row for each object in the data
      var rows = tbody.selectAll("tr")
          .data(data)
          .enter()
          .append("tr");

      console.log('rows')
      console.log(rows)
      console.log(this.dataset)

      // create a cell in each row for each column
      var cells = rows.selectAll("td")
          .data(function(row) {
              return columns.map(function(column) {
                  return {column: column, value: row[column]};
              });
          })
          .enter()
          .append("td")
          .attr("style", "font-family: Courier") // sets the font style
              .html(function(d) { return d.value; });
      console.log('cells')
      console.log(cells)
      
      return table;
    },
  }

}
</script>

<style>

</style>