<template>
  <div class="mx-auto">
    <!-- <div class="text-center mb-5">Bar Plot component</div> -->
    <div class="flex flex-wrap p-5 mx-auto w-full">
      <div id="group-by" class="px-5 mx-auto">
        <div class="font-semibold pb-2">Group by:</div>
        <SelectButton v-model="grouped_by" :options="grouped_by_options"/>
      </div>
      <div id="group-by" class="px-5 mx-auto">
        <div class="font-semibold pb-2">Bar chart type:</div>
        <SelectButton v-model="chart_type" :options="chart_type_options"/>
      </div>
    </div>

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
import DataService from "@/services/DataService.js";

import ProgressSpinner from 'primevue/progressspinner';
import SelectButton from 'primevue/selectbutton';

export default {
  name: "BarPlot",
  components: {
    ProgressSpinner,
    SelectButton,
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

      chart_type: 'Grouped',
      chart_type_options: ['Grouped', 'Stacked'],

      grouped_by: 'Time',
      grouped_by_options: ['Gene', 'Time'],

    }
  },
  created() {
  },
  async mounted() {
    console.log('mounting')
    this.genesData = this.genes.map((d) => d.name)
    this.initialize_bar_plot()
    await this.load_chart()
    console.log('mounted() > finished update plot')
    this.complete = true
  },
  async updated () {
    // Check differential 
    this.genesData = this.genes.map((d) => d.name)
    // Don't need await?  Last command in function
    // this.update_grouped_bar_plot()
    await this.load_chart()
  },
  methods: {
    async get_dataset() {
      // Idea: Check for cached results?
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
        //.text("Time Point (ZT)");

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
    async load_chart() {
      if (this.chart_type == 'Grouped') {
        await this.update_grouped_bar_plot(this.grouped_by)
      } else if (this.chart_type == 'Stacked') {
        await this.update_stacked_bar_plot(this.grouped_by)
      }

    },
    async update_grouped_bar_plot(grouped_by) {
      const debug = false 

      if (this.genesData.length) {
        await this.get_dataset()
      } else {
        this.dataset = []
      }

      let time_points = [10, 2, 20].map(el => el.toString())
      var collator = new Intl.Collator([], {numeric: true});
      time_points.sort((a, b) => collator.compare(a, b));

      const dataset_filtered = this.dataset
        .filter(d => time_points.includes(d.time_point.toString()))
      const y_max = d3.max(dataset_filtered, d => +d.gene_expression)

      const gene_groups_map = dataset_filtered.map((d) => ({
        time_point: d.time_point.toString(),
        gene_expression: d.gene_expression,
        gene_group: `${d.gene_name}_${d.group_name}`
        })
      )

      let data, groups, subgroups

      if (grouped_by == 'Gene') {
        if (debug) console.log('grouped_by Gene')
        this.svg.select('.x-label').text('Gene and Group')
        subgroups = time_points
        data = d3.group(gene_groups_map, d => `${d.gene_group}`)
        groups = Array.from(data.keys())

        for (const key of data.keys()) {
          data.set(key, data.get(key).map(el => ({
            key: el.time_point, value: el.gene_expression
          })))
        }
      } else if (grouped_by == 'Time') {
        if (debug) console.log('grouped_by Time')
        this.svg.select('.x-label').text('Time Point (ZT)')
        groups = time_points
        data = d3
          .group(gene_groups_map, d => `${d.time_point}`)
        const firstKey = data.keys().next().value
        subgroups = data.get(firstKey).map(el => el.gene_group)
        
        for (const key of data.keys()) {
          data.set(key, data.get(key).map(el => ({
            key: el.gene_group, value: el.gene_expression})))
        }
      }
      if (debug) {
        console.log('groups')
        console.log(groups)
        console.log('subgroups')
        console.log(subgroups)
      }
      
      var color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create the X axis
      var x = this.x
      x.domain(groups)
        .padding([0.1])

      this.svg.selectAll(".myXaxis").transition()
        .duration(1000)
        .call(this.xAxis);

      // Another scale for subgroup position?
      let xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05])

      // Create the Y axis
      var y = this.y
      y.domain([0, y_max])
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(1000)
          .call(this.yAxis)

      var updateInterval = 500

      if (debug) {
        console.log("======================")
        console.log(data)
        console.log("======================")
      }
      
      this.svg.selectAll("g.group").remove()

      // Display grouped bars
      this.svg
        .selectAll("g.group")
        .data(data)
        .join(
          (enter) => {
            if (debug) {
              console.log('enter')
              console.log(enter)
            }
            enter.append('g')
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .attr("class", "group")
              .selectAll("rect.group-rect")
              .data(d => d[1])
              .join(
                (enter) => {
                  if (debug) {
                    console.log('enter > enter')
                    console.log(enter)
                  }
                  enter.append('rect')
                    .attr("class", 'group-rect')
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key))
                    .on("mouseover", (d,i) => {
                      if (debug) {
                        console.log('mouseover')
                        console.log(d)
                        console.log(i)
                      }
                      let text
                      let parentVal = d.path[1].__data__[0]
                      if (grouped_by == 'Gene') {
                        text = `${parentVal}\nZT${i.key}\nExpr: ${Math.round(i.value)}`          
                      } else if (grouped_by == 'Time') {
                        text = `${i.key}\nZT${parentVal}\nExpr: ${Math.round(i.value)}`
                      }
                      if (debug) {
                        console.log('parentVal: ' + parentVal)
                        console.log(typeof(parentVal))
                        console.log('x(parentVal): ' + x(parentVal))
                        console.log('i.key: ' + i.key)
                        console.log(typeof(i.key))
                        console.log('xSubgroup(i.key): ' + xSubgroup(i.key))
                        console.log(subgroups)
                      }
                      if (d.y > 1) {
                        this.svg.append('g')
                          .attr('class', 'tooltip')
                          .attr("transform", `translate(${
                            x(parentVal) + xSubgroup(i.key) + xSubgroup.bandwidth()/2},
                            ${y(i.value) - 63})`)
                          .call(popover, text, i.key)
                      }
                    })
                    .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
                },
                (update) => {
                  if (debug) {
                    console.log('enter > update')
                    console.log(update)
                  }
                  update
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                },
                (exit) => {
                  if (debug) {
                    console.log('enter > exit')
                    console.log(exit)
                  }
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
            if (debug) {
              console.log('update')
              console.log(update)
            }
            update
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .selectAll(".group-rect")
              .data(d => d[1])
              .join(
                (enter) => {
                  if (debug) {
                    console.log('update > enter')
                    console.log(enter)
                  }                  
                  enter.append('rect')
                    .attr("class", "group-rect")
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                },
                (update) => {
                  if (debug) {
                    console.log('update > update')
                    console.log(update)
                  }
                  update
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                  
                },
                (exit) => {
                  if (debug) {
                    console.log('update > exit')
                    console.log(exit)
                  }
                  exit
                    .style('opacity', 0)
                    .transition()
                    .ease(Math.sqrt)
                    .duration(updateInterval)
                    .remove()
                }
              )
          },
          (exit) => {
            if (debug) {
              console.log('exit')
              console.log(exit)
            }
            
            exit
              .selectAll(".group-rect")
              .data(d => d[1])
              .join(
                (exit) => {
                  if (debug) {
                    console.log('exit > exit')
                    console.log(exit)
                  }
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
      
      // Legend color
      var legendX = this.width*this.drawable_width_scale+20
      this.svg.selectAll(".legendLines")
          .data(subgroups)
          .join(
            (enter) => {
              enter.append('line')
                .attr('class', 'legendLines')
                .attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) => i*25 )
                .attr('y2', (d,i) => i*25 )
                .style("stroke", (d) => color(d))
                .style("stroke-width", 1.5)
            },
            (update) => {
              update.attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) =>  i*25 )
                .attr('y2', (d,i) =>  i*25 )
                .style("stroke", (d) => color(d))
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
          .data(subgroups)
          .join(
            (enter) => {
              enter.append('text')
                .attr('class', 'legendText')
                .attr('x', legendX+20)
                .attr('y', (d,i) => i*25)
                .style('fill', (d) => color(d))
                .text(d => d)
                .attr('text-anchor', 'left')
                .attr('font-size', '0.7em')
                .style('fill-opacity', 1)
            },
            (update) => {
              update.attr('y', (d,i) => i*25 )
                .style('fill', (d) => color(d))
                .text(d => d)
            },
            (exit) => {
              exit.transition()
                .ease(Math.sqrt)
                .duration(updateInterval)
                .style('fill-opacity', 0)
                .remove()

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
        path.attr("d", `M${-w / 2 - 10},5 H${w / 2 + 10},H ${w / 2 + 10} v ${h+20} h ${-w/2-5} l-5,5 l-5,-5 h${-w/2-5} z`)
      }
      return;

    },
    async update_stacked_bar_plot(grouped_by) {
      const debug = true 
      if (debug) console.log('update_stacked_bar_plot: ' + grouped_by)

      if (this.genesData.length) {
        await this.get_dataset()
      } else {
        this.dataset = []
      }

      let time_points = [10, 2, 20].map(el => el.toString())
      var collator = new Intl.Collator([], {numeric: true});
      time_points.sort((a, b) => collator.compare(a, b));

      const dataset_filtered = this.dataset
        .filter(d => time_points.includes(d.time_point.toString()))
      let y_max = d3.max(dataset_filtered, d => +d.gene_expression)

      console.log('dataset_filtered')
      console.log(dataset_filtered)

      const gene_groups_map = dataset_filtered.map((d) => ({
        time_point: d.time_point.toString(),
        gene_expression: d.gene_expression,
        gene_group: `${d.gene_name}_${d.group_name}`
        })
      )

      let data, groups, subgroups, exp_sum
      let legendPrefix

      if (grouped_by == 'Gene') {
        if (debug) console.log('grouped_by Gene')
        this.svg.select('.x-label').text('Gene and Group')
        legendPrefix = ""
        subgroups = time_points
        data = d3.group(gene_groups_map, d => `${d.gene_group}`)
        groups = Array.from(data.keys())

        for (const key of data.keys()) {
          data.set(key, data.get(key).map(el => ({
            key: el.time_point, value: el.gene_expression
          })))
        }
      } else if (grouped_by == 'Time') {
        // Time point on X axis
        // Stacks are Genes
        if (debug) console.log('grouped_by Time')
        this.svg.select('.x-label').text('Time Point (ZT)')
        legendPrefix = "ZT "
        groups = time_points

        const time_groupings = Array.from(d3.group(gene_groups_map, d=> `${d.time_point}`))
        data = []

        time_groupings.forEach((e) => {
          const time_obj = {}
          time_obj.group = e[0]
          exp_sum = 0
          e[1].forEach((g) => {
            time_obj[g.gene_group] = g.gene_expression
            exp_sum += g.gene_expression
          })
          if (exp_sum > y_max) y_max = exp_sum
          data.push(time_obj)
        })

        subgroups = time_groupings[0][1].map(el => el.gene_group)
        
        // for (const key of data.keys()) {
        //   console.log
        //   data.set(key, data.get(key).map(el => ({
        //     key: el.gene_group, value: el.gene_expression})))
        // }
      }
      if (debug) {
        console.log('groups')
        console.log(groups)
        console.log('subgroups')
        console.log(subgroups)
        console.log('gene_groups_map')
        console.log(gene_groups_map)
        console.log('data')
        console.log(data)

      }
      
      // Color scheme
      // ALF vs TRF similar shade of color between each gene
      var color = d3.scaleOrdinal(d3.schemeCategory10);

      var updateInterval = 500

      // Create the X axis
      var x = this.x
      x.domain(groups)
        .padding([0.1])

      this.svg.selectAll(".myXaxis").transition()
        .duration(updateInterval)
        .call(this.xAxis);

      // Another scale for subgroup position?
      let xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05])

      // Create the Y axis
      var y = this.y
      y.domain([0, y_max])
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(updateInterval)
          .call(this.yAxis)

      const stackedData = d3.stack().keys(subgroups)(data)
      // Add subgroup key to each rect to track color 
      stackedData.forEach(e => {
        e.forEach(g => {
          g.key = e.key
        })
      })

      if (debug) {
        console.log("======================")
        console.log(data)
        // console.log("======================")
        console.log(stackedData)
        console.log("======================")

      }

      this.svg.selectAll("g.group").remove()

      // Display grouped bars
      this.svg
        .selectAll("g.group")
        .data(stackedData)
        .join(
          (enter) => {
            if (debug) {
              console.log('enter')
              console.log(enter)
            }
            enter.append('g')
              // .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .attr("class", "group")
              .attr("fill", d => {
                // console.log('enter.append(g)..fill')
                // console.log(d);
                return color(d.key)})
              .selectAll("rect.group-rect")
              .data(d => d)
              .join(
                (enter) => {
                  if (debug) {
                    console.log('enter > enter')
                    console.log(enter)
                  }
                  enter.append('rect')
                    .attr("class", 'group-rect')
                    .attr("x", d => {
                      console.log('rect.x')
                      console.log(d);
                      // console.log('parentNode')
                      // console.log(d.parentNode)
                      return x(d.data.group)})
                    .attr("y", d => y(d[1]))
                    .attr("width", x.bandwidth())
                    .attr("height", d => y(d[0]) - y(d[1]))
                    // .attr("fill", d => color(d.key))
                    .on("mouseover", (e,d) => {
                      // const subgroupName = d3.select(this.parentNode)
                      // const subgroupValue = d.data[subgroupName];
                      if (debug) {
                        console.log('mouseover')
                        console.log(e)
                        console.log(d)
                        
                      }
                      let text  
                      let group = d.data.group
                      let subgroup = d.key

                      if (grouped_by == 'Gene') {
                        text = `${group}\nZT${subgroup}\nExpr: ${Math.round(d.data[subgroup])}`          
                      } else if (grouped_by == 'Time') {
                        text = `${subgroup}\nZT${group}\nExpr: ${Math.round(d.data[subgroup])}`
                      }
                      if (debug) {
                        console.log('text')
                        console.log(text)
                      }

                      if (y(d[0]) > 1) {
                        let xCoord = x(group) + x.bandwidth()/2
                        let yCoord = y(d[0]) - y(d[1])
                        console.log('xCoord: ' + xCoord)
                        console.log('yCoord: ' + yCoord)
                        this.svg.append('g')
                          .attr('class', 'tooltip')
                          .attr("transform", `translate(${
                            x(group) + x.bandwidth()/2},
                            ${y(d[1]) - 58})`)
                          .call(popover, text, subgroup)
                      }
                    })
                    .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
                },
                (update) => {
                  if (debug) {
                    console.log('enter > update')
                    console.log(update)
                  }
                  update
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                },
                (exit) => {
                  if (debug) {
                    console.log('enter > exit')
                    console.log(exit)
                  }
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
            if (debug) {
              console.log('update')
              console.log(update)
            }
            update
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .selectAll(".group-rect")
              .data(d => d[1])
              .join(
                (enter) => {
                  if (debug) {
                    console.log('update > enter')
                    console.log(enter)
                  }                  
                  enter.append('rect')
                    .attr("class", "group-rect")
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                },
                (update) => {
                  if (debug) {
                    console.log('update > update')
                    console.log(update)
                  }
                  update
                    .attr("x", d => xSubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value))
                    .attr("fill", d => color(d.key));
                  
                },
                (exit) => {
                  if (debug) {
                    console.log('update > exit')
                    console.log(exit)
                  }
                  exit
                    .style('opacity', 0)
                    .transition()
                    .ease(Math.sqrt)
                    .duration(updateInterval)
                    .remove()
                }
              )
          },
          (exit) => {
            if (debug) {
              console.log('exit')
              console.log(exit)
            }
            
            exit
              .selectAll(".group-rect")
              .data(d => d[1])
              .join(
                (exit) => {
                  if (debug) {
                    console.log('exit > exit')
                    console.log(exit)
                  }
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
      
      // Legend color
      var legendX = this.width*this.drawable_width_scale+20
      this.svg.selectAll(".legendLines")
          .data(subgroups)
          .join(
            (enter) => {
              enter.append('line')
                .attr('class', 'legendLines')
                .attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) => i*25 )
                .attr('y2', (d,i) => i*25 )
                .style("stroke", (d) => color(d))
                .style("stroke-width", 1.5)
            },
            (update) => {
              update.attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) =>  i*25 )
                .attr('y2', (d,i) =>  i*25 )
                .style("stroke", (d) => color(d))
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
          .data(subgroups)
          .join(
            (enter) => {
              enter.append('text')
                .attr('class', 'legendText')
                .attr('x', legendX+20)
                .attr('y', (d,i) => i*25)
                .style('fill', (d) => color(d))
                .text(d => `${legendPrefix}${d}`)
                .attr('text-anchor', 'left')
                .attr('font-size', '0.7em')
                .style('fill-opacity', 1)
            },
            (update) => {
              update.attr('y', (d,i) => i*25 )
                .style('fill', (d) => color(d))
                .text(d => d)
            },
            (exit) => {
              exit.transition()
                .ease(Math.sqrt)
                .duration(updateInterval)
                .style('fill-opacity', 0)
                .remove()

            }
          )
           
      function popover(g, value, key) {
        console.log('popover')
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
        console.log(x, y, w, h)
        text.attr("transform", `translate(${-w / 2},${15 - y})`);
        path.attr("d", `M${-w / 2 - 10},5 H${w / 2 + 10},H ${w / 2 + 10} v ${h+20} h ${-w/2-5} l-5,5 l-5,-5 h${-w/2-5} z`)
      }
      return;

    },

  }

}
</script>

<style>

</style>