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
        {
          label: 'Inferno',
          command: () => this.change_color(d3.interpolateInferno)
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
          let sample_table = table.replace('expression', 'sample')
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

          e.experiment_year_species = e.experiment + ' ' + e.species

          const age_months = [...new Set(e.data.map(item => item.age_months))];
          if (age_months.length > 1) {
            // Samples vary in age, shouldn't happen with existing datasets
            console.error('WARNING: More than 1 age in ', table)
          }
          e.age_months = age_months.join(',')

          const data_type = [...new Set(e.data.map(item => item.data_type))];
          if (data_type.length > 1) {
            // More than 1 data type, shouldn't happen
            console.error('WARNING: More than 1 data type in ', table)
          }
          e.data_type = data_type[0]

          const gender = [...new Set(e.data.map(item => item.gender))];
          // if (gender.length > 1) {
          //   // More than 1 gender, may happen
          //   console.error('WARNING: More than 1 gender in ', table)
          // }
          e.gender = gender.join(',')

          const tissue = [...new Set(e.data.map(item => item.tissue))];
          if (tissue.length > 1) {
            // More than 1 tissue, shouldn't happen
            console.error('WARNING: More than 1 tissue in ', table)
          }
          e.tissue = tissue[0]
          
          this.expression_merged = this.expression_merged.concat(e.data)
        })

        this.expression_merged.forEach((e) => {
          // console.log(e)
          e.time_point = parseInt(e.time_point.split('ZT')[1])
          if (e.sample_name.includes('-'))
            e.replicate = e.sample_name.split('-').at(-1)
          else
            e.replicate = e.sample_name.split('_').at(-1)
          e.identifier = `${e.species}_${e.experiment}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}`
          e.identifier = e.identifier.replaceAll(' ', '-');
        })


        // Sort data points alphanumerically on sample_name 
        const sortAlphaNum = (a, b) => a.sample_name.toString().localeCompare(b.sample_name, 'en', { numeric: true })
        this.expression_merged.sort(sortAlphaNum)

        console.log('this.expression_merged')
        console.log(this.expression_merged)

        const grouped_species = _.groupBy(this.expression_merged, e => `${e.species}`);

        const grouped_species_experiment_year = _.groupBy(this.expression_merged, e => `${e.species}_${e.experiment}}`);

        const grouped_species_experiment_year_tissue = Object.keys(grouped_species_experiment_year).map((year) => {
          return [year, _.groupBy(grouped_species_experiment_year[year], e => `${e.tissue}`)];
        });

        const grouped_species_experiment_year_tissue_gene = grouped_species_experiment_year_tissue.map((year) => {
          return [year[0], Object.keys(year[1]).map((tissue) => {
            return [tissue, _.groupBy(year[1][tissue], e => `${e.gene_id}`)];
          })];
        });

        const grouped_species_experiment_year_tissue_gene_gender = grouped_species_experiment_year_tissue_gene.map((year) => {
          return [year[0], year[1].map((tissue) => {
            return [tissue[0], Object.keys(tissue[1]).map((gene) => {
              return [gene, _.groupBy(tissue[1][gene], e => `${e.gender}`)];
            })];
          })];
        });

        const grouped_species_experiment_year_tissue_gene_gender_groupname = grouped_species_experiment_year_tissue_gene_gender.map((year) => {
          return [year[0].replaceAll(' ', '-'), year[1].map((tissue) => {
            return [tissue[0].replaceAll(' ', '-'), tissue[1].map((gene) => {
              return [gene[0].replaceAll(' ', '-'), Object.keys(gene[1]).map((gender) => {
                const grouping = _.groupBy(gene[1][gender], e => `${e.group_name}`)
                const keys = Object.keys(grouping)
                for(let i = 0; i < keys.length; i++) {
                  const key = keys[i]
                  const max = Math.max.apply(Math, grouping[key].map(
                    function(o) { return o.gene_expression; }))
                  const min = Math.min.apply(Math, grouping[key].map(
                    function(o) { return o.gene_expression; }))
                  const mean = _.reduce(grouping[key], function(memo, v) { 
                    return memo + v.gene_expression; 
                  }, 0) / grouping[key].length
                  grouping[key].forEach((sample) => {
                    sample.gene_expression_norm = (sample.gene_expression - min) / (max - min)
                    sample.group_index = i
                    sample.min = min 
                    sample.max = max
                    sample.amplitude = max-min 
                    sample.mean = mean
                  })
                }
                return [gender, grouping];
              })];
            })];
          })];
        });

        this.expression_normalized = grouped_species_experiment_year_tissue_gene_gender_groupname
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized.map(e => e[1]))
        for (let i = 0; i < 2; i++) {
          this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => e[1]));
        }
        // console.log('this.expression_normalized_flattened')
        // console.log(this.expression_normalized_flattened)

        // Flatten the last layer (groupby object)
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => {
          return [].concat.apply([], Object.values(e[1]));
        }));

        const grouped_norm = _.groupBy(this.expression_merged, e => 
          `${e.species}_${e.experiment}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}_ZT${e.time_point}`)

        // console.log('grouped_norm')
        // console.log(grouped_norm)

        this.expression_normalized_averaged = _.mapObject(grouped_norm, function(val, key) {
          // console.log('val')
          // console.log(val)
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
          // console.log('o')
          // console.log(o)

          return o
        });
        console.log('this.expression_normalized_averaged')
        console.log(this.expression_normalized_averaged)

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
          e => `${e.species}_${e.experiment}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}`.replaceAll(' ', '-'))

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
      this.margin = {top: 10, right: 10, bottom: 140, left: 80}

      this.width = this.windowWidth * 0.7 - this.margin.left - this.margin.right,
      this.height = this.windowHeight * 0.9 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 0.75
      this.drawable_height_scale = 0.5
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
          .attr("transform", `translate(${this.margin.left},${this.margin.top})`)

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
        .attr("x", this.width * this.drawable_width_scale * 0.5)
        .attr("y", this.height * this.drawable_height_scale+40)
        .text("Time Point (ZT)");

      // // Initialize Y axis
      // this.y = d3.scaleLinear().range([this.height*this.drawable_height_scale, 0]);
      // this.yAxis = d3.axisLeft().scale(this.y);
      // this.svg.append("g")
      //   .attr("class","myYaxis")
      this.y = d3.scaleBand().range([this.height*this.drawable_height_scale, 0]);
      this.yAxis = d3.axisRight()
        .scale(this.y)
        .tickSize(0);
      this.svg.append("g")
        .attr("transform", `translate(${this.width*this.drawable_width_scale}, 0)`)
        .attr("class","myYaxis")


      this.svg.append("g")
        .attr("class", "y-label")
        .style("font-size", 10)
      
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
      this.update_heat_map()
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

      function formatLabel(label) {
          var parts = label.split("_");
          var species_group = parts.slice(0, 1) + " " + parts.slice(4).join(" ");
          var tissue = parts.slice(2, 3).join(" ").replaceAll('-', ' ') + " - " + parts.slice(3, 4); 
          return [
              parts.slice(1, 2).join(" ").replaceAll('-', ' '),
              tissue,
              species_group.replaceAll('-', ' ')
          ];
      }

      // Create the Y axis
      this.y.domain(groups).padding(0.05);
      var y = this.y
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(this.animationInterval)
          .call(this.yAxis)
          .end()
          .then(() => {
            this.svg.selectAll(".myYaxis .tick text")  // select all the text elements of the x-axis
            .call(function(t) {  // t is the selection of all text elements
              t.each(function(d) {  // for each text element, d is the data bound to the text element
                console.log('tick d')
                console.log(d)
                var text = d3.select(this);  // select the current text element
                text.text('');  // clear the current text
                
                // var words = d.split("_");  // split the label into lines
                var lines = formatLabel(d)
                for (var i = 0; i < lines.length; i++) {
                  text.append("tspan")  // append a tspan for each line
                    .text(lines[i])
                    .attr("x", "0.2em")
                    .attr("dy", i ? "1.2em" : 0);  // adjust vertical position of the second and subsequent lines
                }
              });
            });
          
          })
          

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

      // const ticks = [...Array(groups.length).keys()]
      // const tick_values = groups.map((e) => {
      //   return e.replace(/_/g, "\n").replace(/-/g, " ")
      // })
      // console.log('tick_values')
      // console.log(tick_values)

      // const labels = this.svg.selectAll('.myYaxis .tick text')
      // console.log('labels')
      // console.log(labels)
      // labels.html((d,i,n) => {
      //   console.log(d)
      //   console.log(i)
      //   console.log(n)
      //   console.log(this)
      //   // n.item(i)
      //   return null

      // })
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
    legend() {
      console.log('legend')
      // const num_experiments = this.expression_normalized.length
      // const num_experiments = this.getMaxLengthOfArraysNLevelsDown(this.expression_normalized, 0)
      // console.log('num_experiments: ' + num_experiments)
      console.log(this.expression_normalized)

      const font_size = 10 // '1.0em'
      const self = this
      
      
      const eye_w = font_size * 0.9
      const eye_x_offset = eye_w * 1.2
      // const eye_w = '1.5em'
      const eye_h = font_size * 0.9
      const eye_y_offset = eye_h * 0.8
      // const eye_h = '1.5em'
      const experiment_y_offset = 10
      const text_info_x_offset = 5
      const text_info_margin_bottom = 5
      const text_info_font_size = '0.7em'

      function getTextWidth(text, font) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
      }

      const experimentNamesWidths = this.expression_normalized.map(d => {
        const text = d[0].replaceAll('_', ' ');
        const width = getTextWidth(text, `${font_size} sans-serif`);
        return { name: d[0], width };
      });

      // console.log('experimentNamesWidths')
      // console.log(experimentNamesWidths)
      
      // // Add current index to each element as position 2 in the array
      // this.expression_normalized_indexed = this.expression_normalized.map((d, i) => {
      //   d[2] = i;
      //   return d
      // } );
      // console.log(this.expression_normalized_indexed)

      
      // Count the depth of each level
      this.expression_normalized.forEach((experiment, experimentIndex) => {
        let tissue_counter = 1;
        experiment[1].forEach((tissue, tissueIndex) => {
          let gene_counter = 1;
          tissue[2] = tissue_counter++
          tissue[1].forEach((gene, geneIndex) => {
            let gender_counter = 1;
            gene[2] = gene_counter++
            gene[1].forEach((gender, genderIndex) => {
              gender[2] = gender_counter++
              const num_groups = Object.keys(gender[1]).length
              gender_counter += num_groups
            });
            gene_counter += (gender_counter-1)
          });
          tissue_counter += (gene_counter-1)
        });
      });


      // Helper function to append an svg image to the parent node of an element
      function appendSvgImage(element, text_info_x_offset, eye_y_offset, eye_w, eye_h, self) {
        d3.select(element.parentNode) // Select the parent (text_info) node
          .append('svg:image')
          .attr('class', 'info')
          .attr("xlink:href", infoUrl)
          .attr('type', "image/svg+xml")
          .attr('x', () => element.getBBox().width + text_info_x_offset)
          .attr('y', -eye_y_offset)
          .attr('width', eye_w)
          .attr('height', eye_h)
          .attr('opacity', 1)
          .on('mouseover', self.infoHover)
          .on('mouseout', () => self.svg.selectAll('.info-tooltip').remove());
      }

      // Helper function to append text to the parent node of an element
      function appendLegendTextWithTransition(parent, className, fontSize = '0.7em', onEndCallback) {
        const textElement = parent.append('text')
          .attr('class', className)
          .text(d => d[0].replaceAll('_', ' ').replaceAll('-', ' '))
          .attr('text-anchor', 'left')
          .attr('font-size', fontSize)
          .attr('opacity', 1);

        textElement.transition().on('end', function() {
          onEndCallback(this);
        });
        return textElement;
      } 

      function append_eyes(selection) {
        selection.append('svg:image')
          .attr('class', 'eye')
          .attr("xlink:href", eyeUrl)
          .attr('type', "image/svg+xml")
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', eye_w)
          .attr('height', eye_h)
          .attr('opacity', 1)
        selection.append('svg:image')
          .attr('class', 'eye-off')
          .attr("xlink:href", eyeOffUrl)
          .attr('type', "image/svg+xml")
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', eye_w)
          .attr('height', eye_h)
          .attr('opacity', 0)
        return selection;
      }


      console.log('this.expression_normalized')
      console.log(this.expression_normalized)

      this.svg.select('#legend')
      .style('font-size', `${font_size}px`)
      .selectAll(".legend_experiment")
      .data(this.expression_normalized)
      .join(
        (enter) => {
          console.log('experiment enter')
          console.log(enter)
          const experiment_root = enter.append('g')
          experiment_root.attr('class', 'legend_experiment')
            .style('fill', d3.rgb("#222"))
            .attr('transform', (d,i) => {
              console.log('Enter experiment')
              const xOffset = experimentNamesWidths.slice(0, i).reduce((acc, cur) => {
                return acc + cur.width + eye_x_offset + eye_w;
              }, 0);
              console.log(`xOffset: ${xOffset}`)
              return `translate(${xOffset}, ${experiment_y_offset})`
            })
          const eyesSelection = experiment_root.append('g')
            .attr('class', 'eyes')
            .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
            .on('click', this.experimentClick)
          append_eyes(eyesSelection)
            
          const text_info = experiment_root.append('g')
            .attr('class', 'text_info')
          
          appendLegendTextWithTransition(text_info, 'legend_experiment_text', text_info_font_size, function(textElement) {
            appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
          });

          experiment_root.selectAll('.legend_tissue')
            .data(d => d[1])
            .join(
            (enter) => {
              // Create root g element to position child text elements
              // console.log('tissue enter')
              // console.log(enter)
              const tissue_root = enter.append('g')
              tissue_root.attr('class', 'legend_tissue')
                .style('fill', d3.rgb("#222"))
                .attr('transform', (d,i) => {
                  return `translate(${eye_x_offset}, ${this.legendY_spacing * d[2]})`})
              const eyesSelection = tissue_root.append('g')
                .attr('class', 'eyes')
                .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                .on('click', this.tissueClick)
              append_eyes(eyesSelection)
              
              const text_info = tissue_root.append('g')
                .attr('class', 'text_info')
              appendLegendTextWithTransition(text_info, 'legend_tissue_text', text_info_font_size, function(textElement) {
                appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
              });

              tissue_root.selectAll('.legend_gene')
                .data(d => d[1])
                .join(
                  (enter) => {
                    // console.log('gene enter')
                    // console.log(enter)
                    const gene_root = enter.append('g')
                      .attr('class', 'legend_gene')
                      .attr('transform', (d,i) => {
                        return `translate(${eye_x_offset}, ${this.legendY_spacing * d[2]})`})
                    const eyeSelection = gene_root.append('g')
                      .attr('class', 'eyes')
                      .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                      .on('click', this.geneClick)
                    append_eyes(eyeSelection)
                    const text_info = gene_root.append('g')
                      .attr('class', 'text_info')
                    appendLegendTextWithTransition(text_info, 'legend_gene_text', text_info_font_size, function(textElement) {
                      appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                    })

                    gene_root.selectAll('.legend_gender')
                      .data(d => d[1])
                      .join(
                        (enter) => {
                          // console.log('gender enter')
                          // console.log(enter)
                          const gender_root = enter.append('g')
                            .attr('class', 'legend_gender')
                            .style('fill', d => {
                              const key = Object.keys(d[1])[0]
                              const id = d[1][key][0].identifier
                              return this.getHSL(d[1][key][0], true)
                            })
                            .attr('transform', (d,i) => {
                              const yOffset = this.legendY_spacing * d[2]
                              return `translate(${eye_x_offset}, ${yOffset})`})
                          const eyeSelection = gender_root.append('g')
                            .attr('class', 'eyes')
                            .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                            .on('click', this.genderClick)
                          append_eyes(eyeSelection)

                          const text_info = gender_root.append('g')
                            .attr('class', 'text_info')
                          appendLegendTextWithTransition(text_info, 'legend_gender_text', text_info_font_size, function(textElement) {
                            appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                          });

                          gender_root.selectAll('.legend_groupname')
                            .data(d => {
                              const d_arr = Object.keys(d[1]).map((groupname) => {
                                return [groupname, d[1][groupname]]})
                              return d_arr
                            })
                            .join(
                              (enter) => {
                                // console.log('groupname enter')
                                // console.log(enter)
                                const groupname_root = enter.append('g')
                                  .attr('class', 'legend_groupname')
                                  .style('fill', d => {
                                    return this.getHSL(d[1][0])
                                  })
                                  .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                                    this.legendY_spacing * (i+1)
                                    })`)
                                  
                                const eyeSelection = groupname_root.append('g')
                                  .attr('class', 'eyes')
                                  .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                                  .on('click', this.groupnameClick)
                                append_eyes(eyeSelection)

                                  const text_info = groupname_root.append('g')
                                    .attr('class', 'text_info')
                                  appendLegendTextWithTransition(text_info, 'legend_groupname_text', text_info_font_size, function(textElement) {
                                    appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                                  });

                                 return groupname_root
                              },
                              (exit) => exit.remove()
                            )
                          return gender_root
                        },
                        (exit) => exit.remove()
                      )
                    return gene_root
                  },
                  (exit) => exit.remove()
                )
              return tissue_root
            },
            (exit) => exit.remove()
          )
          return experiment_root
        },
        (update) => {
          
          console.log('update experiment')
          console.log(update)
          const experiment_root = update
            .attr('transform', (d,i) => {
              const xOffset = experimentNamesWidths.slice(0, i).reduce((acc, cur) => {
                return acc + cur.width + eye_x_offset + eye_w;
              }, 0);
              return `translate(${xOffset}, ${experiment_y_offset})`
              })

          experiment_root.select('.legend_experiment_text')
            .text(d => d[0].replaceAll('-', ' '))

          const text_info = experiment_root.select('.text_info')

          text_info.select('.info')
            .attr('x', (d,i) => {
              const text_select = text_info.select('text')
              const groups = text_select._groups[0]
              const width = groups[i].getBBox().width
              return text_info.select('text')._groups[0][i].getBBox().width+5})

          update.selectAll('.legend_tissue')
          .data(d => d[1])
          .join(
            (enter) => {
              // Create root g element to position child text elements
              // console.log('experiment update > tissue enter')
              // console.log(enter)
              const tissue_root = enter.append('g')
              tissue_root.attr('class', 'legend_tissue')
                .style('fill', d3.rgb("#222"))
                .attr('transform', (d,i) => {
                  return `translate(${eye_x_offset}, ${this.legendY_spacing * d[2]})`})
              const eyeSelection = tissue_root.append('g')
                .attr('class', 'eyes')
                .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                .on('click', this.tissueClick)
              append_eyes(eyeSelection)
              const text_info = tissue_root.append('g')
                .attr('class', 'text_info')
              appendLegendTextWithTransition(text_info, 'legend_tissue_text', text_info_font_size, function(textElement) {
                appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
              })


              tissue_root.selectAll('.legend_gene')
                .data(d => d[1])
                .join(
                  (enter) => {
                    // console.log('experiment update > tissue enter > gene enter')
                    // console.log(enter)
                    const gene_root = enter.append('g')
                      .attr('class', 'legend_gene')
                      .attr('transform', (d,i) => { return `translate(${eye_x_offset}, 
                        ${this.legendY_spacing * d[2]})`})
                    const eyeSelection = gene_root.append('g')
                      .attr('class', 'eyes')
                      .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                      .on('click', this.geneClick)
                    append_eyes(eyeSelection)
                    const text_info = gene_root.append('g')
                      .attr('class', 'text_info')
                    appendLegendTextWithTransition(text_info, 'legend_gene_text', text_info_font_size, function(textElement) {
                      appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                    })
                      
                    gene_root.selectAll('.legend_gender')
                      .data(d => d[1])
                      .join(
                        (enter) => {
                          // console.log('experiment update > tissue enter > gene enter > gender enter')
                          // console.log(enter)
                          const gender_root = enter.append('g')
                            .attr('class', 'legend_gender')
                            .style('fill', d => {
                              // console.log('d')
                              // console.log(d)
                              const key = Object.keys(d[1])[0]
                              const id = d[1][key][0].identifier
                              // console.log(id)
                              // return this.getHSL(id)
                            })
                            .attr('transform', (d,i) => {
                              const yOffset = this.legendY_spacing * d[2]
                              return `translate(${eye_x_offset}, ${yOffset})`})
                          const eyeSelection = gender_root.append('g')
                            .attr('class', 'eyes')
                            .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                            .on('click', this.genderClick)
                          append_eyes(eyeSelection)

                          const text_info = gender_root.append('g')
                            .attr('class', 'text_info')
                          appendLegendTextWithTransition(text_info, 'legend_gender_text', text_info_font_size, function(textElement) {
                            appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                          })


                          gender_root.selectAll('.legend_groupname')
                            .data(d => {
                              return Object.keys(d[1]).map((groupname) => {
                                return [groupname, d[1][groupname]]})
                            })
                            .join(
                              (enter) => {
                                // console.log('experiment update > tissue enter > gene enter > gender enter > groupname enter')
                                // console.log(enter)
                                const groupname_root = enter.append('g')
                                  .attr('class', 'legend_groupname')
                                  .style('fill', d => {
                                    return this.getHSL(d[1][0])
                                  })
                                  .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                                    this.legendY_spacing * (i+1)
                                    })`)
                                  
                                const eyeSelection = groupname_root.append('g')
                                  .attr('class', 'eyes')
                                  .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                                  .on('click', this.groupnameClick)
                                append_eyes(eyeSelection)

                                  const text_info = groupname_root.append('g')
                                    .attr('class', 'text_info')
                                  appendLegendTextWithTransition(text_info, 'legend_groupname_text', text_info_font_size, function(textElement) {
                                    appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                                  })

                                  return groupname_root
                              },
                              (exit) => exit.remove()
                            )
                          return gender_root
                        },
                        (exit) => exit.remove()
                      )
                    return gene_root
                  },
                  (exit) => exit.remove()
                )
              return tissue_root
            },
            (update) => {
              // console.log('experiment update > tissue update')
              // console.log(update)
              const tissue_root = update
                .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                  this.legendY_spacing * d[2]
                  })`)
              tissue_root.select('.legend_tissue_text')
                .text(d => d[0].replaceAll('-', ' '))

              const text_info = tissue_root.select('.text_info')
              text_info.select('.info')
                .each(function(d, i) {
                  const textElement = d3.select(this.parentNode).select('text').node();
                  const textElementWidth = textElement.getBBox().width;
                  d3.select(this).attr('x', textElementWidth + text_info_x_offset);
              })

              // text_info.select('.info')
              //   .attr('x', (d,i) => {
              //     const text_select = text_info.select('text')
              //     const groups = text_select._groups[0]
              //     const width = groups[i].getBBox().width
              //     return text_info.select('text')._groups[0][i].getBBox().width+5})

              update.selectAll('.legend_gene')
                .data(d => d[1])
                .join(
                  (enter) => {
                    // console.log('experiment update > tissue update > gene enter')
                    // console.log(enter)
                    const gene_root = enter.append('g')
                      .attr('class', 'legend_gene')
                      .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                        this.legendY_spacing * d[2]
                        })`)
                    const eyeSelection = gene_root.append('g')
                      .attr('class', 'eyes')
                      .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                      .on('click', this.geneClick)
                    append_eyes(eyeSelection)
                    const text_info = gene_root.append('g')
                      .attr('class', 'text_info')
                    appendLegendTextWithTransition(text_info, 'legend_gene_text', text_info_font_size, function(textElement) {
                      appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                    })
                    
                    gene_root.selectAll('.legend_gender')
                    .data(d => d[1])
                    .join(
                      (enter) => {
                        // console.log('experiment update > tissue update > gene enter > gender enter')
                        // console.log(enter)
                        const gender_root = enter.append('g')
                          .attr('class', 'legend_gender')
                          .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                            this.legendY_spacing * d[2]
                            })`)
                        const eyeSelection = gender_root.append('g')
                          .attr('class', 'eyes')
                          .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                          .on('click', this.genderClick)
                        append_eyes(eyeSelection)
                        const text_info = gender_root.append('g')
                          .attr('class', 'text_info')
                        appendLegendTextWithTransition(text_info, 'legend_gender_text', text_info_font_size, function(textElement) {
                          appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                        })

                        
                        gender_root.selectAll('.legend_groupname')
                        .data(d => {
                              return Object.keys(d[1]).map((groupname) => {
                                return [groupname, d[1][groupname]]})
                            })
                        .join(
                          (enter) => {
                            // console.log('experiment update > tissue update > gene enter > gender enter > groupname enter')
                            // console.log(enter)
                            const groupname_root = enter.append('g')
                              .attr('class', 'legend_groupname')
                              .style('fill', d => this.getHSL(d[1][0].identifier))
                              .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                                this.legendY_spacing * (i+1)
                                })`)
                            const eyeSelection = groupname_root.append('g')
                              .attr('class', 'eyes')
                              .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                              .on('click', this.groupnameClick)
                            append_eyes(eyeSelection)
                            const text_info = groupname_root.append('g')
                              .attr('class', 'text_info')
                            appendLegendTextWithTransition(text_info, 'legend_groupname_text', text_info_font_size, function(textElement) {
                              appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                            })
                            return groupname_root
                          },
                          (exit) => exit.remove()
                        )
                        return gender_root
                      },
                      (exit) => exit.remove()
                    )
                    return gene_root
                  },
                  (update) => {
                    // console.log('experiment update > tissue update > gene update')
                    // console.log(update)
                    const gene_root = update.attr('transform', (d,i) => {
                      const yOffset = this.legendY_spacing * d[2]
                      return `translate(${eye_x_offset}, ${yOffset
                      })`
                    })
                    gene_root.select('.legend_gene_text')
                      .text(d => d[0])
                    const text_info = gene_root.select('.text_info')
                    text_info.select('.info')
                      .each(function(d, i) {
                        const textElement = d3.select(this.parentNode).select('text').node();
                        const textElementWidth = textElement.getBBox().width;
                        d3.select(this).attr('x', textElementWidth + text_info_x_offset);
                    })
                    // text_info.select('.info')
                    //   .attr('x', (d,i) => {
                    //     const text_select = text_info.select('text')
                    //     const groups = text_select._groups[0]
                    //     const width = groups[i].getBBox().width
                    //     // console.log('width', width)
                    //     return text_info.select('text')._groups[0][i].getBBox().width+5})
                    
                    update.selectAll('.legend_gender')
                    .data(d => d[1])
                    .join(
                      (enter) => {
                        // console.log('experiment update > tissue update > gene update > gender enter')
                        // console.log(enter)
                        const gender_root = enter.append('g')
                          .attr('class', 'legend_gender')
                          .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                            this.legendY_spacing * d[2]
                            })`)
                        const eyeSelection = gender_root.append('g')
                          .attr('class', 'eyes')
                          .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                          .on('click', this.genderClick)
                        append_eyes(eyeSelection)
                        const text_info = gender_root.append('g')
                          .attr('class', 'text_info')
                        appendLegendTextWithTransition(text_info, 'legend_gender_text', text_info_font_size, function(textElement) {
                          appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                        })

                        
                        enter.selectAll('.legend_groupname')
                        .data(d => {
                              // console.log('d ' + typeof(d))
                              // console.log(d)
                              // console.log(Object.keys(d[1]))
                              const d_arr = Object.keys(d[1]).map((groupname) => {
                                return [groupname, d[1][groupname]]})
                              // console.log('d_arr')
                              // console.log(d_arr)
                              return d_arr
                            })
                        .join(
                          (enter) => {
                            // console.log('experiment update > tissue update > gene update > gender enter > groupname enter')
                            // console.log(enter)
                            const groupname_root = enter.append('g')
                              .attr('class', 'legend_groupname')
                              .style('fill', d => this.getHSL(d[1][0]))
                              .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                                this.legendY_spacing * (i+1)
                                })`)
                            const eyeSelection = groupname_root.append('g')
                              .attr('class', 'eyes')
                              .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                              .on('click', this.groupnameClick)
                            append_eyes(eyeSelection)
                            const text_info = groupname_root.append('g')
                              .attr('class', 'text_info')
                            appendLegendTextWithTransition(text_info, 'legend_groupname_text', text_info_font_size, function(textElement) {
                              appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                            })
                            return groupname_root
                          },
                          (exit) => exit.remove()
                        )
                        return gender_root
                      },
                      (update) => {
                        // console.log('experiment update > tissue update > gene update > gender update')
                        // console.log(update)
                        const gender_root = update.attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                          this.legendY_spacing * d[2]
                          })`)
                        gender_root.select('.legend_gender_text')
                          .text(d => d[0])   
                        const text_info = gender_root.select('.text_info')
                        text_info.select('.info')
                          .each(function(d, i) {
                            const textElement = d3.select(this.parentNode).select('text').node();
                            const textElementWidth = textElement.getBBox().width;
                            d3.select(this).attr('x', textElementWidth + text_info_x_offset);
                        })


                        // text_info.select('.info')
                        //   .attr('x', (d,i) => {
                        //     // const text_select = text_info.select('text')
                        //     // const groups = text_select._groups[0]
                        //     // const width = groups[i].getBBox().width
                        //     // console.log('width', width)
                        //     return text_info.select('text')._groups[0][i].getBBox().width+5})

                        update.selectAll('.legend_groupname')
                          .data(d => {
                              const d_arr = Object.keys(d[1]).map((groupname) => {
                                return [groupname, d[1][groupname]]})
                              return d_arr
                            })
                          .join(
                            (enter) => {
                              // console.log('experiment update > tissue update > gene update > gender update > groupname enter')
                              // console.log(enter)
                              const groupname_root = enter.append('g')
                                .attr('class', 'legend_groupname')
                                .style('fill', d => this.getHSL(d[1][0]))
                                .attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                                  this.legendY_spacing * (i+1)
                                  })`)
                              const eyeSelection = groupname_root.append('g')
                                .attr('class', 'eyes')
                                .attr('transform', (d,i) => `translate(${-eye_x_offset}, ${-eye_y_offset})`)
                                .on('click', this.groupnameClick)
                              append_eyes(eyeSelection)
                              const text_info = groupname_root.append('g')
                                .attr('class', 'text_info')
                              appendLegendTextWithTransition(text_info, 'legend_groupname_text', text_info_font_size, function(textElement) {
                                appendSvgImage(textElement, text_info_x_offset, eye_y_offset, eye_w, eye_h, self);
                              })
                              return groupname_root
                            },
                            (update) => {
                              // console.log('experiment update > tissue update > gene update > groupname update')
                              // console.log(update)
                              const groupname_root = update.attr('transform', (d,i) => `translate(${eye_x_offset}, ${
                                this.legendY_spacing * (i+1)
                                })`)
                                .style('fill', d => {
                                  // console.log('d[1][0].identifier' + d[1][0].identifier)
                                  return this.getHSL(d[1][0])
                                })
                              groupname_root.select('.legend_groupname_text')
                                .text(d => d[0])
                              const text_info = groupname_root.select('.text_info')

                              text_info.select('.info')
                                .each(function(d, i) {
                                  const textElement = d3.select(this.parentNode).select('text').node();
                                  const textElementWidth = textElement.getBBox().width;
                                  d3.select(this).attr('x', textElementWidth + text_info_x_offset);
                              })
                            },
                            (exit) => exit.remove()
                          )
                      },
                      (exit) => exit.remove()
                    )
                  },  
                  (exit) => exit.remove()
                )
            },
            (exit) => exit.remove()
          )     
        },
        (exit) => exit.remove()
      )
      // Set flag that SVG has been fully generated at least once
      this.complete = true
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

      const gene_metadata_table = table.replace('expression', 'sample')
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