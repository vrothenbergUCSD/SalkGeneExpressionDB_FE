<template>
  <div id="bar" class="mx-auto">
    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>

    <div id="plot-options" class="w-3/4 mx-auto mt-1 flex flex-row" v-show="this.complete">
      <div id="group-by" class="flex flex-col align-items-center mx-2">
        <div class="font-semibold pb-2">Group by:</div>
        <SelectButton v-model="grouped_by" :options="grouped_by_options" @change="updateGroupedBy"/>
      </div>
      <div id="time-selection" v-show="grouped_by === 'Time'" class="flex flex-col align-items-center mx-2">
        <div class="font-semibold pb-2">Time Points (ZT)</div>
        <SelectButton v-model="time_points_selected" 
          :options="time_points_options" optionLabel="name" 
          multiple @change="updateTimePointsSelected"/>
      </div>
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

import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import InputSwitch from 'primevue/inputswitch'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import _ from 'underscore'

import Table from '@/components/svg/Table.vue'

import eyeUrl from '@/assets/eye.svg'
import eyeOffUrl from '@/assets/eye-off.svg'
import infoUrl from '@/assets/info.svg'

// import TimeSelection from "@/components/svg/TimeSelection.vue";

const animationInterval = 250
// Custom function, reduces redundant code for transitions
// Opacity transition, fade in / out
// d3.selection.prototype.transition_attributes = function(
//   attr_name, opacity, duration=animationInterval) {
//   this.transition()
//       .ease(Math.sqrt)
//       .duration(duration)
//       .attr(attr_name, opacity)
//   return this
// }

// // Add toggle visibility SVG icons
// d3.selection.prototype.append_eyes = function() {
//   this.append('svg:image')
//     .attr('class', 'eye')
//     .attr("xlink:href", eyeUrl)
//     .attr('type', "image/svg+xml")
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('width', 10)
//     .attr('height', 10)
//     .attr('opacity', 1)
//   this.append('svg:image')
//     .attr('class', 'eye-off')
//     .attr("xlink:href", eyeOffUrl)
//     .attr('type', "image/svg+xml")
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('width', 10)
//     .attr('height', 10)
//     .attr('opacity', 0)
//   return this
// }

export default {
  name: "BarPlot",
  components: {
    ProgressSpinner,
    SelectButton,
    InputSwitch,
    Menu,
    Button,
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
      selected_metadata: null,

      // Statistics
      expression_merged: [],
      expression_averaged: [],
      expression_normalized: [],
      expression_normalized_averaged: [],
      expression_normalized_flattened: [],

      groups: [],
      subgroups: [],
      group_visibility: null,
      subgroup_visibility: null,  
      time_visibility: null, 
      gene_visibility: null, 

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

      complete: false,
      showReplicatePoints: false,
      showErrorBars: true,

      chart_type: 'Grouped',
      chart_type_options: ['Grouped', 'Stacked'],

      grouped_by: 'Time',
      grouped_by_options: ['Gene', 'Time'],

      time_points_options: null,
      time_points_selected: null,

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
        }
      ],
    }
  },
  async mounted() {
    console.log('BarPlot mounting')
    const start = Date.now()

    this.grouped_by = 'Time'
    this.time_points_options = [
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
    this.time_points_selected = this.time_points_options

    this.initialize_bar_plot()

    if (this.datasets) {
      this.update_datasets()
    }

    const svgElem = document.getElementById('plot-svg')
    svgElem.addEventListener('load', this.legend())

    // const xAxisElem = document.getElementById('myXaxis')
    // xAxisElem.addEventListener('load', this.axisLinebreaks())

    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    })

    const elapsed = Date.now() - start
    console.log('BarPlot mounted, time elapsed: ', elapsed)

  },
  beforeUnmount() {
    console.log('beforeUnmount')
    document.getElementById('plot-svg').remove()


  },
  beforeDestroy() { 
    console.log('beforeDestroy')
    window.removeEventListener('resize', this.onResize); 
    
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
    change_color(d3color) {
      this.color = d3.scaleSequential(d3color)
      this.update_grouped_bar_plot()
      this.legend()
    },
    onResize() {
      this.windowHeight = window.innerHeight
      this.windowWidth = window.innerWidth
    },
    axisLinebreaks() {
      // Line breaks for X labels if grouped by Gene 
      if (this.grouped_by == 'Gene') {
        this.svg.selectAll('.myXaxis .tick text').call(function(t) {   
          // console.log('here')
          // console.log(t)             
          t.each(function(d) { // for each one
            // console.log('inside')
            const self = d3.select(this);
            // console.log(self) // Selection
            let st = self.text()
            // console.log(st) 
            if (st == '') {
              // Not yet initialized.. 
              // console.log('Not yet initialized')
              st = self._groups[0][0]
   
            }

            // let s = st.split('_')  // get the text and split it
            // console.log(s)
            // self.text(''); // clear it out
            // console.log(self)
            // self.append("tspan") // insert two tspans
            //   .attr("x", 0)
            //   .attr("dy",".8em")
            //   .text(s[0]);
            // self.append("tspan")
            //   .attr("x", 0)
            //   .attr("dy",".8em")
            //   .text(s[1]);
            // self.append("tspan")
            //   .attr("x", 0)
            //   .attr("dy",".8em")
            //   .text(s[2]);
          })
        })

      }

    },
    updateGroupedBy(evt) {
      this.update_grouped_bar_plot()
    },
    updateTimePointsSelected(evt) {
      console.log('updateTimePointsSelected')
      // console.log(evt)
      // console.log('time_points_selected')
      // console.log(this.time_points_selected)
      for (const key of Object.keys(this.time_visibility)) {
        this.time_visibility[key] = 0
      }
      this.time_points_selected.forEach(e => this.time_visibility[e.name] = 1)
      // TODO: Necessary?
      // Object.keys(this.time_visibility).forEach(key => {
      //   const opacity = this.time_visibility[key]
      //   if (opacity == 0) {
      //     // console.log('opacity == 0', key)
      //     let id
      //     if (this.grouped_by == 'Time')
      //       id = `#group_${key}`
      //     else if (this.grouped_by == 'Gene')
      //       id = `#subgroup_${key}`
      //     const bars = d3.select('#bars')
      //     const rects = bars.selectAll(id)
    
      //     rects.transition_attributes('fill-opacity', 0).remove()

      //   }

      // })
      this.update_grouped_bar_plot()
    },
    update_datasets() {
      // Processes datasets into various arrays such as grouped by tissue, gene, condition
      // Calculates normalization and standard error values
      console.log('update_datasets')
      const start = Date.now()
      this.genes_str_arr = this.genes.map((d) => d.name)
      if (this.datasets) {
        this.expression_merged = []
        
        // Deep copy!  Prevents unexpected behavior when switching between Bar and Line.
        this.gene_expression_data_tables = JSON.parse(JSON.stringify(this.datasets.gene_expression_data_tables))
        this.gene_metadata = JSON.parse(JSON.stringify(this.datasets.gene_metadata))
        this.sample_metadata_tables = JSON.parse(JSON.stringify(this.datasets.sample_metadata_tables))
        this.selected_metadata = JSON.parse(JSON.stringify(this.datasets.selected_metadata))

        console.log('this.gene_expression_data_tables')
        console.log(this.gene_expression_data_tables)

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

          e.experiment_year_species = e.experiment + ' ' + e.year + ' ' + e.species

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

        console.log('DEBUG this.expression_merged')
        console.log(this.expression_merged)

        this.expression_merged.forEach((e) => {
          // console.log(e)
          e.time_point = parseInt(e.time_point.split('ZT')[1])
          if (e.sample_name.includes('-'))
            e.replicate = e.sample_name.split('-').at(-1)
          else
            e.replicate = e.sample_name.split('_').at(-1)
          e.identifier = `${e.species}_${e.experiment}_${e.year}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}`
          e.identifier = e.identifier.replaceAll(' ', '-');
        })

        // Sort data points alphanumerically on sample_name 
        const sortAlphaNum = (a, b) => a.sample_name.toString().localeCompare(b.sample_name, 'en', { numeric: true })
        this.expression_merged.sort(sortAlphaNum)

        const grouped_species = _.groupBy(this.expression_merged, e => `${e.species}`);

        const grouped_species_experiment_year = _.groupBy(this.expression_merged, e => `${e.species}_${e.experiment}_${e.year.toString()}`);

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

        // Flatten the last layer (groupby object)
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => {
          return [].concat.apply([], Object.values(e[1]));
        }));

        const grouped_norm = _.groupBy(this.expression_merged, e => 
          `${e.species}_${e.experiment}_${e.year}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}_ZT${e.time_point}`)

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

        console.log('this.expression_normalized_averaged')
        console.log(this.expression_normalized_averaged)

        this.sumstat = d3
          .group(this.expression_normalized_averaged, 
          e => `${e.species}_${e.experiment}_${e.year}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}`.replaceAll(' ', '-'))

        this.sumstat_visibility = Object.fromEntries(
          new Map([...this.sumstat.keys()].map(e => [e, 1])))

        this.gene_visibility = Object.fromEntries(
          new Map([...this.sumstat.keys()].map(e => [e, 1])))

        this.time_points = [...new Set(this.expression_normalized_averaged.map(e => e.time_point))]
          .map(el => el.toString())
        var collator = new Intl.Collator([], {numeric: true});
        this.time_points.sort((a, b) => collator.compare(a, b));

        // Reset time point visibilities
        this.time_points_selected = this.time_points_options

        this.time_visibility = Object.fromEntries(new Map([...this.time_points].map(e => [e, 1])))

        this.categories = [...new Set(
          [...this.sumstat.keys()] 
          .map(e => e.split('_').slice(0,-1).join('_'))
          )]

        this.cat_map = new Map(this.categories.map((d,i) => [
          d, i/this.categories.length
        ]))

        // Reset visibilities 
        d3.selectAll('subgroup-rect').transition_attributes('fill-opacity', 1)
        d3.selectAll('bar-group').transition_attributes('opacity', 1)

        this.update_grouped_bar_plot()
        this.legend()
      }
      
      const elapsed = Date.now() - start
      console.log('update_datasets time elapsed', elapsed)
    },
    initialize_bar_plot() {
      // set the dimensions and margins of the graph
      this.margin = {top: 10, right: 10, bottom: 140, left: 80}
      this.width = this.windowWidth * 0.7 - this.margin.left - this.margin.right,
      this.height = this.windowHeight * 0.9 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 0.9
      this.drawable_height_scale = 0.5

      this.svg = d3.select("#plot-area")
          .append("svg")
            .attr("id", "plot-svg")
            .attr("viewBox", 
              `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMid")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
            .attr("style", "font-family:sans-serif")
          .append("g")
            .attr("transform", 
              `translate(${this.margin.left},${this.margin.top})`);

      // Initialize X axis
      this.x = d3.scaleBand().range([0,this.width*this.drawable_width_scale])
      this.xAxis = d3.axisBottom().scale(this.x);
      this.svg.append("g")
          .attr("transform", `translate(0, ${this.height*this.drawable_height_scale})`)
          .attr("class","myXaxis")
          .attr('id', 'myXaxis')

      // X axis label
      this.svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", this.width*this.drawable_width_scale / 2)
        .attr("y", this.height*this.drawable_height_scale + 40)
        .text("Time Point (ZT)")

      // Initialize Y axis
      this.y = d3.scaleLinear().range([this.height*this.drawable_height_scale, 0])
      this.yAxis = d3.axisLeft().scale(this.y)
      this.svg.append("g")
        .attr("class","myYaxis")

      // Y axis label 
      this.svg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("y", -45)
        .attr("x",-this.height*this.drawable_height_scale/2)
        .attr("transform", "rotate(-90)")
        .text("Gene Expression");

      // Bar groups grouping element
      this.svg.append('g')
        .attr('id', 'bars')

      this.legendX = this.width*this.drawable_width_scale + 5
      this.legendY = this.height*this.drawable_height_scale + 60
      this.legendY_spacing = 10
      // Legend 
      this.svg.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(0, ${this.legendY})`)

      this.color = d3.scaleSequential(d3.interpolateSinebow)

    },
    update_grouped_bar_plot() {
      console.log('update_grouped_bar_plot')
      const start = Date.now()
      let data, groups, subgroups
      if (this.grouped_by == 'Gene') {
        this.svg.select('.x-label').text('')
        subgroups = [...this.time_points].filter(e => this.time_visibility[e])
        // data = d3.group(gene_groups_map, d => `${d.gene_group}`)
        const gene_groups = _.groupBy(this.expression_normalized_averaged, 
          e => `${e.identifier}`)
        this.group_visibility = this.gene_visibility
        console.log('group_visibility')
        console.log(this.group_visibility)
        this.subgroup_visibility = this.time_visibility
        console.log('subgroup_visibility')
        console.log(this.subgroup_visibility)

        data = Object.keys(gene_groups).map((key) => {
          // const grouping = _.groupBy(gene_groups[key], e => `${e.identifier}`)
          return [key, gene_groups[key]]
        })

        groups = [...Object.keys(gene_groups)].filter(e => this.gene_visibility[e])

        data.forEach(d => {
          d[1] = d[1].map(e => {
            return {key:e.time_point.toString(), value:e}
          })
        })

        data.forEach(d => {
          d[1] = d[1].filter(key_val => this.time_visibility[key_val.key])
        })       
        
      } else if (this.grouped_by == 'Time') {
        this.svg.select('.x-label').text('Time Point (ZT)')
        groups = [...this.time_points].filter(e => this.time_visibility[e])
        this.group_visibility = this.time_visibility
        this.subgroup_visibility = this.gene_visibility
        const time_groups = _.groupBy(this.expression_normalized_averaged, e => `${e.time_point}`)
        data = Object.keys(time_groups).map((key) => {
          const grouping = _.groupBy(time_groups[key], e => `${e.identifier}`)
          return [key, grouping]
        })
        console.log('data')
        console.log(data)

        subgroups = [...new Set(... data.map(e => Object.keys(e[1])) )].filter(e => 
          this.gene_visibility[e])
        console.log('subgroups')
        console.log(subgroups)

        data.forEach(d => {
          d[1] = Object.keys(d[1]).map((id) => {
            return {key:id, value:d[1][id][0]}
          })
        })
        
        data = data.filter(e => this.time_visibility[e[0]])
      }
      
      

      this.x.domain(groups)
        .padding([0.1])
      var x = this.x
      this.svg.selectAll(".myXaxis").transition()
        .duration(this.animationInterval)
        .call(this.xAxis);

      if (this.grouped_by == 'Gene') {
          
        this.svg.selectAll('.myXaxis .tick text')
          .selectAll('tspan')
          .data(d => {
            console.log('d')
            console.log(d)
            let text = d.replaceAll('-', ' ').split('_')
            console.log('text')
            console.log(text)

            const experiment = text.slice(0,3).join('_')
            console.log('experiment')
            console.log(experiment)

            
            let tissue = text[3]
            const gene_group = text.slice(4, text.length).join(' ')
            console.log('tissue ' + tissue)
            console.log('gene_group ' + gene_group)
            const result = [{ value: experiment }, { value: tissue }, { value: gene_group }]
            console.log('result')
            console.log(result)
            return result;
          })
          .join(
            (enter) => {
              console.log('enter')
              console.log(enter)
              // Create the foreignObject elements
              const lineHeight = 14;
              const labelWrapperWidth = this.x.bandwidth();

              enter.append('foreignObject')
                .attr("width", labelWrapperWidth)
                .attr("height", 3 * lineHeight)
                .append("xhtml:div")
                .style("line-height", `${lineHeight}px`)
                .style("width", `${labelWrapperWidth}px`)
                .style("word-wrap", "break-word")
                .style("text-align", "center")
                .selectAll('div')
                .data(d => d)
                .join('div')
                .text(d => d.value);
            },
            (exit) => exit.remove()
          );

      }


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

      // Display grouped bars
      this.svg.select("#bars")
        .selectAll('.bar-group')
        .data(data)
        .join(
          (enter) => {
            enter.append('g')
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .attr("class", "bar-group")
              .attr('id', d => `group_${d[0]}`)
              // .transition_attributes('opacity', d => this.group_visibility[d[0]])
              .selectAll(".subgroup-rect")
              .data(d => d[1])
              .join(
                (enter) => {
                  enter.append('rect')
                    .attr("class", 'subgroup-rect')
                    .attr('id', d => `subgroup_${d.key}`)
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height*this.drawable_height_scale - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    // .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
                    .on("mouseover", (evt, d) => {
                      this.svg.append('g').attr('class', 'tooltip')
                          .call(this.popover, d)
                    })
                    .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
                },
                (update) => {
                  update
                    .attr('id', d => `subgroup_${d.key}`)
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height*this.drawable_height_scale - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    // .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
                    .on("mouseover", (evt, d) => {
                      this.svg.append('g').attr('class', 'tooltip')
                          .call(this.popover, d)
                    })
                    .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
                },
                (exit) => {
                  exit.transition_attributes('fill-opacity', 0).remove()
                }
              )
          },
          (update) => {
            update
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .attr('id', d => `group_${d[0]}`)
              // .transition_attributes('opacity', d => this.group_visibility[d[0]])
              .selectAll(".subgroup-rect")
              .data(d => d[1])
              .join(
                (enter) => {              
                  enter.append('rect')
                    .attr("class", "subgroup-rect")
                    .attr('id', d => `subgroup_${d.key}`)
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height*this.drawable_height_scale - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    // .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
                    .on("mouseover", (evt, d) => {
                      this.svg.append('g').attr('class', 'tooltip')
                          .call(this.popover, d)
                    })
                    .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
                },
                (update) => {
                  update
                    .attr('id', d => `subgroup_${d.key}`)
                    .attr("x", d => this.xSubgroup(d.key))
                    .attr("y", d => this.y(d.value.gene_expression_norm_avg))
                    .attr("width", this.xSubgroup.bandwidth())
                    .attr("height", d => this.height*this.drawable_height_scale - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    // .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
                    .on("mouseover", (evt, d) => {
                      this.svg.append('g').attr('class', 'tooltip')
                          .call(this.popover, d)
                    })
                    .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
                  
                },
                (exit) => exit.transition_attributes('fill-opacity',0).remove()
              )
          },
          (exit) => exit.transition_attributes('opacity', 0).remove()
        )

      const elapsed = Date.now() - start
      console.log('update_grouped_bar_plot time elapsed: ', elapsed)
      this.legend()
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
    getHSL(sample, gender=false) {
      // Differentiates groups by making one darker and one lighter
      // cat_map["Mus musculus_TRF Experiment_2018_Amygdala_Clock_Male_TRF"] = 0.75
      const shade_factor = 3
      // console.log('getHSL')
      // console.log(sample)
      let name 
      let group_index
      if (typeof(sample) == 'object') {
        name = sample.identifier
        group_index = sample.group_index
      } else {
        name = sample
        group_index = 0
        gender = true
      }
      
      const name_split = name.split('_')
      let id
      if (name_split.length > 6) {
        // ['Mus musculus', 'TRF Experiment', '2018', 'Adrenal gland', 'Clock', 'Male', 'ALF', 'ZT12']
        id = name_split.slice(0, 6).join('_')
      } else {
        console.error('getHSL: unexpected name length')
        // id = name_split.slice(0, 5).join('_')
      }
      // console.log('id ' + id)
      // console.log(this.cat_map.get(id))
      
      let hsl = d3.hsl(this.color(this.cat_map.get(id)))
      // console.log(hsl)
      
      // If gender flag is true, use unshaded base color 
      if (!gender) {
        const factor = 1 + (((group_index === 0) - 0.5) / shade_factor)
        hsl.l *= factor
      }

      return hsl
    },
    change_color(d3color) {
      this.color = d3.scaleSequential(d3color)
      this.update_line_plot()
      this.legend()
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
    popover(g, data) {
      // Tooltip popover 
      const text_value = this.popover_text(data.value)
      if (!text_value) return g.style("display", "none")
      const time_point = data.value.time_point 
      if (!this.time_visibility[time_point]) return g.style("display", "none")
      const gene_identifier = data.value.identifier
      if (!this.gene_visibility[gene_identifier]) return g.style("display", "none")
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
          .attr("stroke", this.getHSL(data.value));

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
        parentVal = data.value.identifier

      // tooltip positioning
      const {x, y, width: w, height: h} = text.node().getBBox()
      text.attr("transform", `translate(${-w / 2},${15 - y})`)
      const transform_x = this.x(parentVal) + this.xSubgroup(data.key) + this.xSubgroup.bandwidth()/2
      const transform_y = Math.max(this.y(data.value.gene_expression_norm_avg)-h-25,-this.margin.top)
      
      g.attr("transform", `translate(${transform_x},${transform_y})`)
      
      // tooltip container path
      path.attr("d", `M${-w / 2 - 10},5 H${w / 2 + 10},H ${w / 2 + 10} v ${h+20} h ${-w/2-5} l-5,5 l-5,-5 h${-w/2-5} z`)
    },
    toggleVisibility(newOpacity, id) {
      // Toggles visibility by gene and group
      let matching_keys, bars
      if (this.grouped_by == 'Time') {
        // Group is Time
        // Subgroup is Gene + TRF/ALF
        matching_keys = Object.keys(this.subgroup_visibility).filter(e => e.includes(id))
        matching_keys.forEach(e => this.subgroup_visibility[e] = newOpacity)
        bars = d3.select('#bars').selectAll(`[id^='subgroup_${id}']`)
      } else if (this.grouped_by == 'Gene') {
        // Group is Gene + TRF/ALF
        // Subgroup is Time
        matching_keys = Object.keys(this.group_visibility).filter(e => e.includes(id))
        matching_keys.forEach(e => this.group_visibility[e] = newOpacity)
        bars = d3.select('#bars').selectAll(`[id^='group_${id}']`).selectAll('.subgroup-rect')
      }
      bars.transition_attributes('fill-opacity', newOpacity)
    },
    experimentClick(evt, i) {
      // Toggle visibility of Experiment data for every child gene and group
      // console.log('experimentClick')
      //id="line_Mus-musculus_TRF-Experiment_2019_Adrenal-gland_Clock_Female_ALF"
      const experiment_root = evt.currentTarget.parentNode
      // TODO: Fix split
      // console.log(i[0])
      const id = i[0]
      // console.log('id', id)
      const opacity = experiment_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1

      const eyesOn = experiment_root.querySelectorAll('.eye')
      const eyesOff = experiment_root.querySelectorAll('.eye-off')
      eyesOn.forEach(e => e.setAttribute('opacity', newOpacity))
      eyesOff.forEach(e => e.setAttribute('opacity', opacity))

      this.toggleVisibility(newOpacity, id)
    },
    tissueClick(evt, i) {
      // Toggle visibility of Tissue data for every child gene and group
      // console.log('tissueClick')
      // console.log(evt)
      // console.log(i)
      const tissue_root = evt.currentTarget.parentNode
      // console.log('tissue_root')
      // console.log(tissue_root)
      const tissue = i[0]
      const groups = i[1][0][1][0][1]
      const group_key = Object.keys(groups)[0]
      const sample = groups[group_key][0]
      const id = sample.identifier
      const index = id.indexOf(tissue);
      const id_prefix = id.substring(0, index + tissue.length);

      const opacity = tissue_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1

      const eyesOn = tissue_root.querySelectorAll('.eye')
      const eyesOff = tissue_root.querySelectorAll('.eye-off')
      eyesOn.forEach(e => e.setAttribute('opacity', newOpacity))
      eyesOff.forEach(e => e.setAttribute('opacity', opacity))

      this.toggleVisibility(newOpacity, id_prefix)
    },
    geneClick(evt, i) {
      // Toggle visibility of Tissue_Gene data for both groups
      // console.log('geneClick')
      const gene_root = evt.currentTarget.parentNode

      const gene = i[0]
      // console.log('gene', gene)
      const groups = i[1][0][1]
      const group_key = Object.keys(groups)[0]
      const sample = groups[group_key][0]
      const id = sample.identifier
      const index = id.indexOf(gene);
      const id_prefix = id.substring(0, index + gene.length);
      
      const opacity = gene_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1
      const eyesOn = gene_root.querySelectorAll('.eye')
      const eyesOff = gene_root.querySelectorAll('.eye-off')
      eyesOn.forEach(e => e.setAttribute('opacity', newOpacity))
      eyesOff.forEach(e => e.setAttribute('opacity', opacity))
      
      this.toggleVisibility(newOpacity, id_prefix)
    },
    genderClick(evt, i) {
      // Toggle visibility of Tissue_Gene data for both groups
      // console.log('genderClick')
      const gender_root = evt.currentTarget.parentNode
      
      const gender = i[0]
      // console.log('gender', gender)
      const groups = i[1]
      const group_key = Object.keys(groups)[0]
      const sample = groups[group_key][0]
      const id = sample.identifier
      const index = id.indexOf(gender);
      const id_prefix = id.substring(0, index + gender.length);
      
      const opacity = gender_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1
      const eyesOn = gender_root.querySelectorAll('.eye')
      const eyesOff = gender_root.querySelectorAll('.eye-off')
      eyesOn.forEach(e => e.setAttribute('opacity', newOpacity))
      eyesOff.forEach(e => e.setAttribute('opacity', opacity))
      
      this.toggleVisibility(newOpacity, id_prefix)
    },
    groupnameClick(evt, i) {
      // Toggle visibility of Tissue_Gene_Groupname data
      // console.log('groupnameClick')
      const groupname_root = evt.currentTarget.parentNode
      // console.log(i[1][0])
      const id = i[1][0].identifier
      // console.log('id', id)
      
      const opacity = groupname_root.querySelector('.eye').getAttribute('opacity')
      const newOpacity = (opacity == 1) ? 0 : 1
      const eyeOn = groupname_root.querySelector('.eye')
      const eyeOff = groupname_root.querySelector('.eye-off')
      eyeOn.setAttribute('opacity', newOpacity)
      eyeOff.setAttribute('opacity', opacity)

      this.toggleVisibility(newOpacity, id)
    },  
    infoExperimentText(data) {
      // TODO: Add more metadata when new fields created for dataset upload page
      // console.log('infoExperimentText')
      // console.log(data)
      const experiment = data[0]
      // console.log(experiment)
      // Get sample 
      const groups = data[1][0][1][0][1][0][1]
      const group_key = Object.keys(groups)[0]
      const sample = groups[group_key][0]
      const table_name = sample.table
      // TODO: Filter gene expression data tables by experiment
      //  composite of species_experiment_year
      const table_metadata_list = this.gene_expression_data_tables.filter(e => 
        e.table_name == table_name)
      // TODO: Possible future bug when there's more than 1 dataset for tissue
      if (table_metadata_list.length > 1) {
        console.error('WARNING: More than 1 matching table for tissue', tissue)
      }
      const table_metadata = table_metadata_list[0]
      console.log(table_metadata)

      // console.log(table_metadata)
      let text = `Experiment: ${table_metadata.experiment}\n`
      text += `Year: ${table_metadata.year}\n`
      text += `Species: ${table_metadata.species}\n`
      // text += `Number of Samples: ${table_metadata.data.length}\n`
      text += `Data Type: ${table_metadata.data_type}\n`
      text += `Age (months): ${table_metadata.age_months}\n`
      return text
    }, 
    infoTissueText(data) {
      // TODO: Add more metadata when new fields created for dataset upload page
      // console.log('infoTissueText')
      // console.log(data)
      const tissue = data[0].replaceAll('-', ' ')
      // console.log(tissue)
      // Get sample 
      const groups = data[1][0][1][0][1]
      const group_key = Object.keys(groups)[0]
      const sample = groups[group_key][0]
      const table_name = sample.table
      const table_metadata_list = this.gene_expression_data_tables.filter(e => 
        e.table_name == table_name)
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
      // text += `Number of Samples: ${table_metadata.data.length}\n`
      text += `Data Type: ${table_metadata.data_type}\n`
      text += `Age (months): ${table_metadata.age_months}\n`
      
      return text
    },
    infoGeneText(data) {
      // console.log('infoGeneText')
      // console.log(data)
      let gene_name = data[0]
      // console.log('gene_name', gene_name)
      const groups = data[1][0][1]
      const group_key = Object.keys(groups)[0]
      const sample = groups[group_key][0]
      const table_name = sample.table
      // console.log('table', table)

      const gene_metadata_table = table_name.replace('gene_expression_data', 'gene_metadata')
      // console.log(gene_metadata_table)
      const gene_metadata_entries = this.gene_metadata.filter(e => 
        e.table_name == gene_metadata_table)
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

      // Break info text into substrings of at most 50 characters
      const maxWidth = 25

      function splitStringByWidth(str, maxWidth) {
        if (typeof str !== 'string') {
          // console.error('Invalid input: str must be a string');
          // return [str];
          str = str.toString()
        }
        const words = str.split(' ');
        let currentLine = '';
        let result = [];

        for (const word of words) {
          if (currentLine.length + word.length <= maxWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            result.push(currentLine);
            currentLine = word;
          }
        }
        result.push(currentLine); // Push the last line
        return result;
      }

      function splitStringsNewlines(str, maxWidth) {
        let split_text = splitStringByWidth(str, maxWidth)
        let result = ''
        split_text.forEach((substring, index) => {
          result += `  ${substring}\n`
        });
        return result
      }

      let text = `Gene:` + splitStringsNewlines(gene.gene_name, maxWidth)
      text += `Gene ID:` + splitStringsNewlines(gene.gene_id, maxWidth)
      text += `External Gene Name:` + splitStringsNewlines(gene.external_gene_name, maxWidth)
      text += `Description: ` + splitStringsNewlines(gene.description, maxWidth)
      // text += `Gene Biotype: ` + ${gene.gene_biotype}\n`
      text += `Ensembl Gene ID:` + splitStringsNewlines(gene.ensembl_gene_id, maxWidth)
      text += `Ensembl Peptide ID:` +  splitStringsNewlines(gene.ensembl_gene_id, maxWidth)
      text += `Chr:` + splitStringsNewlines(gene.chr, maxWidth)
      text += `Start:` + splitStringsNewlines(gene.start, maxWidth)
      text += `End:` + splitStringsNewlines(gene.end, maxWidth)
      text += `Length:` + splitStringsNewlines(gene.length, maxWidth)
      text += `Strand:` + splitStringsNewlines(gene.strand, maxWidth)
      text += `Annotation Divergence:` + splitStringsNewlines(gene.annotation_divergence, maxWidth)
      text += `Copies:` + splitStringsNewlines(gene.copies, maxWidth)
      text += `Refseq:` + splitStringsNewlines(gene.refseq, maxWidth)

      // console.log(text)
      
      
      return text
    },
    infoGenderText(data) {
      // console.log('infoGenderText')
      // console.log(data)
      const gender = data[0]
      const groups = data[1]
      const group_key = Object.keys(groups)[0]
      const sample = groups[group_key][0]

      let num_samples = 0;
      for (let key in groups) {
        if (groups.hasOwnProperty(key)) {
          num_samples += groups[key].length;
        }
      }

      let text = `Gender: ${gender}\n`
      text += `Age (months): ${sample.age_months}\n`
      text += `Species: ${sample.species}\n`
      text += `Tissue: ${sample.tissue}\n`
      text += `Number of Samples: ${num_samples}\n`
      
      return text
    },
    infoGroupnameText(data) {
      // console.log('infoGroupnameText')
      // console.log(data)
      const groupname = data[0]
      const sample = data[1][0]
      const stats = data[2]

      let text = `Condition: ${groupname}\n`
      text += `Age (months): ${sample.age_months}\n`
      text += `Gender: ${sample.gender}\n`
      text += `Species: ${sample.species}\n`
      text += `Tissue: ${sample.tissue}\n`
      text += `Number of Samples: ${data[1].length}\n`
      text += `\nExpression Stats\n`
      text += `Amplitude: ${Math.round(sample.amplitude*1000)/1000}\n`
      text += `Min: ${Math.round(sample.min*1000)/1000}\n`
      text += `Max: ${Math.round(sample.max*1000)/1000}\n`
      text += `Mean: ${Math.round(sample.mean*1000)/1000}\n`
      
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
      if (currType == 'experiment') {
        info_text = this.infoExperimentText(d)
      } else if (currType == 'tissue') {
        info_text = this.infoTissueText(d)
      } else if (currType == 'gene') {
        info_text = this.infoGeneText(d)
      } else if (currType == 'gender') {
        info_text = this.infoGenderText(d)
      } else if (currType == 'groupname') {
        info_text = this.infoGroupnameText(d)
      }
      if (!info_text) return g.style('display', 'none')

      // console.log('info_text', info_text)
      
      // tooltip group
      g.style("display", "flex")
        .style("pointer-events", "none")
        .style("font", "8px sans-serif");

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
      let wOffset = w
      if (-wOffset + pos_x < 0) {
        wOffset = 0
      }
      let hOffset = 0
      if (hOffset + pos_y > this.height) {
        hOffset = -h
      }
      text_selection.attr("transform", `translate(${-wOffset},${hOffset})`);
      // console.log('position: ' + x + ', ' + y + ', ' + w + ', ' + h)

      // Background dimensions relative to text size
      rect
        .attr('x', -wOffset-pad)
        .attr('y', hOffset+y-pad)
        .attr('width', w+2*pad)
        .attr('height', h+2*pad)

      // console.log('this.gene_expression_data_tables')
      // console.log(this.gene_expression_data_tables)
    }
  }

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