<template>
  <div id="heatmap" class="mx-auto">
    <!--<div class="text-center mb-5">Heat Map component</div>-->

    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>

    <div id="plot-options" class="w-3/4 mx-auto mt-1 flex flex-row" v-show="this.complete">
      <!-- <div id="toggle_data_points" class="flex flex-col align-items-center mx-2">
        <div class="font-semibold pb-2">Data Points</div>
        <InputSwitch v-model="showReplicatePoints" @change="this.update_line_plot" />
      </div>
      <div id="toggle_error_bars" class="flex flex-col align-items-center mx-2">
        <div class="font-semibold pb-2">Error Bars</div>
        <InputSwitch v-model="showErrorBars" @change="this.update_line_plot" />
      </div> -->

      <div id="menu-options" class="flex grow justify-end">
        <div class="flex flex-col items-center">
          <div class="font-semibold pb-2">Download</div>
          <Button type="button" label="" icon="pi pi-download" @click="toggle('download_menu', $event)" 
            aria-haspopup="true" aria-controls="download_menu"/>
          <Menu id="download_menu" ref="download_menu" :model="download_items" :popup="true" />
        </div>
        
        <div class="flex flex-col items-center ml-2">
          <div class="font-semibold pb-2">Colors</div>
          <Button type="button" label="" icon="pi pi-palette" @click="toggle('color_menu', $event)" 
            aria-haspopup="true" aria-controls="color_menu"/>
          <Menu id="color_menu" ref="color_menu" :model="color_items" :popup="true" />
        </div>   
      </div>
    </div>

    <div id="plot-area" class="mt-10">
    </div>
    <div id="table-area" class="mt-1">
      <Table :dataset="this.expression_merged"/>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3"
import * as svg from 'save-svg-as-png'

import DataService from "@/services/DataService.js"

import ProgressSpinner from 'primevue/progressspinner'
import InputSwitch from 'primevue/inputswitch'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import _ from 'underscore';

import Table from '@/components/svg/Table.vue'

import eyeUrl from '@/assets/eye.svg'
import eyeOffUrl from '@/assets/eye-off.svg'
import infoUrl from '@/assets/info.svg'

const animationInterval = 250
const eye_x_offset = 13
const eye_y_offset = 9
const eye_w = 10
const eye_h = 10
// Custom function, reduces redundant code for transitions
// Opacity transition, fade in / out
d3.selection.prototype.transition_attributes = function(
  attr_name, opacity, duration=animationInterval) {
  this.transition()
      // .ease(Math.sqrt)
      // .duration(duration)
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
    .attr('width', eye_w)
    .attr('height', eye_h)
    .attr('opacity', 1)
  this.append('svg:image')
    .attr('class', 'eye-off')
    .attr("xlink:href", eyeOffUrl)
    .attr('type', "image/svg+xml")
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', eye_w)
    .attr('height', eye_h)
    .attr('opacity', 0)
  return this
}

// // Add info tooltip SVG icons
// d3.selection.prototype.append_info = function() {
//   this.append('svg:image')
//   .attr('class', 'info')
//   .attr("xlink:href", infoUrl)
//   .attr('type', "image/svg+xml")
//   .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
//   .attr('y', -eye_y_offset)
//   .attr('width', 10)
//   .attr('height', 10)
//   .attr('opacity', 1)
//   .on('mouseover', this.infoHover)
//   .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
//   return this
// }


export default {
  name: "HeatMap",
  components: {
    ProgressSpinner,
    InputSwitch,
    Menu,
    Button,
    ToggleButton,
    DataTable,
    Column,
    Table,
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

      expression_merged: [],
      expression_averaged: [],
      expression_normalized: [],
      expression_normalized_averaged: [],
      expression_normalized_flattened: [],

      // update_line_plot
      sumstat: null,
      sumstat_dots: null,
      categories: null,
      cat_map: null,
      replicatePoints: [],
      allPoints: [],
      voronoi: null,
      
      // Plot variables
      margin: null,
      width: null,
      height: null,
      drawable_width_scale: null,
      drawable_height_scale: null,
      legendX: null, 
      x: null,
      xAxis: null,
      y: null,
      yAxis: null,
      svg: null,
      animationInterval: 250,
      color: null,

      complete: false,
      showReplicatePoints: false,
      showErrorBars: true,

      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,

      download_items: [
        {
          label: 'Download as PNG',
          icon: 'pi pi-image',
          command: () => this.downloadChart('png')
        },
        {
          label: 'Download as CSV',
          icon: 'pi pi-table',
          command: () => this.downloadCSV()
        }
      ],
      color_items: [
        {
          label: 'Rainbow',
          command: () => this.change_color(d3.interpolateRainbow)
        },
        {
          label: 'Sinebow',
          command: () => this.change_color(d3.interpolateSinebow)
        },
        {
          label: 'Viridis',
          command: () => this.change_color(d3.interpolateViridis)
        },
        {
          label: 'Warm',
          command: () => this.change_color(d3.interpolateWarm)
        },

      ],
    
    }
  },
  watch: {
    datasets() {
      console.log('%%%%%%%%%%%%%%%%')
      console.log('watch: datasets')
      this.update_datasets()
      console.log('%%%%%%%%%%%%%%%%')
    }

  },
  async mounted() {
    console.log('Heat Map mounted')
    const start = Date.now()

    // this.initialize_line_plot()
    this.initialize_heat_map()
    // console.log('Initialized heat map')

    if (this.datasets) {
      this.update_datasets()
    }

    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    })
    
    const elapsed = Date.now() - start
    console.log('LinePlot mounted, time elapsed', elapsed)
  },
  beforeDestroy() { 
    window.removeEventListener('resize', this.onResize); 
  },

  methods: {
    toggle(menu, evt) {
      this.$refs[menu].toggle(evt);
    },    
    async downloadChart(filetype) {
      console.log('downloadChart')
      const svgElement = document.getElementById("plot-svg")
      const options = {
        'modifyCss' : function(selector, properties) { 
          selector = selector.replace('#selectors-prefixed ', ''); 
          properties = properties.replace('green', 'blue'); 
          return selector + '{' + properties + '}'; 
        },
        'backgroundColor' : "#FFFFFF",
        'encoderOptions' : 1,  
      }
      svg.saveSvgAsPng(svgElement, "diagram.png", options)
    },
    downloadCSV() {
      console.log('downloadCSV')
      console.log(this.expression_merged)
      let arr = this.expression_merged.map(e => {
        return {
          gene_id: e.gene_id,
          gene_expression: e.gene_expression,
          data_type: e.data_type,
          sample_name: e.sample_name,
          time_point: e.time_point,
          condition: e.condition,
          species: e.species,
          tissue: e.tissue,
          age_months: e.age_months,
          gender: e.gender,
          replicate: e.replicate,
          number_of_replicates: e.number_of_replicates,
          experiment: e.experiment,
          institution: e.institution,
          year: e.year,
          
        }
      })

      const array = [Object.keys(arr[0])].concat(arr)

      const csv = array.map(it => {
        return Object.values(it).toString()
      }).join('\n')

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      var link = document.createElement("a")
      if (link.download !== undefined) {
        var url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "filtered_data.csv")
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } 
    },
    onResize() {
      this.windowHeight = window.innerHeight
      this.windowWidth = window.innerWidth
      // console.log('LinePlot resized', this.windowWidth, this.windowHeight)
    },
    update_datasets() {
      // Process gene expression and sample data into groups for visualization 
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
        this.selected_metadata = JSON.parse(JSON.stringify(this.datasets.selected_metadata))

        this.gene_expression_data_tables.forEach((e) => {
          // console.log('this.gene_expression_data_tables.forEach')
          // console.log(e)
          const table = e.table_name
          const table_split = table.split('_')
          e.owner = table_split.at(-1)
          const metadata = this.selected_metadata.find(obj => {
            return obj.gene_expression_data_table_name == table
          })
          e.experiment = metadata.experiment
          e.year = metadata.year
          e.institution = metadata.institution         
          
          // "TRF_2018_Mouse_Adrenal_gene_expression_data_UCb0eBc2ewPjv9ipwLaEUYSwdhh1"
          let sample_table = table.replace('gene_expression_data', 'sample_metadata')
          let expression_data = e.data
          let sample_data = this.sample_metadata_tables.find(obj => 
            obj.table_name == sample_table).data

          var collator = new Intl.Collator([], {numeric: true});

          const merged_data = expression_data.map(itm => ({
            ...sample_data.find((item) => (item.sample_name == itm.sample_name) && item),
            ...itm
          })).sort((a,b) => collator.compare(a.time_point, b.time_point))

          e.data = merged_data

          e.data.forEach(itm => {
            itm.table = table
            itm.experiment = metadata.experiment
            itm.institution = metadata.institution
            itm.year = metadata.year
          })

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
          
          this.expression_merged = this.expression_merged.concat(e.data)
        })

        this.expression_merged.forEach((e) => {
          e.time_point = parseInt(e.time_point.split('ZT')[1])
          e.replicate = e.sample_name.split('-').at(-1)
          e.identifier = `${e.tissue.replaceAll(' ', '-')}_${e.gene_id}_${e.group_name}`
        })

        // Sort data points alphanumerically on sample_name 
        const sortAlphaNum = (a, b) => a.sample_name.toString().localeCompare(b.sample_name, 'en', { numeric: true })
        this.expression_merged.sort(sortAlphaNum)

        const grouped_tissue = _.groupBy(this.expression_merged, e => `${e.tissue.replaceAll(' ', '-')}`)

        const grouped_tissue_gene = Object.keys(grouped_tissue).map((key) => {
          return [key, _.groupBy(grouped_tissue[key], e => `${e.gene_id}`)]
        })

        const grouped_tissue_gene_groupname = grouped_tissue_gene.map((tissue) => {
          return [tissue[0], Object.keys(tissue[1]).map((key) => {
            return [key, _.groupBy(tissue[1][key], function(e) {
              return `${e.group_name}`
            })]
          })]
        })

        grouped_tissue_gene_groupname.forEach((tissue) => {
          tissue[1].forEach((gene) => {
            gene[1] = Object.entries(gene[1])
            gene[1].forEach((groupname) => {
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

              const groupname_stats = {
                min: min,
                max: max, 
                amplitude: max-min,
                mean: mean,
              }
              groupname.push(groupname_stats)
            })
          })
        })

        this.expression_normalized = grouped_tissue_gene_groupname

        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized.map(e => e[1]))
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => e[1]))
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => e[1]))

        const grouped_norm = _.groupBy(this.expression_normalized_flattened, e => 
          `${e.gene_id}_${e.tissue.replaceAll(' ', '-')}_${e.group_name}_ZT${e.time_point}`)

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

          o.std_dev = Math.sqrt(_.reduce(val, function(memo, v) { 
            return memo + Math.pow((v.gene_expression_norm - o.gene_expression_norm_avg), 2); 
          }, 0) / val.length)

          o.std_err = o.std_dev / Math.sqrt(val.length)

          return o
        });

        this.expression_normalized_averaged = Object.entries(this.expression_normalized_averaged).map(e => e[1])
        this.avgPoints = [...this.expression_normalized_averaged]
        this.avgPoints.forEach(e => e.visible = 1)
        this.errorBarsData = [...this.expression_normalized_averaged]
        this.errorBarsData.forEach(e => e.visible = (this.showErrorBars ? 1 : 0))
        this.replicatePoints = this.expression_normalized_flattened
        this.replicatePoints.forEach(e => e.visible = (this.showReplicatePoints ? 1 : 0))
        this.allPoints = this.avgPoints.concat(this.replicatePoints)

        this.sumstat = d3
          .group(this.expression_normalized_averaged, 
          d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);

        this.sumstat_visibility = Object.fromEntries(
          new Map([...this.sumstat.keys()].map(e => [e, 1])))

        this.categories = [...new Set(
          [...this.sumstat.keys()] 
          .map(e => e.split('_').slice(0,-1).join('_'))
          )]

        this.cat_map = new Map(this.categories.map((d,i) => [
          d, i/this.categories.length
        ]))

        this.update_heat_map()
      }
      
      const elapsed = Date.now() - start
      console.log('update_datasets time elapsed', elapsed)
    },
    initialize_heat_map() {
      console.log('initialize_heat_map')
      // set the dimensions and margins of the graph
      this.margin = {top: 30, right: 10, bottom: 140, left: 80}

      this.width = this.windowWidth * 0.6 - this.margin.left - this.margin.right,
      this.height = this.windowHeight * 0.55 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 0.8
      this.drawable_height_scale = 1
      this.svg = d3.select("#plot-area")
          .append("svg")
            .attr("id", "plot-svg")
            // .attr("width", this.width + this.margin.left + this.margin.right)
            // .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("class", "mx-auto")
            .attr("viewBox", `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMid")
            .attr("style", "font-family:sans-serif")
            .style("font-size", 15)
          .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      // Initialize X axis
      // this.x = d3.scaleLinear().range([0,this.width * this.drawable_width_scale])
      // this.xAxis = d3.axisBottom().scale(this.x);
      // this.svg.append("g")
      //     .attr("transform", `translate(0, ${this.height*this.drawable_height_scale})`)
      //     .attr("class","myXaxis")

      this.x = d3.scaleBand()
        .range([0,this.width * this.drawable_width_scale])
      this.xAxis = d3.axisBottom()
        .scale(this.x)
        .tickSize(0);
      this.svg.append("g")
        .attr("transform", `translate(0, ${this.height*this.drawable_height_scale})`)
        .attr("class","myXaxis")

      // X axis label
      this.svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", this.width * this.drawable_width_scale / 2)
        .attr("y", this.height * this.drawable_height_scale+40)
        .text("Time Point (ZT)");

      // // Initialize Y axis
      // this.y = d3.scaleLinear().range([this.height*this.drawable_height_scale, 0]);
      // this.yAxis = d3.axisLeft().scale(this.y);
      // this.svg.append("g")
      //   .attr("class","myYaxis")
      this.y = d3.scaleBand().range([this.height*this.drawable_height_scale, 0]);
      this.yAxis = d3.axisLeft()
        .scale(this.y)
        .tickSize(0);
      this.svg.append("g")
        .attr("class","myYaxis")

      // // Y axis label 
      // this.svg.append("text")
      //   .attr("class", "y-label")
      //   .attr("text-anchor", "middle")
      //   .attr("y", -45)
      //   .attr("x",-this.height/2)
      //   .attr("transform", "rotate(-90)")
      //   .text("Group");

      this.svg.append("g")
        .attr("class", "y-label")
        .style("font-size", 10)
        // .call(d3.axisLeft(y).tickSize(0))
        // .select(".domain").remove()
      
      // this.legendX = this.width*this.drawable_width_scale + 5
      // this.legendY_spacing = 15

      // // Legend 
      // this.svg.append('g')
      //   .attr('id', 'legend')
      //   .attr('transform', `translate(${this.legendX}, 0)`)
      
      // Color 
      // this.color = d3.scaleSequential(d3.interpolateSinebow)
      this.color = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([0.0,1.0])

      // squares grouping element
      this.svg.append("g")
        .attr("id", "squares")

    },
    change_color(d3color) {
      this.color = d3.scaleSequential(d3color)
      this.update_line_plot()
      this.legend()

    },
    update_heat_map() {
      console.log('===================')
      console.log('update_heat_map')

      // Animation transition time in ms
      var animationInterval = this.animationInterval
      
      // Create the X axis
      const groups = [...this.sumstat.keys()]
      console.log('groups')
      console.log(groups)
      var collator = new Intl.Collator([], {numeric: true});
      const time_points = [...new Set(
          this.avgPoints.map(e => e.time_point)
          )].sort((a,b) => collator.compare(parseInt(a), parseInt(b)))

      console.log('this.avgPoints')
      console.log(this.avgPoints)
      console.log('time_points')
      console.log(time_points)

      this.x.domain(time_points).padding(0.05);
      var x = this.x
      this.svg.selectAll(".myXaxis").transition()
        .duration(this.animationInterval)
        .call(this.xAxis)

      // console.log('this.expression_merged')
      // console.log(this.expression_merged)

      // console.log('this.sumstat')
      // console.log(this.sumstat)

      // Create the Y axis
      this.y.domain(groups)
        .padding(0.05);
      var y = this.y
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(this.animationInterval)
          .call(this.yAxis)
          


      this.svg.selectAll(".myYaxis")
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-45)")

      // Tissue > Gene > Group 
      console.log('this.avgPoints')
      console.log(this.avgPoints)

      // Draw dots on line with averaged data points
      // d3.hsl(this.color(this.cat_map.get(cat)))

      this.svg.select('#squares')
        .selectAll(".square")
        // Flattened array
        .data(this.avgPoints)
        .join(
          (enter) => {
            console.log('square enter')
            console.log(enter)
            enter.append("rect")
              .attr('class', 'square')
              .attr('id', d => `square_${d.identifier}`)
              .attr("x", (d) => x(d.time_point) )
              .attr("y", (d) => y(d.identifier) )
              .attr("rx", 4)
              .attr("ry", 4)
              .attr("width", x.bandwidth() )
              .attr("height", y.bandwidth() )
              .attr("fill", (d) => this.color(d.gene_expression_norm_avg) )
              .style("stroke-width", 4)
              .style("stroke", "none")
              .style("opacity", 0.8)
              .on("mouseover", (d,i) => {
                // console.log('mouseover')
                // console.log(d)
                // console.log(i)
                
                  // console.log(i)
                  this.svg.append('g')
                    .attr('class', 'tooltip')
                    .attr("transform", `translate(${this.x(i.time_point) + x.bandwidth()/2 },${this.y(i.identifier) + y.bandwidth()/2})`)
                    .call(this.popover, this.popover_text(i), i.gene_expression_norm_avg)
                
              })
              .on("mousemove", (d,i) => {
                // console.log('mousemove')
                // console.log(d)
                // console.log(i)

                  // console.log(i)
                  this.svg.append('g')
                    .attr('class', 'tooltip')
                    .attr("transform", `translate(${this.x(i.time_point) + x.bandwidth()/2},${this.y(i.identifier) + y.bandwidth()/2})`)
                    .call(this.popover, this.popover_text(i), i.gene_expression_norm_avg)

              })
            .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
          },
          (update) => {
            console.log('square update')
            console.log(update)
            update.attr("x", (d) => x(d.time_point) )
              .attr("y", (d) => y(d.identifier) )
              .attr("width", x.bandwidth() )
              .attr("height", y.bandwidth() )
              .attr("fill", (d) => this.color(d.gene_expression_norm_avg) )
          },
          (exit) => exit.remove()
        )

      const ticks = [...Array(groups.length).keys()]
      const tick_values = groups.map((e) => {
        return e.replace(/_/g, "\n").replace(/-/g, " ")
      })
      console.log('tick_values')
      console.log(tick_values)

      const labels = this.svg.selectAll('.myYaxis .tick text')
      console.log('labels')
      console.log(labels)
      labels.html((d,i,n) => {
        console.log(d)
        console.log(i)
        console.log(n)
        console.log(this)
        // n.item(i)
        return null

      })
      // labels.text((d,i,n) => {
      //   console.log(d)
      //   console.log(i)
      //   console.log(n)
      //   console.log(this)
      //   return "OK"

      // })

      


      this.complete = true
      console.log('===================')
    },
    
   insertLinebreak(d) {
    console.log('insertLinebreak: ' + d)

    let labels = d3.select(this);
    let words = d;
    console.log("Label:", labels.html());
    labels.text('');

    let index = words.indexOf(' ', words.indexOf(' ') + 1)
    let title = words.substr(0, index)
    let subtitle = words.substr(index + 1)

    let tspantitle = labels.append('tspan').text(title)
    let tspansubtitle = labels.append('tspan').text(subtitle)
    tspantitle
      .attr('x', 0)
      .attr('dy', '15')
      .attr('class', 'x-axis-title');
    tspansubtitle
      .attr('x', 0)
      .attr('dy', '16')
      .attr('class', 'x-axis-subtitle');

    },
    popover_text(d) {
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
    popover(g, value, key) {
      // Tooltip popover 
      if (!value) return g.style("display", "none");

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
          .attr("stroke", this.color(key));

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
      // console.log(data)
      let gene_name = data[0]
      // console.log('gene_name', gene_name)
      const sample = data[1][0][1][0]
      // console.log(sample)
      const table = sample.table
      const tissue = sample.tissue
      // console.log('table', table)

      const gene_metadata_table = table.replace('gene_expression_data', 'gene_metadata')
      // console.log(gene_metadata_table)
      const gene_metadata_entries = this.gene_metadata.filter(e => e.table_name == gene_metadata_table)
      // console.log('gene_metadata_entries')
      // console.log(gene_metadata_entries)
      let gene
      if (gene_metadata_entries.length > 1 ) {
        console.error('WARNING: Multiple entries in this.gene_metadata')
        // gene = gene_metadata_entries.filter(e => e.gene_name == gene_name)[0]
      }
      gene = gene_metadata_entries[0].data.filter(e => e.gene_name == gene_name)[0]
      // console.log('gene_metadata..')
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
      // console.log('d')
      // console.log(d)
      const self = evt.currentTarget
      const self_dims = self.getBoundingClientRect()
      
      const root = evt.currentTarget.parentNode
      const g = this.svg.append('g')
        .attr('class', 'info-tooltip')
        .attr('fill', d3.rgb('#222'))
        
      // Get relative position of self element within SVG
      const svg = document.querySelector('#plot-svg')
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

      // console.log('info_text', info_text)
      
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
  },
}
</script>

<style lang="scss" scoped>
#plot-options 
{
  :deep(.p-button) {
    font-size: 0.85rem !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
    padding-top: 0.25rem !important;
    padding-bottom: 0.25rem !important;
  }
  

  :deep(.p-inputswitch) {
    height: 1.4rem;
    width: 2.6rem;
    &.p-inputswitch-checked {
        .p-inputswitch-slider::before {
            transform: translateX(1.1rem);
        }
    }

    .p-inputswitch-slider::before {
        width: 0.9rem;
        height: 0.9rem;
        margin-top: -0.45rem;
    }
  }
}

</style>