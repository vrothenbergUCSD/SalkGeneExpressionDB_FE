<template>
  <div id="bar" class="mx-auto">
    <!-- <div class="text-center mb-5">Bar Plot component</div> -->
    <!-- <div id="plot-options" class="!grid grid-cols-12 mt-3 items-center"> -->
    <div id="plot-options" class="w-3/4 mx-auto mt-1 flex flex-row" v-show="this.complete">
      <!-- <div id="group-by" class="col-start-1 col-span-3"> -->
      <div id="group-by" class="flex flex-col align-items-center mx-2">
        <div class="font-semibold pb-2">Group by:</div>
        <SelectButton v-model="grouped_by" :options="grouped_by_options" @change="updateGroupedBy"/>
      </div>
      <!-- <div id="time-selection" v-show="grouped_by === 'Time'" class="col-start-6 col-span-7"> -->
      <div id="time-selection" v-show="grouped_by === 'Time'" class="flex flex-col align-items-center mx-2">
        <div class="font-semibold pb-2">Time Points (ZT)</div>
        <SelectButton v-model="time_points_selected" 
          :options="time_points_options" optionLabel="name" 
          multiple @change="updateTimePointsSelected"/>
      </div>
      <div id="more-options" class="flex flex-col align-items-center mx-2">
        <div class="font-semibold pb-2">Options</div>
        <div>
          <Button type="button" label="" icon="pi pi-cog" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu"/>
          <Menu id="overlay_menu" ref="menu" :model="menu_items" :popup="true" />
        </div>
      </div>

    </div>


    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>
    
    <div id="plot-area" class="mt-10">
    </div>

    <div id="table-area" class="mt-1">
      <div class="font-semibold">Filtered Dataset</div>
      <DataTable :value="this.expression_merged" :scrollable="true" scrollHeight="400px"
        scrollDirection="both" class="p-datatable-sm">
        <Column field="gene_id" header="Gene ID" style="width: 10rem"></Column>
        <Column field="gene_expression" header="Gene Expression" style="width: 7rem">
          <template #body="slotProps">
            {{Math.round(slotProps.data.gene_expression * 1000)/1000}}
          </template>
        </Column>
        <Column field="data_type" header="Data Type" style="width: 8rem"></Column>
        <Column field="sample_name" header="Sample Name" style="width: 10rem"></Column>
        <Column field="time_point" header="Time Point (ZT)" style="width: 7rem"></Column>
        <Column field="condition" header="Condition" style="width: 7rem"></Column>
        <Column field="species" header="Species" style="width: 8rem"></Column>
        <Column field="tissue" header="Tissue" style="width: 8rem"></Column>
        <Column field="age_months" header="Age (months)" style="width: 8rem"></Column>
        <Column field="gender" header="Gender" style="width: 6rem"></Column>
        <Column field="replicate" header="Replicate" style="width: 8rem"></Column>
        <Column field="number_of_replicates" header="Number of Replicates" style="width: 8rem"></Column>
        <Column field="experiment" header="Experiment" style="width: 8rem"></Column>
        <Column field="institution" header="Institution" style="width: 8rem"></Column>
        <Column field="year" header="Year" style="width: 4rem"></Column>

      </DataTable>

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

import eyeUrl from '@/assets/eye.svg'
import eyeOffUrl from '@/assets/eye-off.svg'
import infoUrl from '@/assets/info.svg'

// import TimeSelection from "@/components/svg/TimeSelection.vue";


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
    Menu,
    Button,
    DataTable,
    Column,
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

      menu_items: [
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
  beforeDestroy() { 
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
    toggle(evt) {
      this.$refs.menu.toggle(evt);
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
      // TODO: Make more efficient by only toggling changed values?
      for (const key of Object.keys(this.time_visibility)) {
        this.time_visibility[key] = 0
      }
      this.time_points_selected.forEach(e => this.time_visibility[e.name] = 1)
      Object.keys(this.time_visibility).forEach(key => {
        const opacity = this.time_visibility[key]
        let id
        if (this.grouped_by == 'Time')
          id = `#group_${key}`
        else if (this.grouped_by == 'Gene')
          id = `#subgroup_${key}`
        
        const bar = d3.select('#bars').selectAll(id)
        bar.transition_attributes('opacity', opacity)
      })
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

        this.gene_expression_data_tables.forEach((e) => {
          const table = e.table_name
          const table_split = table.split('_')
          e.owner = table_split.at(-1)
          const metadata = this.selected_metadata.find(obj => {
            return obj.gene_expression_data_table_name == table
          })

          e.experiment = metadata.experiment
          e.year = metadata.year
          e.institution = metadata.institution
          let sample_table = table.replace('gene_expression_data', 'sample_metadata')
          let expression_data = e.data
          let sample_data = this.sample_metadata_tables.find(obj => {
            return obj.table == sample_table
          }).data

          const merged_data = expression_data.map(itm => ({
              ...sample_data.find((item) => (item.sample_name == itm.sample_name) && item),
              ...itm
          }))
          e.data = merged_data
          e.data.forEach(itm => {
            itm.table = table
            itm.experiment = metadata.experiment
            itm.institution = metadata.institution
            itm.year = metadata.year
          })

          const species = [...new Set(e.data.map(item => item.species))]
          if (species.length > 1) {
            // More than 1 species in a dataset, shouldn't happen!
            console.error('WARNING: More than 1 species in ', table)
          }
          e.species = species[0]

          const age_months = [...new Set(e.data.map(item => item.age_months))]
          if (age_months.length > 1) {
            // Samples vary in age
            console.error('WARNING: More than 1 age in ', table)
          }
          e.age_months = age_months[0]

          const data_type = [...new Set(e.data.map(item => item.data_type))]
          if (data_type.length > 1) {
            // More than 1 data type
            console.error('WARNING: More than 1 data type in ', table)
          }
          e.data_type = data_type[0]

          const gender = [...new Set(e.data.map(item => item.gender))]
          if (gender.length > 1) {
            // More than 1 gender
            console.error('WARNING: More than 1 gender in ', table)
          }
          e.gender = gender[0]

          const tissue = [...new Set(e.data.map(item => item.tissue))]
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

        this.sumstat = d3
          .group(this.expression_normalized_averaged, 
          d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);
        
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
        // Run legend only after it has generated once, after its event firing
        if (this.complete) this.legend()
      }
      
      const elapsed = Date.now() - start
      console.log('update_datasets time elapsed', elapsed)
    },
    initialize_bar_plot() {
      // set the dimensions and margins of the graph
      this.margin = {top: 30, right: 10, bottom: 140, left: 80}
      this.width = this.windowWidth * 0.6 - this.margin.left - this.margin.right,
      this.height = this.windowHeight * 0.55 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 0.8
      this.drawable_height_scale = 1
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
        .attr("x",-this.height/2)
        .attr("transform", "rotate(-90)")
        .text("Gene Expression");

      // Bar groups grouping element
      this.svg.append('g')
        .attr('id', 'bars')

      this.legendX = this.width*this.drawable_width_scale + 5
      this.legendY_spacing = 15
      // Legend 
      this.svg.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${this.legendX}, 0)`)

    },
    update_grouped_bar_plot() {
      console.log('update_grouped_bar_plot')
      const start = Date.now()
      let data, groups, subgroups
      if (this.grouped_by == 'Gene') {
        this.svg.select('.x-label').text('')
        subgroups = this.time_points
        // data = d3.group(gene_groups_map, d => `${d.gene_group}`)
        const gene_groups = _.groupBy(this.expression_normalized_averaged, e => `${e.identifier}`)
        this.group_visibility = this.gene_visibility
        this.subgroup_visibility = this.time_visibility

        data = Object.keys(gene_groups).map((key) => {
          // const grouping = _.groupBy(gene_groups[key], e => `${e.identifier}`)
          return [key, gene_groups[key]]
        })
        groups = Object.keys(gene_groups)

        data.forEach(d => {
          d[1] = d[1].map(e => {
            return {key:e.time_point.toString(), value:e}
          })
        })
      } else if (this.grouped_by == 'Time') {
        this.svg.select('.x-label').text('Time Point (ZT)')
        groups = this.time_points
        this.group_visibility = this.time_visibility
        this.subgroup_visibility = this.gene_visibility
        const time_groups = _.groupBy(this.expression_normalized_averaged, e => `${e.time_point}`)
        data = Object.keys(time_groups).map((key) => {
          const grouping = _.groupBy(time_groups[key], e => `${e.identifier}`)
          return [key, grouping]
        })

        subgroups = [...new Set(... data.map(e => Object.keys(e[1])) )]

        data.forEach(d => {
          d[1] = Object.keys(d[1]).map((id) => {
            return {key:id, value:d[1][id][0]}
          })
        })
      }
      
      this.color = d3.scaleSequential(d3.interpolateWarm)

      this.x.domain(groups)
        .padding([0.1])
      var x = this.x
      this.svg.selectAll(".myXaxis").transition()
        .duration(this.animationInterval)
        .call(this.xAxis);

      if (this.grouped_by == 'Gene') {
        this.svg.selectAll(".myXaxis")
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-45)")
          

        this.svg.selectAll('.myXaxis .tick text')
          .selectAll('tspan')
          .data(d => {
            let text = d.split('_')
            let tissue = text[0].replaceAll('-', ' ')
            let gene_group = text.slice(1).join(' ')
            // console.log(gene_group)
            return [tissue, gene_group]
          })
          .join(
            (enter) => {
              // console.log('enter')
              // console.log(enter)
              enter.append('tspan')
              .attr('id', 'woohoo')
              .attr('x', 0)
              .attr('dx', '-1em')
              .attr('dy', function (d, i) { return (2 * i - 1) + 'em'; })
              .text(d => {
                // console.log(d)
                return d});

            }
          )
          // console.log('all done')
      }

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
              .transition_attributes('opacity', d => this.group_visibility[d[0]])
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
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
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
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
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
              .transition_attributes('opacity', d => this.group_visibility[d[0]])
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
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
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
                    .attr("height", d => this.height - y(d.value.gene_expression_norm_avg))
                    .attr("fill", d => this.getHSL(d.value))
                    .transition_attributes('fill-opacity', d => this.subgroup_visibility[d.key])
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
    },
    legend() {
      // BUG: num_tissues not used, needed for multiple tissues?
      const num_tissues = this.expression_normalized.length
      const num_genes = this.expression_normalized[0][1].length
      const num_groups = this.expression_normalized[0][1][0][1].length

      const legend_indent_px = 13 
      const legend_y_offset_px = 9

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
            .attr('id', d => `legend_tissue_${d[0]}`)
            .attr('transform', (d,i) => `translate(${legend_indent_px}, ${
              this.legendY_spacing*(i*(1+(num_genes*(num_groups + 1))))
              })`)

          tissue_root.append('g')
            .attr('class', 'eyes')
            .attr('transform', (d,i) => `translate(${-legend_indent_px}, ${-legend_y_offset_px})`)
            .on('click', this.tissueClick)
            .append_eyes()
          const text_info = tissue_root.append('g')
            .attr('class', 'text_info')
          text_info.append('text')
            .attr('class', 'legend_tissue_text')
            .text(d => d[0].replaceAll('-', ' '))
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
              // console.log('width', width)
              return text_info.select('text')._groups[0][i].getBBox().width+5})
            .attr('y', -legend_y_offset_px)
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
                  .attr('id', d => {
                    const tissue_gene = d[1][0][1][0].identifier.split('_').slice(0,-1).join('_')
                    return `legend_gene_${tissue_gene}`})
                  .style('fill', d => this.getHSL(d[1][0][1][0], true))
                  .attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                    this.legendY_spacing *(1 + i * (1 + num_groups))
                    })`)
                  .transition_attributes('opacity', 1)
                
                gene_root.append('g')
                  .attr('class', 'eyes')
                  .attr('transform', (d,i) => `translate(${-legend_indent_px}, ${-legend_y_offset_px})`)
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
                  .attr('y', -legend_y_offset_px)
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
                        .attr('id', d => {
                          return `legend_groupname_${d[1][0].identifier}`})
                        .style('fill', d => this.getHSL(d[1][0]))
                        .attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                          this.legendY_spacing * (i+1)
                          })`)
                        
                      groupname_root.append('g')
                        .attr('class', 'eyes')
                        .attr('transform', (d,i) => `translate(${-legend_indent_px}, ${-legend_y_offset_px})`)
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
                        .attr('y', -legend_y_offset_px)
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
          const tissue_root = update.transition_attributes('opacity', 1)
            .attr('id', d => `legend_tissue_${d[0]}`)
            .attr('transform', (d,i) => `translate(${legend_indent_px}, ${
              this.legendY_spacing*(i*(1+(num_genes*(num_groups + 1))))
              })`)
          tissue_root.select('.legend_tissue_text')
              .text(d => d[0].replaceAll('-', ' '))

          const text_info = tissue_root.select('.text_info')
          tissue_root.select('.info')
            .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
              
          update.selectAll('.legend_gene')
            .data(d => d[1])
            .join(
              (enter) => {
                const gene_root = enter.append('g')
                  .attr('class', 'legend_gene')
                  .attr('id', d => {
                    const tissue_gene = d[1][0][1][0].identifier.split('_').slice(0,-1).join('_')
                    return `legend_gene_${tissue_gene}`})
                  .style('fill', d => this.getHSL(d[1][0][1][0], true))
                  .attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                    this.legendY_spacing *(1 + i * (1 + num_groups))
                    })`)
                  .transition_attributes('opacity', 1)
                gene_root.append('g')
                  .attr('class', 'eyes')
                  .attr('transform', (d,i) => `translate(${-legend_indent_px}, ${-legend_y_offset_px})`)
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
                  .attr('y', -legend_y_offset_px)
                  .attr('width', 10)
                  .attr('height', 10)
                  .attr('opacity', 1)
                  .on('mouseover', this.infoHover)
                  .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                gene_root.selectAll('.legend_groupname')
                  .data(d => d[1])
                  .join(
                    (enter) => {
                      const groupname_root = enter.append('g')
                        .transition_attributes('opacity', 1)
                        .attr('class', 'legend_groupname')
                        .attr('id', d => `legend_groupname_${d[1][0].identifier}`)
                        .style('fill', d => this.getHSL(d[1][0]))
                        .attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                          this.legendY_spacing * (i+1)
                          })`)

                      groupname_root.append('g')
                        .attr('class', 'eyes')
                        .attr('transform', (d,i) => `translate(${-legend_indent_px}, ${-legend_y_offset_px})`)
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
                        .attr('y', -legend_y_offset_px)
                        .attr('width', 10)
                        .attr('height', 10)
                        .attr('opacity', 1)
                        .on('mouseover', this.infoHover)
                        .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                      return groupname_root
                    },
                    (update) => {
                      update.attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                        this.legendY_spacing * (i+1)
                        })`)
                        .attr('id', d => `legend_groupname_${d[1][0].identifier}`)
                        .style('fill', d => this.getHSL(d[1][0]))
                        .transition_attributes('opacity', 1)
                      update.select('.eyes').on('click', this.groupnameClick) // Needed?
                      const text_info = update.select('.text_info')
                      update.select('.info')
                        .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
                    },
                    (exit) => exit.transition_attributes('opacity', 0).remove()
                  )
                return gene_root
              },
              (update) => {
                // console.log('tissue update > gene update')
                // console.log(update)
                const gene_root = update.attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                  this.legendY_spacing *(1 + i * (1 + num_groups))
                  })`)
                  .attr('id', d => {
                    const tissue_gene = d[1][0][1][0].identifier.split('_').slice(0,-1).join('_')
                    return `legend_gene_${tissue_gene}`
                  })
                  .style('fill', d => 
                    this.getHSL(d[1][0][1][0], true))
                  .transition_attributes('opacity', 1) 
                gene_root.select('.legend_gene_text')
                    .text(d => d[0])
                gene_root.select('.eyes').on('click', this.geneClick) // Needed?
                const text_info = update.select('.text_info')
                gene_root.select('.info')
                  .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)
                update.selectAll('.legend_groupname')
                  .data(d => d[1])
                  .join(
                    (enter) => {
                      // console.log('tissue update > gene update > groupname enter')
                      // console.log(enter)
                      const groupname_root = enter.append('g')
                        .transition_attributes('opacity', 1)
                        .attr('class', 'legend_groupname')
                        .attr('id', d => `legend_groupname_${d[1][0].identifier}`)
                        .style('fill', d => this.getHSL(d[1][0]))
                        .attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                          this.legendY_spacing * (i+1)
                          })`)
                      groupname_root.append('g')
                        .attr('class', 'eyes')
                        .attr('transform', (d,i) => `translate(${-legend_indent_px}, ${-legend_y_offset_px})`)
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
                        .attr('y', -legend_y_offset_px)
                        .attr('width', 10)
                        .attr('height', 10)
                        .attr('opacity', 1)
                        .on('mouseover', this.infoHover)
                        .on('mouseout', () => this.svg.selectAll('.info-tooltip').remove())
                      return groupname_root
                    },
                    (update) => {
                      update.attr('transform', (d,i) => `translate(${legend_indent_px}, ${
                        this.legendY_spacing * (i+1)
                        })`)
                        .attr('id', d => `legend_groupname_${d[1][0].identifier}`)
                        .style('fill', d => this.getHSL(d[1][0]))
                        .transition_attributes('opacity', 1)
                      update.select('.legend_groupname_text')
                          .text(d => d[0])  
                      update.select('.eyes').on('click', this.groupnameClick) // Needed? 
                      const text_info = update.select('.text_info')
                      update.select('.info')
                        .attr('x', (d,i) => text_info.select('text')._groups[0][i].getBBox().width+5)  
                    },
                    (exit) => exit.transition_attributes('opacity', 0).remove()
                  )
              },
              (exit) => exit.transition_attributes('opacity', 0).remove()
            )
        },
        (exit) => exit.transition_attributes('opacity', 0).remove()
      )

      // Reset eye visibility
      d3.selectAll('.eye').transition_attributes('opacity', 1)
      d3.selectAll('.eye-off').transition_attributes('opacity', 0)

      // Set flag that SVG has been fully generated at least once
      this.complete = true
    },
    getHSL(data, gene=false) {
      // Differentiates groups by making one darker and one lighter
      const name = data.identifier
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
    tissueClick(evt, i) {
      // Toggle visibility of Tissue data for every child gene and group
      const tissue_root = evt.currentTarget.parentNode
      const id = i[1][0][1][0][1][0].identifier.split('_')[0]
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
      const tissue = data[0].replaceAll('-', ' ')
      const table_metadata_list = this.gene_expression_data_tables.filter(e => e.tissue == tissue)
      // TODO: Possible future bug when there's more than 1 dataset for tissue
      if (table_metadata_list.length > 1) {
        console.error('WARNING: More than 1 matching table for tissue', tissue)
      }
      const table_metadata = table_metadata_list[0]
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
      let gene = data[0]
      const sample = data[1][0][1][0]
      const table = sample.table
      const tissue = sample.tissue

      const gene_metadata_table = table.replace('gene_expression_data', 'gene_metadata')
      const gene_metadata_entries = this.gene_metadata.filter(e => e.table_name == gene_metadata_table)

      if (gene_metadata_entries.length > 1 ) {
        console.error('WARNING: Multiple entries in this.gene_metadata')
        gene = gene_metadata_entries.filter(e => e.gene_name == gene_name)[0]
      }
      gene = gene_metadata_entries[0].data[0]
      let text = `Gene: ${gene.gene_name}\n`
      text += `Tissue: ${tissue}\n`
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
      const groupname = data[0]
      const sample = data[1][0]
      const stats = data[2]
      const gene = sample.gene_id
      let text = `Group: ${groupname}\n`
      text += `Gene: ${gene}\n`
      text += `Tissue: ${sample.tissue}\n`
      text += `Age (months): ${sample.age_months}\n`
      text += `Gender: ${sample.gender}\n`
      text += `Species: ${sample.species}\n`
      
      text += `\nExpression Stats\n`
      text += `Amplitude: ${Math.round(stats.amplitude*1000)/1000}\n`
      text += `Min: ${Math.round(stats.min*1000)/1000}\n`
      text += `Max: ${Math.round(stats.max*1000)/1000}\n`
      text += `Mean: ${Math.round(stats.mean*1000)/1000}\n`
      
      return text
    },
    infoHover(evt, d) {
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
      const pad = 3
      const pos_x = p.x - this.margin.left - pad
      const pos_y = p.y - this.margin.top + 22 + pad
      
      g.attr("transform", `translate(${pos_x},${pos_y})`);

      const currType = root.querySelector('text').getAttribute('class').split('_')[1]
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
}

// .time-points {
//   font-size: 0.5rem !important;
// }
</style>