<template>
  <div id="bar" class="mx-auto">
    <!-- <div class="text-center mb-5">Bar Plot component</div> -->
    <div class="flex flex-wrap p-5 mx-auto w-full">
      <div id="group-by" class="px-5 mx-auto">
        <div class="font-semibold pb-2">Group by:</div>
        <SelectButton v-model="grouped_by" :options="grouped_by_options"/>
      </div>
      <div v-if="grouped_by === 'Time'" class="">
        <div class="font-semibold pb-2">Time Points (ZT)</div>
        <div class="time-points"></div>
        <SelectButton v-model="time_points_selected" 
          :options="time_points" optionLabel="name" 
          multiple/>
      </div>


      <!-- <div id="chart-type" class="px-5 mx-auto">
        <div class="font-semibold pb-2">Bar chart type:</div>
        <SelectButton v-model="chart_type" :options="chart_type_options"/>
      </div> -->
    </div>

    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>
    
    <div id="plot-area" class="mt-10">
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

import eyeUrl from '@/assets/eye.svg'
import eyeOffUrl from '@/assets/eye-off.svg'
import infoUrl from '@/assets/info.svg'


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
      sumstat_visibility: null, 

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

      time_points_selected: null,
      time_points: null,
    }
  },
  async mounted() {
    console.log('BarPlot mounting')
    const start = Date.now()

    this.grouped_by = 'Time'
    this.time_points = [
      {name: '0', value: 0},
      {name: '2', value: 2},
      {name: '4', value: 4},
      {name: '6', value: 6},
      {name: '8', value: 8},
      {name: '10', value: 10},
      {name: '12', value: 12},
      {name: '14', value: 14},
      {name: '16', value: 16},
      {name: '18', value: 18},
      {name: '20', value: 20},
      {name: '22', value: 22},
    ]
    this.time_points_selected = this.time_points

    this.initialize_bar_plot()

    if (this.datasets) {
      this.update_datasets()
    }
    // await this.get_dataset()
    // this.load_chart()
    const svgElem = document.getElementById('bar-plot-svg')
    // console.log('svgElem')
    // console.log(svgElem)
    // console.log(svgElem.offsetHeight)
    
    // const dims = d3.select('#bar-plot-svg').node().getBBox()
    // console.log(dims)
    // svgElem.addEventListener('load', console.log('svgElem loaded'))
    svgElem.addEventListener('load', this.legend())
    // svgElem.addEventListener('load', console.log(svgElem.offsetHeight))
    // svgElem.addEventListener('load', this.legend())
    
    
    console.log('BarPlot mounted, time elapsed:')
    console.log(Date.now() - start)

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
    toggleComplete() {
      this.complete = true
    },
    update_datasets() {
      console.log('update_datasets')
      const start = Date.now()
      this.genes_str_arr = this.genes.map((d) => d.name)
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

        const grouped_tissue = _.groupBy(this.expression_merged, e => `${e.tissue.replaceAll(' ', '-')}`)

        const grouped_tissue_gene = Object.keys(grouped_tissue).map((key) => {
          return [key, _.groupBy(grouped_tissue[key], e => `${e.gene_id}`)]
        })

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

        this.categories = [...new Set(
          [...this.sumstat.keys()] 
          .map(e => e.split('_').slice(0,-1).join('_'))
          )]

        this.cat_map = new Map(this.categories.map((d,i) => [
          d, i/this.categories.length
        ]))

        this.update_grouped_bar_plot()
        if (this.complete)
          this.legend()
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
            .attr("id", "bar-plot-svg")
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

      // console.log('this.expression_normalized_averaged')
      // console.log(this.expression_normalized_averaged)

      const time_points = [...new Set(this.expression_normalized_averaged.map(e => e.time_point))]
        .map(el => el.toString())
      var collator = new Intl.Collator([], {numeric: true});
      time_points.sort((a, b) => collator.compare(a, b));

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
                      // console.log('mouseover')
                      // console.log(evt)
                      // console.log(d)
                      if (evt.y > 1) {
                        let parentVal
                        if (this.grouped_by == 'Time') 
                           parentVal = d.value.time_point.toString()
                        // console.log(parentVal)
                        // console.log('height', this.height - y(d.value.gene_expression_norm_avg))
                        // console.log('y():', y(d.value.gene_expression_norm_avg))
                        
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
      const elapsed = Date.now() - start
      console.log('update_grouped_bar_plot time elapsed: ', elapsed)
    },
    getHSL(name, gene=false) {
      // console.log('getHSL')
      // console.log(name)
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
      // console.log('popover_text')
      // console.log(d)
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
      // Tooltip popover 
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
      else if (this.grouped_by == 'Gene')
        parentVal = data.value.gene_id
      // console.log('parentVal', parentVal)

      // tooltip positioning
      const {x, y, width: w, height: h} = text.node().getBBox()
      text.attr("transform", `translate(${-w / 2},${15 - y})`)
      const transform_x = this.x(parentVal) + this.xSubgroup(data.value.identifier) + this.xSubgroup.bandwidth()/2
      const transform_y = Math.max(this.y(data.value.gene_expression_norm_avg)-h-25,-this.margin.top)
      
      g.attr("transform", `translate(${transform_x},${transform_y})`)
      
      // tooltip container path
      path.attr("d", `M${-w / 2 - 10},5 H${w / 2 + 10},H ${w / 2 + 10} v ${h+20} h ${-w/2-5} l-5,5 l-5,-5 h${-w/2-5} z`)

      // path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
    },
    legend() {
      console.log('legend')
      console.log(this.expression_normalized)
      const num_tissues = this.expression_normalized.length
      const num_genes = this.expression_normalized[0][1].length
      const num_groups = this.expression_normalized[0][1][0][1].length

      this.svg.select('#legend')
      .selectAll(".legend_tissue")
      .data(this.expression_normalized)
      .join(
        (enter) => {
          // Create root g element to position child text elements
          // console.log('tissue enter')
          // console.log(enter)
          const tissue_root = enter.append('g')
          tissue_root.attr('class', 'legend_tissue')
            .style('fill', d3.rgb("#222"))
            .attr('transform', (d,i) => `translate(${13}, ${
              this.legendY_spacing*(i*(1+(num_genes*(num_groups + 1))))
              })`)

          tissue_root.append('g')
            .attr('class', 'eyes')
            .attr('transform', (d,i) => `translate(${-13}, ${-9})`)
            .on('click', this.tissueClick)
            .append_eyes()
          const text_info = tissue_root.append('g')
            .attr('class', 'text_info')
          text_info.append('text')
            .attr('class', 'legend_tissue_text')
            // .text(d => d[0].replaceAll('-', ' '))
            .text(d => d[0])
            .attr('text-anchor', 'left')
            .attr('font-size', '0.7em')
            .attr('opacity', 1)
            // .transition_attributes('opacity', 1)
          text_info.append('svg:image')
            .attr('class', 'info')
            .attr("xlink:href", infoUrl)
            .attr('type', "image/svg+xml")
            .attr('x', (d,i) => {
              const text_select = text_info.select('text')
              const groups = text_select._groups[0]
              const width = groups[i].getBBox().width
              console.log('width', width)
              return text_info.select('text')._groups[0][i].getBBox().width+5})
            .attr('y', -9)
            .attr('width', 10)
            .attr('height', 10)
            .attr('opacity', 1)
            .on('mouseover', this.infoHover)
            .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())

          tissue_root.selectAll('.legend_gene')
            .data(d => d[1])
            .join(
              (enter) => {
                // console.log('gene enter')
                // console.log(enter)
                const gene_root = enter.append('g')
                  .attr('class', 'legend_gene')
                  .style('fill', d => this.getHSL(d[1][0][1][0].identifier, true))
                  .attr('transform', (d,i) => `translate(${13}, ${
                    this.legendY_spacing *(1 + i * (1 + num_groups))
                    })`)
                  .transition_attributes('opacity', 1)
                
                gene_root.append('g')
                  .attr('class', 'eyes')
                  .attr('transform', (d,i) => `translate(${-13}, ${-9})`)
                  .on('click', this.geneClick)
                  .append_eyes()
                const text_info = gene_root.append('g')
                  .attr('class', 'text_info')
                text_info.append('text')
                  .attr('class', 'legend_gene_text')
                  .text(d => d[0])
                  .attr('text-anchor', 'left')
                  .attr('font-size', '0.7em')
                text_info.append('svg:image')
                  .attr('class', 'info')
                  .attr("xlink:href", infoUrl)
                  .attr('type', "image/svg+xml")
                  .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
                  .attr('y', -9)
                  .attr('width', 10)
                  .attr('height', 10)
                  .attr('opacity', 1)
                  .on('mouseover', this.infoHover)
                  .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                  
                gene_root.selectAll('.legend_groupname')
                  .data(d => d[1])
                  .join(
                    (enter) => {
                      // console.log('groupname enter')
                      // console.log(enter)
                      const groupname_root = enter.append('g')
                        .transition_attributes('opacity', 1)
                        .attr('class', 'legend_groupname')
                        .style('fill', d => this.getHSL(d[1][0].identifier))
                        .attr('transform', (d,i) => `translate(${13}, ${
                          this.legendY_spacing * (i+1)
                          })`)
                        
                      groupname_root.append('g')
                        .attr('class', 'eyes')
                        .attr('transform', (d,i) => `translate(${-13}, ${-9})`)
                        .on('click', this.groupnameClick)
                        .append_eyes()

                      const text_info = groupname_root.append('g')
                        .attr('class', 'text_info')
                      text_info.append('text')
                        .attr('class', 'legend_groupname_text')
                        .text(d => d[0])
                        .attr('text-anchor', 'left')
                        .attr('font-size', '0.7em')
                        .attr('opacity', 1)
                      text_info.append('svg:image')
                        .attr('class', 'info')
                        .attr("xlink:href", infoUrl)
                        .attr('type', "image/svg+xml")
                        .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
                        .attr('y', -9)
                        .attr('width', 10)
                        .attr('height', 10)
                        .attr('opacity', 1)
                        .on('mouseover', this.infoHover)
                        .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                        
                      return groupname_root
                    },
                  )
                return gene_root
              }
            )
          return tissue_root
        },
        (update) => {
          // console.log('tissue update')
          // console.log(update)
          const tissue_root = update.transition_attributes('opacity', 1)
            .attr('transform', (d,i) => `translate(${13}, ${
              this.legendY_spacing*(i*(1+(num_genes*(num_groups + 1))))
              })`)
          tissue_root.select('.legend_tissue_text')
              .text(d => d[0].replaceAll('-', ' '))

          update.selectAll('.legend_gene')
            .data(d => d[1])
            .join(
              (enter) => {
                // console.log('tissue update > gene enter')
                // console.log(enter)
                const gene_root = enter.append('g')
                  .attr('class', 'legend_gene')
                  .style('fill', d => this.getHSL(d[1][0][1][0].identifier, true))
                  .attr('transform', (d,i) => `translate(${5}, ${
                    this.legendY_spacing *(1 + i * (1 + num_groups))
                    })`)
                  .transition_attributes('opacity', 1)
                gene_root.append('g')
                  .attr('class', 'eyes')
                  .attr('transform', (d,i) => `translate(${-13}, ${-9})`)
                  .on('click', this.geneClick)
                  .append_eyes()
                const text_info = gene_root.append('g')
                  .attr('class', 'text_info')
                text_info.append('text')
                  .attr('class', 'legend_gene_text')
                  .text(d => d[0])
                  .attr('text-anchor', 'left')
                  .attr('font-size', '0.7em')
                text_info.append('svg:image')
                  .attr('class', 'info')
                  .attr("xlink:href", infoUrl)
                  .attr('type', "image/svg+xml")
                  .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
                  .attr('y', -9)
                  .attr('width', 10)
                  .attr('height', 10)
                  .attr('opacity', 1)
                  .on('mouseover', this.infoHover)
                  .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                gene_root.selectAll('.legend_groupname')
                  .data(d => d[1])
                  .join(
                    (enter) => {
                      // console.log('groupname enter')
                      // console.log(enter)
                      const groupname_root = enter.append('g')
                        .transition_attributes('opacity', 1)
                        .attr('class', 'legend_groupname')
                        .style('fill', d => this.getHSL(d[1][0].identifier))
                        .attr('transform', (d,i) => `translate(${5}, ${
                          this.legendY_spacing * (i+1)
                          })`)

                      groupname_root.append('g')
                        .attr('class', 'eyes')
                        .attr('transform', (d,i) => `translate(${-13}, ${-9})`)
                        .on('click', this.groupnameClick)
                        .append_eyes()
                      const text_info = groupname_root.append('g')
                        .attr('class', 'text_info')
                      text_info.append('text')
                        .attr('class', 'legend_groupname_text')
                        .text(d => d[0])
                        .attr('text-anchor', 'left')
                        .attr('font-size', '0.7em')
                        .attr('opacity', 1)
                      text_info.append('svg:image')
                        .attr('class', 'info')
                        .attr("xlink:href", infoUrl)
                        .attr('type', "image/svg+xml")
                        .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
                        .attr('y', -9)
                        .attr('width', 10)
                        .attr('height', 10)
                        .attr('opacity', 1)
                        .on('mouseover', this.infoHover)
                        .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                      return groupname_root
                    },
                    (update) => {
                      // console.log('groupname update')
                      // console.log(update)
                      update.attr('transform', (d,i) => `translate(${5}, ${
                        this.legendY_spacing * (i+1)
                        })`)
                        .style('fill', d => this.getHSL(d[1][0].identifier))
                        .transition_attributes('opacity', 1)
                    },
                    (exit) => exit.transition_attributes('opacity', 0).remove()
                  )
                return gene_root
              },
              (update) => {
                // console.log('tissue update > gene update')
                // console.log(update)
                update.attr('transform', (d,i) => `translate(${5}, ${
                  this.legendY_spacing *(1 + i * (1 + num_groups))
                  })`)
                  .style('fill', d => 
                    this.getHSL(d[1][0][1][0].identifier, true))
                  .transition_attributes('opacity', 1)
                  .select('.legend_gene_text')
                    .text(d => d[0])
                update.selectAll('.legend_groupname')
                  .data(d => d[1])
                  .join(
                    (enter) => {
                      // console.log('tissue update > gene update > groupname enter')
                      // console.log(enter)
                      const groupname_root = enter.append('g')
                        .transition_attributes('opacity', 1)
                        .attr('class', 'legend_groupname')
                        .style('fill', d => this.getHSL(d[1][0].identifier))
                        .attr('transform', (d,i) => `translate(${5}, ${
                          this.legendY_spacing * (i+1)
                          })`)
                      groupname_root.append('g')
                        .attr('class', 'eyes')
                        .attr('transform', (d,i) => `translate(${-13}, ${-9})`)
                        .on('click', this.groupnameClick)
                        .append_eyes()
                      const text_info = groupname_root.append('g')
                        .attr('class', 'text_info')
                      text_info.append('text')
                        .attr('class', 'legend_groupname_text')
                        .text(d => d[0])
                        .attr('text-anchor', 'left')
                        .attr('font-size', '0.7em')
                        .attr('opacity', 1)
                        .style('margin-bottom', 5)
                      text_info.append('svg:image')
                        .attr('class', 'info')
                        .attr("xlink:href", infoUrl)
                        .attr('type', "image/svg+xml")
                        .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
                        .attr('y', -9)
                        .attr('width', 10)
                        .attr('height', 10)
                        .attr('opacity', 1)
                        .on('mouseover', this.infoHover)
                        .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                      return groupname_root
                    },
                    (update) => {
                      // console.log('tissue update > gene update > groupname update')
                      // console.log(update)
                      // TODO: Possible bug when updating and associated event is not updated?
                      update.attr('transform', (d,i) => `translate(${5}, ${
                        this.legendY_spacing * (i+1)
                        })`)
                        .style('fill', d => this.getHSL(d[1][0].identifier))
                        .transition_attributes('opacity', 1)
                        .select('.legend_groupname_text')
                          .text(d => d[0])   
                    },
                    (exit) => exit.transition_attributes('opacity', 0).remove()
                  )
              },
              (exit) => exit.transition_attributes('opacity', 0).remove()
            )
        },
        (exit) => exit.transition_attributes('opacity', 0).remove()
      )

      // Set flag that SVG has been fully generated at least once
      this.complete = true
    },
    toggleVisibility(newOpacity, id) {
      // TODO: Toggle eye one level up if all child eyes are set to on or off
      // console.log('toggleVisibility', newOpacity, id)
      // console.log(this.allPoints)
      return
      const lines = d3.selectAll(`[id^='line_${id}']`)
      lines.transition_attributes('stroke-opacity', newOpacity)
      const matching_keys = Object.keys(this.sumstat_visibility).filter(e => e.includes(id))
      matching_keys.forEach(e => this.sumstat_visibility[e] = newOpacity)
      // console.log('matching_keys')
      // console.log(matching_keys)
      const avgPoints = d3.select('#avgPoints').selectAll(`[id^='dot_${id}']`)
      avgPoints.transition_attributes('fill-opacity', newOpacity)
      avgPoints._groups[0].forEach(e => e.__data__.visible = newOpacity)

      if (this.showReplicatePoints) {
        const replicatePoints = d3.select('#replicatePoints').selectAll(`[id^='dot_${id}']`)
        replicatePoints.transition_attributes('fill-opacity', newOpacity)
        replicatePoints._groups[0].forEach(e => e.__data__.visible = newOpacity)
      }
      
      if (this.showErrorBars) {
        const errorBars = d3.selectAll(`[id^='error_${id}'`)
        errorBars.transition_attributes('stroke-opacity', newOpacity)
      }

      // console.log(this.allPoints)

      // Update voronoi cells
      this.voronoi_grid()
    },
    tissueClick(evt, i) {
      // Toggle visibility of Tissue data for every child gene and group
      // console.log('tissueClick')
      const tissue_root = evt.currentTarget.parentNode
      const id = i[1][0][1][0][1][0].identifier.split('_')[0]
      // console.log('id', id)
      const opacity = tissue_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1

      const eyesOn = tissue_root.querySelectorAll('.eye')
      const eyesOff = tissue_root.querySelectorAll('.eye-off')
      eyesOn.forEach(e => e.setAttribute('opacity', newOpacity))
      eyesOff.forEach(e => e.setAttribute('opacity', opacity))

      this.toggleVisibility(newOpacity, id)
    },
    geneClick(evt, i) {
      // Toggle visibility of Tissue_Gene data for both groups
      // console.log('geneClick')
      const gene_root = evt.currentTarget.parentNode
      const id = i[1][0][1][0].identifier.split('_').slice(0,-1).join('_')
      
      const opacity = gene_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1
      const eyesOn = gene_root.querySelectorAll('.eye')
      const eyesOff = gene_root.querySelectorAll('.eye-off')
      eyesOn.forEach(e => e.setAttribute('opacity', newOpacity))
      eyesOff.forEach(e => e.setAttribute('opacity', opacity))
      
      this.toggleVisibility(newOpacity, id)
    },
    groupnameClick(evt, i) {
      // Toggle visibility of Tissue_Gene_Groupname data
      // console.log('groupnameClick')
      const groupname_root = evt.currentTarget.parentNode
      const id = i[1][0].identifier
      
      const opacity = groupname_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1
      const eyeOn = groupname_root.querySelector('.eye')
      const eyeOff = groupname_root.querySelector('.eye-off')
      eyeOn.setAttribute('opacity', newOpacity)
      eyeOff.setAttribute('opacity', opacity)

      this.toggleVisibility(newOpacity, id)
    },   
    infoTissueText(data) {
      // TODO: Add more metadata when new fields created for dataset upload page
      // console.log('infoTissueText')
      // console.log(data)
      const tissue = data[0].replaceAll('-', ' ')
      // console.log(tissue)
      const table_metadata_list = this.gene_expression_data_tables.filter(e => e.tissue == tissue)
      // TODO: Possible future bug when there's more than 1 dataset for tissue
      if (table_metadata_list.length > 1) {
        console.error('WARNING: More than 1 matching table for tissue', tissue)
      }
      const table_metadata = table_metadata_list[0]

      // console.log(table_metadata)
      let text = `Tissue: ${tissue}\n`
      text += `Experiment: ${table_metadata.experiment}\n`
      text += `Year: ${table_metadata.year}\n`
      text += `Species: ${table_metadata.species}\n`
      text += `Gender: ${table_metadata.gender}\n`
      text += `Number of Samples: ${table_metadata.data.length}\n`
      text += `Data Type: ${table_metadata.data_type}\n`
      text += `Age (months): ${table_metadata.age_months}\n`
      
      return text
    },
    infoGeneText(data) {
      // console.log('infoGeneText')
      let gene = data[0]
      // console.log('gene', gene)
      const sample = data[1][0][1][0]
      // console.log(sample)
      const table = sample.table
      // const tissue = sample.tissue

      const gene_metadata_table = table.replace('gene_expression_data', 'gene_metadata')
      // console.log(gene_metadata_table)
      const gene_metadata_entries = this.gene_metadata.filter(e => e.table_name == gene_metadata_table)
      // console.log(gene_metadata_entries)
      // let gene
      if (gene_metadata_entries.length > 1 ) {
        console.error('WARNING: Multiple entries in this.gene_metadata')
        gene = gene_metadata_entries.filter(e => e.gene_name == gene_name)[0]
      }
      gene = gene_metadata_entries[0].data[0]
      // console.log(gene)
      let text = `Gene: ${gene.gene_name}\n`
      text += `Gene ID: ${gene.gene_id}\n`
      text += `External Gene Name: ${gene.external_gene_name}\n`
      text += `Description: ${gene.description}\n`
      text += `Gene Biotype: ${gene.gene_biotype}\n`
      text += `Ensembl Gene ID: ${gene.ensembl_gene_id}\n`
      text += `Ensembl Peptide ID: ${gene.ensembl_peptide_id}\n`
      text += `Chr: ${gene.chr}\n`
      text += `Start: ${gene.start}\n`
      text += `End: ${gene.end}\n`
      text += `Length: ${gene.length}\n`
      text += `Strand: ${gene.strand}\n`
      text += `Annotation Divergence: ${gene.annotation_divergence}\n`
      text += `Copies: ${gene.copies}\n`
      text += `Refseq: ${gene.refseq}\n`
      
      
      return text
    },
    infoGroupnameText(data) {
      // console.log('infoGroupnameText')
      const groupname = data[0]
      const sample = data[1][0]
      const stats = data[2]

      // console.log(sample)

      let text = `Group: ${groupname}\n`
      text += `Age (months): ${sample.age_months}\n`
      text += `Gender: ${sample.gender}\n`
      text += `Species: ${sample.species}\n`
      text += `Tissue: ${sample.tissue}\n`
      text += `\nExpression Stats\n`
      text += `Amplitude: ${Math.round(stats.amplitude*1000)/1000}\n`
      text += `Min: ${Math.round(stats.min*1000)/1000}\n`
      text += `Max: ${Math.round(stats.max*1000)/1000}\n`
      text += `Mean: ${Math.round(stats.mean*1000)/1000}\n`
      
      return text
    },
    infoHover(evt, d) {
      // console.log('infoHover')
      // console.log(evt)
      // console.log(d)
      const self = evt.currentTarget
      const self_dims = self.getBoundingClientRect()
      
      const root = evt.currentTarget.parentNode
      const g = this.svg.append('g')
        .attr('class', 'info-tooltip')
        .attr('fill', d3.rgb('#222'))
        
      // Get relative position of self element within SVG
      const svg = document.querySelector('#bar-plot-svg')
      const inverse = svg.getScreenCTM().inverse()
      // TODO: WARNING, createSVGPoint may be deprecated
      const pt = svg.createSVGPoint()
      pt.x  = self_dims.x 
      pt.y = self_dims.y
      const p = pt.matrixTransform(inverse)
      // console.log(p)
      const pad = 3
      const pos_x = p.x - this.margin.left - pad
      const pos_y = p.y - this.margin.top + 22 + pad
      
      g.attr("transform", `translate(${pos_x},${pos_y})`);

      const currType = root.querySelector('text').getAttribute('class').split('_')[1]
      // console.log('currType', currType)
      let info_text
      if (currType == 'tissue') {
        info_text = this.infoTissueText(d)
      } else if (currType == 'gene') {
        info_text = this.infoGeneText(d)
      } else if (currType == 'groupname') {
        info_text = this.infoGroupnameText(d)
      }
      if (!info_text) return g.style('display', 'none')
      
      // tooltip group
      g.style("display", "flex")
        .style("pointer-events", "none")
        .style("font", "10px sans-serif");

      // Rect must be appended first to act as background
      const rect = g.append('rect')
        .attr('fill', 'white')
        .attr('stroke', d3.rgb('#222'))
        .attr('stroke-width', 1) 

      // tooltip content
      const text_selection = g.selectAll("text")
        .data([null])
        .join("text")
        .call(text => text
          .selectAll("tspan")
          .data((info_text + "").split(/\n/))
          .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i) => `${i * 1.1}em`)
            .style("text-align", "left")
            .style("font-weight", (_, i) => i ? null : "bold")
            .text(d => d));
      
      // tooltip positioning
      const {x, y, width: w, height: h} = text_selection.node().getBBox();
      text_selection.attr("transform", `translate(${-w},${0})`);

      // Background dimensions relative to text size
      rect.attr('x', -w-pad)
        .attr('y', y-pad)
        .attr('width', w+2*pad)
        .attr('height', h+2*pad)

      // console.log('this.gene_expression_data_tables')
      // console.log(this.gene_expression_data_tables)
    }
  }

}
</script>


<style lang="scss" scoped>

// [class^="p-component"] {
//     font-size: 0.8rem !important;
// }

.time-points {
  font-size: 0.5rem !important;
}
</style>