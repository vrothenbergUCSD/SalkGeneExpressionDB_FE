<template>
  <div id="bar" class="mx-auto">
    <!-- <div class="text-center mb-5">Bar Plot component</div> -->
    <div class="flex flex-wrap p-5 mx-auto w-full">
      <div id="group-by" class="px-5 mx-auto">
        <div class="font-semibold pb-2">Group by:</div>
        <SelectButton v-model="grouped_by" :options="grouped_by_options"/>
      </div>
      <div id="chart-type" class="px-5 mx-auto">
        <div class="font-semibold pb-2">Bar chart type:</div>
        <SelectButton v-model="chart_type" :options="chart_type_options"/>
      </div>
    </div>

    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>
    
    <div id="plot-area" class="mt-10" v-show="this.complete">
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import DataService from "@/services/DataService.js";

import ProgressSpinner from 'primevue/progressspinner';
import SelectButton from 'primevue/selectbutton';
import InputSwitch from 'primevue/inputswitch'
import _ from 'underscore';


const animationInterval = 250
// Custom function, reduces redundant code for transitions
// Opacity transition, fade in / out
d3.selection.prototype.transition_attributes = function(
  attr_name, opacity, duration=animationInterval) {
  this.transition()
      .ease(Math.sqrt)
      .duration(duration)
      .attr(attr_name, opacity)
  return this
}

// Add toggle visibility SVG icons
d3.selection.prototype.append_eyes = function() {
  this.append('svg:image')
    .attr('class', 'eye')
    .attr("xlink:href", eyeUrl)
    .attr('type', "image/svg+xml")
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 10)
    .attr('height', 10)
    .attr('opacity', 1)
  this.append('svg:image')
    .attr('class', 'eye-off')
    .attr("xlink:href", eyeOffUrl)
    .attr('type', "image/svg+xml")
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 10)
    .attr('height', 10)
    .attr('opacity', 0)
  return this
}

export default {
  name: "BarPlot",
  components: {
    ProgressSpinner,
    SelectButton,
    InputSwitch,
  },
  props: {
    genes: Array,
    datasets: Object,
  },
  data() {
    return {
      // Datasets
      genes_str_arr: null,

      // Deep copy datasets (Needed?)
      gene_expression_data_tables: [],
      gene_metadata: [],
      sample_metadata_tables: [],

      // Statistics
      expression_merged: [],
      expression_averaged: [],
      expression_normalized: [],
      expression_normalized_averaged: [],
      expression_normalized_flattened: [],

      groups: [],
      subgroups: [],

      // Plot variables
      margin: null,
      width: null,
      height: null,
      drawable_width_scale: null,
      drawable_height_scale: null,
      legendX: null, 
      x: null,
      xAxis: null,
      xSubgroup: null,
      y: null,
      yAxis: null,
      svg: null,
      animationInterval: 250,
      color: null,

      // genesArr: null,

      complete: false,
      showReplicatePoints: false,
      showErrorBars: true,

      chart_type: 'Grouped',
      chart_type_options: ['Grouped', 'Stacked'],

      grouped_by: 'Time',
      grouped_by_options: ['Gene', 'Time'],

    }
  },
  created() {
    console.log('BarPlot created')
  },
  async mounted() {
    console.log('BarPlot mounting')
    const start = Date.now()

    this.initialize_bar_plot()

    if (this.datasets) {
      this.update_datasets()
    }
    // await this.get_dataset()
    // this.load_chart()
    // const svgElem = document.getElementById('plot-svg')
    // svgElem.addEventListener('load', this.legend())
    
    this.complete = true
    console.log('BarPlot mounted, time elapsed:')
    console.log(Date.now() - start)

  },
  async updated () {
    console.log('BarPlot updated')
    // // Check differential 
    // if (this.genesArr != this.genes) {
    //   this.genesArr = this.genes
    //   this.genesData = this.genes.map((d) => d.name)
    //   await this.get_dataset()
    // }
      
    // this.load_chart()
  },
  watch: {
    datasets() {
      console.log('%%%%%%%%%%%%%%%%')
      console.log('watch: datasets')
      this.update_datasets()
      console.log('%%%%%%%%%%%%%%%%')
    }
  },
  methods: {
    update_datasets() {
      // BUG: e.time_point.split is not a function at LinePlot.vue:258:48 
      // Already processed data after loading Bar Plot and adding new tissue dataset
      console.log('update_datasets')
      const start = Date.now()
      this.genes_str_arr = this.genes.map((d) => d.name)
      // console.log('this.genes_str_arr')
      // console.log(this.genes_str_arr)
      if (this.datasets) {
        // console.log('this.datasets')
        // console.log(this.datasets)

        this.expression_merged = []
        // Deep copy!
        this.gene_expression_data_tables = JSON.parse(JSON.stringify(this.datasets.gene_expression_data_tables))
        this.gene_metadata = JSON.parse(JSON.stringify(this.datasets.gene_metadata))
        this.sample_metadata_tables = JSON.parse(JSON.stringify(this.datasets.sample_metadata_tables))

        this.gene_expression_data_tables.forEach((e) => {
          // console.log('this.gene_expression_data_tables.forEach')
          // console.log(e)
          const table = e.table_name
          const table_split = table.split('_')
          e.owner = table_split.at(-1)
          e.experiment = table_split.at(0)
          e.year = table_split.at(1)          
          
          // "TRF_2018_Mouse_Adrenal_gene_expression_data_UCb0eBc2ewPjv9ipwLaEUYSwdhh1"
          // console.log('table ', table)
          let sample_table = table.replace('gene_expression_data', 'sample_metadata')
          // console.log('sample_table', sample_table)
          let expression_data = e.data
          let sample_data = this.sample_metadata_tables.find(obj => {
            return obj.table == sample_table
          }).data
          // console.log('sample_data')
          // console.log(sample_data)

          const merged_data = expression_data.map(itm => ({
              ...sample_data.find((item) => (item.sample_name == itm.sample_name) && item),
              ...itm
          }))
          // console.log('merged_data')
          // console.log(merged_data)
          e.data = merged_data
          e.data.forEach(itm => itm.table = table)

          const species = [...new Set(e.data.map(item => item.species))];
          if (species.length > 1) {
            // More than 1 species in a dataset, shouldn't happen!
            console.error('WARNING: More than 1 species in ', table)
          }
          e.species = species[0]

          const age_months = [...new Set(e.data.map(item => item.age_months))];
          if (age_months.length > 1) {
            // Samples vary in age
            console.error('WARNING: More than 1 age in ', table)
          }
          e.age_months = age_months[0]

          const data_type = [...new Set(e.data.map(item => item.data_type))];
          if (data_type.length > 1) {
            // More than 1 data type
            console.error('WARNING: More than 1 data type in ', table)
          }
          e.data_type = data_type[0]

          const gender = [...new Set(e.data.map(item => item.gender))];
          if (gender.length > 1) {
            // More than 1 gender
            console.error('WARNING: More than 1 gender in ', table)
          }
          e.gender = gender[0]

          const tissue = [...new Set(e.data.map(item => item.tissue))];
          if (tissue.length > 1) {
            // More than 1 gender
            console.error('WARNING: More than 1 tissue in ', table)
          }
          e.tissue = tissue[0]
          
          this.expression_merged = this.expression_merged.concat(merged_data)
        })

        this.expression_merged.forEach((e) => {
          e.time_point = parseInt(e.time_point.split('ZT')[1])
          e.replicate = e.sample_name.split('-').at(-1)
          e.identifier = `${e.tissue.replaceAll(' ', '-')}_${e.gene_id}_${e.group_name}`
        })
      
        // const grouped = _.groupBy(this.expression_merged, function(e){
        //   return `${e.tissue.replaceAll(' ', '-')}_${e.gene_id}_${e.group_name}_ZT${e.time_point}`
        // })
        // console.log('grouped')
        // console.log(grouped)
       
        // this.expression_averaged = _.mapObject(grouped, function(val, key) {
        //   let o = JSON.parse(JSON.stringify(val[0]))
        //   o.avg = _.reduce(val, function(memo, v) { 
        //     return memo + v.gene_expression; 
        //   }, 0) / val.length
        //   return o
        // });

        const grouped_tissue = _.groupBy(this.expression_merged, e => `${e.tissue.replaceAll(' ', '-')}`)
        // console.log('grouped_tissue')
        // console.log(grouped_tissue)

        const grouped_tissue_gene = Object.keys(grouped_tissue).map((key) => {
          return [key, _.groupBy(grouped_tissue[key], e => `${e.gene_id}`)]
        })

        // console.log('grouped_tissue_gene')
        // console.log(grouped_tissue_gene)

        const grouped_tissue_gene_groupname = grouped_tissue_gene.map((tissue) => {
          // console.log(tissue)
          return [tissue[0], Object.keys(tissue[1]).map((key) => {
            // console.log(key) // gene_id
            return [key, _.groupBy(tissue[1][key], function(e) {
              // console.log(e)
              return `${e.group_name}`
            })]
          })]
        })

        // console.log('grouped_tissue_gene_groupname')
        // console.log(grouped_tissue_gene_groupname)

        grouped_tissue_gene_groupname.forEach((tissue) => {
          // console.log(tissue[0])
          tissue[1].forEach((gene) => {
            gene[1] = Object.entries(gene[1])
            gene[1].forEach((groupname) => {
              // console.log('STATS')
              // console.log('groupname', groupname)
              const max = Math.max.apply(Math, groupname[1].map(
                function(o) { return o.gene_expression; }))
              const min = Math.min.apply(Math, groupname[1].map(
                function(o) { return o.gene_expression; }))
              groupname[1].forEach((sample) => {
                sample.gene_expression_norm = (sample.gene_expression - min) / (max - min)
              })

              const mean = _.reduce(groupname[1], function(memo, v) { 
                return memo + v.gene_expression; 
              }, 0) / groupname[1].length

              // console.log('mean', mean)

              const groupname_stats = {
                min: min,
                max: max, 
                amplitude: max-min,
                mean: mean,
              }
              // console.log(groupname_stats)
              groupname.push(groupname_stats)
              // console.log(groupname)
            })
          })
        })

        this.expression_normalized = grouped_tissue_gene_groupname
        // console.log('this.expression_normalized')
        // console.log(this.expression_normalized)

        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized.map(e => e[1]))
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => e[1]))
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => e[1]))

        // console.log('this.expression_normalized_flattened')
        // console.log(this.expression_normalized_flattened)

        const grouped_norm = _.groupBy(this.expression_normalized_flattened, e => 
          `${e.gene_id}_${e.tissue.replaceAll(' ', '-')}_${e.group_name}_ZT${e.time_point}`)
        // console.log('grouped_norm')
        // console.log(grouped_norm)

        this.expression_normalized_averaged = _.mapObject(grouped_norm, function(val, key) {
          let o = JSON.parse(JSON.stringify(val[0]))

          o.gene_expression_avg = _.reduce(val, function(memo, v) { 
            return memo + v.gene_expression; 
          }, 0) / val.length

          // Average the normalized gene expressions
          o.gene_expression_norm_avg = _.reduce(val, function(memo, v) { 
            return memo + v.gene_expression_norm; 
          }, 0) / val.length
          o.gene_expression_norm = o.gene_expression_norm_avg

          // console.log('o.avg', o.avg)
          
          // o.std_dev = _.reduce(val, function(memo, v) {
          //   return memo + Math.pow((v.gene_expression_norm - o.gene_expression_norm_avg),2)
          // }, 0) / val.length

          o.std_dev = Math.sqrt(_.reduce(val, function(memo, v) { 
            return memo + Math.pow((v.gene_expression_norm - o.gene_expression_norm_avg), 2); 
          }, 0) / val.length)

          // console.log('o.std_dev', o.std_dev)

          o.std_err = o.std_dev / Math.sqrt(val.length)

          // console.log('o.std_err', o.std_err)

          return o
        });

        // console.log('this.expression_normalized_averaged')
        // console.log(this.expression_normalized_averaged)

        // console.log('average_expressions')
        // console.log(average_expressions)

        // console.log('this.expression_normalized_averaged')
        // console.log(this.expression_averaged)
        // console.log(Object.entries(this.expression_averaged))
        this.expression_normalized_averaged = Object.entries(this.expression_normalized_averaged).map(e => e[1])
        // console.log(this.expression_normalized_averaged)
        this.avgPoints = [...this.expression_normalized_averaged]
        this.avgPoints.forEach(e => e.visible = 1)
        this.errorBarsData = [...this.expression_normalized_averaged]
        this.errorBarsData.forEach(e => e.visible = (this.showErrorBars ? 1 : 0))
        this.replicatePoints = this.expression_normalized_flattened
        this.replicatePoints.forEach(e => e.visible = (this.showReplicatePoints ? 1 : 0))
        this.allPoints = this.avgPoints.concat(this.replicatePoints)

        // console.log('After mutation')
        // console.log(this.gene_expression_data_tables)

        this.sumstat = d3
          .group(this.expression_normalized_averaged, 
          d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);

        this.sumstat_visibility = Object.fromEntries(
          new Map([...this.sumstat.keys()].map(e => [e, 1])))

        // console.log('this.sumstat_visibility')
        // console.log(this.sumstat_visibility)

        // this.sumstat_dots = d3
        //   .group(this.expression_normalized_flattened, 
        //   d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);
    
        this.categories = [...new Set(
          [...this.sumstat.keys()] 
          .map(e => e.split('_').slice(0,-1).join('_'))
          )]

        this.cat_map = new Map(this.categories.map((d,i) => [
          d, i/this.categories.length
        ]))

        this.load_chart()
        // this.legend()
      }
      
      const elapsed = Date.now() - start
      console.log('update_datasets time elapsed', elapsed)
    },
    initialize_bar_plot() {
      // set the dimensions and margins of the graph
      this.margin = {top: 30, right: 30, bottom: 140, left: 80}
      this.width = 800 - this.margin.left - this.margin.right,
      this.height = 500 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 0.75
      this.drawable_height_scale = 1
      this.svg = d3.select("#plot-area")
          .append("svg")
            .attr("id", "plot-svg")
            .attr("viewBox", 
              `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
            // .attr("width", this.width + this.margin.left + this.margin.right)
            // .attr("height", this.height + this.margin.top + this.margin.bottom)
            // .attr("class", "mx-auto")
            .attr("preserveAspectRatio", "xMinYMid")
          .append("g")
            .attr("transform", 
              `translate(${this.margin.left},${this.margin.top})`);

      // Initialize X axis
      this.x = d3.scaleBand().range([0,this.width*this.drawable_width_scale])
      this.xAxis = d3.axisBottom().scale(this.x);
      this.svg.append("g")
          .attr("transform", `translate(0, ${this.height*this.drawable_height_scale})`)
          .attr("class","myXaxis")

      // X axis label
      this.svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", this.width*this.drawable_width_scale / 2)
        .attr("y", this.height*this.drawable_height_scale + 40)
        .text("Time Point (ZT)");

      // Initialize Y axis
      this.y = d3.scaleLinear().range([this.height*this.drawable_height_scale, 0]);
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

      // Bar groups grouping element
      this.svg.append('g')
        .attr('id', 'barGroups')

      this.legendX = this.width*this.drawable_width_scale + 5
      this.legendY_spacing = 15
      // Legend 
      this.svg.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${this.legendX}, 0)`)

    },
    load_chart() {
      console.log('load_chart')
      if (this.chart_type == 'Grouped') {
        this.update_grouped_bar_plot()
      }
    },
    update_grouped_bar_plot() {
      console.log('update_grouped_bar_plot')
      const debug = false 
      const start = Date.now()

      // if (this.genesData.length) {
      //   await this.get_dataset()
      // } else {
      //   this.dataset = []
      // }
      // console.log('this.expression_merged')
      // console.log(this.expression_merged)
      // console.log('this.expression_normalized_flattened')
      // console.log(this.expression_normalized_flattened)

      console.log('this.expression_normalized_averaged')
      console.log(this.expression_normalized_averaged)

      const time_points = [...new Set(this.expression_normalized_averaged.map(e => e.time_point))]
        .map(el => el.toString())
      // console.log(time_points)

      // let time_points = [10, 2, 20].map(el => el.toString())
      var collator = new Intl.Collator([], {numeric: true});
      time_points.sort((a, b) => collator.compare(a, b));

      // console.log(time_points)

      // const dataset_filtered = this.dataset
      //   .filter(d => time_points.includes(d.time_point.toString()))
      // const y_max = d3.max(dataset_filtered, d => +d.gene_expression)

      // const gene_groups_map = dataset_filtered.map((d) => ({
      //   time_point: d.time_point.toString(),
      //   gene_expression: d.gene_expression,
      //   gene_group: `${d.gene_name}_${d.group_name}`
      //   })
      // )

      let data, groups, subgroups

      if (this.grouped_by == 'Gene') {
        this.svg.select('.x-label').text('Tissue, Gene, Group')
        subgroups = time_points
        data = d3.group(gene_groups_map, d => `${d.gene_group}`)
        groups = Array.from(data.keys())

        for (const key of data.keys()) {
          data.set(key, data.get(key).map(el => ({
            key: el.time_point, value: el.gene_expression
          })))
        }
      } else if (this.grouped_by == 'Time') {
        console.log('Time')
        this.svg.select('.x-label').text('Time Point (ZT)')
        groups = time_points
        // data = d3
        //   .group(this.expression_normalized_averaged_flattened, d => `${d.time_point}`)
        
        const time_groups = _.groupBy(this.expression_normalized_averaged, e => `${e.time_point}`)
        data = Object.keys(time_groups).map((key) => {
          const grouping = _.groupBy(time_groups[key], e => `${e.identifier}`)
          return [key, grouping]
        })

        // console.log('time_groups')
        // console.log(time_groups)
        // const firstKey = data.keys().next().value
        // console.log('firstKey')
        // console.log(firstKey)
        // subgroups = data.get(firstKey).map(el => el.gene_group)  
        subgroups = [...new Set(... data.map(e => Object.keys(e[1])) )]
        // console.log(subgroups)
        data.forEach(d => {
          const time_key = d[0]
          const groupings = d[1]

          d[1] = Object.keys(d[1]).map((id) => {
            return {key:id, value:d[1][id][0]}
          })
        })
        // for (const key of data.keys()) {
        //   data.set(key, data.get(key).map(el => ({
        //     key: el.gene_group, value: el.gene_expression})))
        // }
      }
      
      // var color = d3.scaleSequential(d3.interpolateWarm)
      this.color = d3.scaleSequential(d3.interpolateWarm)
      // this.color = color2
      // var color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create the X axis
      // this.x.domain([0, d3.max])
      // this.x.domain([0, d3.max(this.expression_merged, (d) => d.time_point )])

      this.x.domain(groups)
        .padding([0.1])
      var x = this.x
      this.svg.selectAll(".myXaxis").transition()
        .duration(this.animationInterval)
        .call(this.xAxis);

      // Subgroup position scale
      this.xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05])

      // Create the Y axis
      this.y.domain([0, 1])
      var y = this.y
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(this.animationInterval)
          .call(this.yAxis)
      
      // this.svg.selectAll("g.group").remove()
      console.log('data')
      console.log(data)

      // Display grouped bars
      this.svg.select("#barGroups")
        .selectAll('.bar-group')
        .data(data)
        .join(
          (enter) => {
            enter.append('g')
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .attr("class", "bar-group")
              .selectAll("rect.group-rect")
              .data(d => d[1])
              .join(
                (enter) => {
                  enter.append('rect')
                    .attr("class", 'group-rect')
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.key))
                    .transition_attributes('fill-opacity', 1)
                    .on("mouseover", (evt, d) => {
                      console.log('mouseover')
                      console.log(evt)
                      console.log(d)
                      if (evt.y > 1) {
                        let parentVal
                        if (this.grouped_by == 'Time') 
                           parentVal = d.value.time_point.toString()
                        console.log(parentVal)

                        console.log('height', this.height - y(d.value.gene_expression_norm_avg))

                        console.log('y():', y(d.value.gene_expression_norm_avg))
                        
                        this.svg.append('g')
                          .attr('class', 'tooltip')
                          .call(this.popover, this.popover_text(d), d)
                      }
                    })
                    .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
                },
                (update) => {
                  update
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.key))
                    .transition_attributes('fill-opacity', 1)
                },
                (exit) => {
                  exit.transition_attributes('fill-opacity', 0).remove()
                }
              )
          },
          (update) => {
            update
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .selectAll(".group-rect")
              .data(d => d[1])
              .join(
                (enter) => {              
                  enter.append('rect')
                    .attr("class", "group-rect")
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.key));
                },
                (update) => {
                  update
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => this.y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.key))
                    .transition_attributes('fill-opacity', 1)
                  
                },
                (exit) => exit.transition_attributes('fill-opacity',0).remove()
              )
          },
          (exit) => {
            exit
              .selectAll(".group-rect")
              .data(d => d[1])
              .join(
                (exit) => {
                  exit.transition_attributes('fill-opacity', 0).remove()
                },
              )
              .transition_attributes('opacity', 0).remove()
          },
        )
      
   
           
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
      //   path.attr("d", `M${-w / 2 - 10},5 H${w / 2 + 10},H ${w / 2 + 10} v ${h+20} h ${-w/2-5} l-5,5 l-5,-5 h${-w/2-5} z`)
      // }
      console.log('update_grouped_bar_plot time elapsed: ')
      console.log(Date.now() - start)

      return;

    },
    getHSL(name, gene=false) {
      console.log('getHSL')
      console.log(name)
      // Differentiates groups by making one darker and one lighter
      const shade_factor = 3
      const cat = name.split('_').slice(0,-1).join('_')
      const group = name.split('_').at(-1)
      let hsl = d3.hsl(this.color(this.cat_map.get(cat)))
      // If gene flag is true, use unshaded base color 
      if (!gene) {
        const factor = 1 + (((group === 'ALF') - 0.5) / shade_factor)
        hsl.l *= factor
      }
      return hsl
    },
    popover_text(d) {
      console.log('popover_text')
      console.log(d)
      d = d.value
      let text = `Data Point Details
      Gene: ${d.gene_id}
      Group: ${d.group_name}
      Tissue: ${d.tissue}
      Age: ${d.age_months} months
      Species: ${d.species}
      Time: ZT${d.time_point}`
      if ('gene_expression_avg' in d) {
        text += `\n Expr Avg: ${Math.round(d.gene_expression*1000)/1000}`
      } else {
        text += `\n Expr: ${Math.round(d.gene_expression*1000)/1000}`
      }

      if ('gene_expression_norm_avg' in d) {
        text += `\n Expr Norm Avg: ${Math.round(d.gene_expression_norm_avg*1000)/1000}`
      } else if ('gene_expression_norm' in d) {
        text += `\n Expr Norm: ${Math.round(d.gene_expression_norm*1000)/1000}`
      }

      if ('std_err' in d) {
        text += `\n Std Err: ${Math.round(d.std_err*1000)/1000}`
      }
      return text
    },
    popover(g, text_value, data) {
      console.log('popover')
      console.log(g)
      console.log(text_value)
      console.log(data)
      // Tooltip popover 
      // console.log('popover', key)
      // console.log(value)
      // console.log(g)
      if (!text_value) return g.style("display", "none");
      // const opacity = d3.select('#avgPoints').selectAll(`#dot_${key}`).attr('fill-opacity')
      // if (opacity == 0) return g.style("display", "none");

      // tooltip group
      g.style("display", "flex")
        .style("pointer-events", "none")
        .style("font", "10px sans-serif");

      // tooltip container stroke
      const path = g.selectAll("path")
        .data([null])
        .join("path")
          .attr("fill", "white")
          .attr("opacity", 1)
          .attr("stroke", this.getHSL(data.key));

      // tooltip content
      const text = g.selectAll("text")
        .data([null])
        .join("text")
        .call(text => text
          .selectAll("tspan")
          .data((text_value + "").split(/\n/))
          .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i) => `${i * 1.1}em`)
            .style("text-align", "center")
            .style("font-weight", (_, i) => i ? null : "bold")
            .text(d => d));

      let parentVal
      if (this.grouped_by == 'Time')
        parentVal = data.value.time_point.toString()
      console.log('parentVal', parentVal)


      //   // tooltip positioning
      //   const {x, y, width: w, height: h} = text.node().getBBox();
      //   text.attr("transform", `translate(${-w / 2},${15 - y})`);
      //   path.attr("d", `M${-w / 2 - 10},5 H${w / 2 + 10},H ${w / 2 + 10} v ${h+20} h ${-w/2-5} l-5,5 l-5,-5 h${-w/2-5} z`)

      // tooltip positioning
      const {x, y, width: w, height: h} = text.node().getBBox();
      console.log(x, y, w, h)
      text.attr("transform", `translate(${-w / 2},${15 - y})`);
      const transform_x = this.x(parentVal) + this.xSubgroup(data.value.identifier) + this.xSubgroup.bandwidth()/2
      const transform_y = Math.max(this.y(data.value.gene_expression_norm_avg)-h-25,-this.margin.top)
      console.log('transform_y', transform_y)
      
      g.attr("transform", `translate(${transform_x},${transform_y})`)
      
      // tooltip container path
      path.attr("d", `M${-w / 2 - 10},5 H${w / 2 + 10},H ${w / 2 + 10} v ${h+20} h ${-w/2-5} l-5,5 l-5,-5 h${-w/2-5} z`)

      // path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
    },
    legend() {
      // Legend color
      // var legendX = this.width*this.drawable_width_scale+20
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
                .style("stroke", (d) => this.getHSL(d))
                .style("stroke-width", 1.5)
            },
            (update) => {
              update.attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) =>  i*25 )
                .attr('y2', (d,i) =>  i*25 )
                .style("stroke", (d) => this.getHSL(d))
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
                .style('fill', (d) => this.getHSL(d))
                .text(d => d)
                .attr('text-anchor', 'left')
                .attr('font-size', '0.7em')
                .style('fill-opacity', 1)
            },
            (update) => {
              update.attr('y', (d,i) => i*25 )
                .style('fill', (d) => this.getHSL(d))
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

    }
  }

}
</script>

<style>

</style>