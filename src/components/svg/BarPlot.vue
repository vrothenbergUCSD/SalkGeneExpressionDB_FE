<template>
  <div id="bar" class="mx-auto">
    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>
    
    <div id="plot-container">
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
      <div id="plot-area-legend" class="flex space-x-4 mt-3 p-2">
        <div id="plot-area" class="flex-grow">
        </div>
        <div id="legend-area" class="flex-none">
          <Tree :value="this.nodes" class="custom-tree" v-model:expandedKeys="expandedKeys"
                selectionMode="single" @nodeSelect="toggleDatasetVisibility">
            <template #default="slotProps">
                <div class="icon-label" :class="{ 'disabled-node': !slotProps.node.visible }" :style="{color: getNodeColor(slotProps.node)}">
                  <span v-if="slotProps.node.icon" class="material-symbols-outlined custom-icon">{{ getIconText(slotProps.node.icon) }}</span>
                  <span>{{ slotProps.node.label }}</span>
                </div>
            </template>
          </Tree>
        </div>
      </div>
      
    </div>

    <div id="table-area" class="mt-1">
      <Table :dataset="this.expression_merged"/>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3"

import html2canvas from "html2canvas"

import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import InputSwitch from 'primevue/inputswitch'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tree from 'primevue/tree'

import _ from 'underscore'

import Table from '@/components/svg/Table.vue'

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
    Tree,
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

      // Legend
      nodes: null,
      expandedKeys: {},

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
      showErrorBars: false,

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
    // svgElem.addEventListener('load', this.legend())

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
  computed: {
    getNodeColor() {
        return (node) => {
            return this.getHSLprefix(node);
        };
    }
  },
  methods: {
    toggle(menu, evt) {
      this.$refs[menu].toggle(evt);
    },
    getIconText(icon) {
        const iconMapping = {
            'material-icon-genetics': 'genetics',
            'material-icon-science': 'lab_profile',
            'material-icon-tissue': 'labs',
            'material-icon-male': 'male',
            'material-icon-female': 'female',
            'material-icon-group': ''
        };

        return iconMapping[icon] || ''; // Return an empty string if the icon isn't in the mapping
    },  
    async downloadChart(filetype) {
      console.log('downloadChart')
      const element = document.getElementById("plot-area-legend");
      html2canvas(element).then(canvas => {
        // Or convert the canvas to a PNG and download it
        const link = document.createElement("a");
        link.download = "expression_hist_plot.png";
        link.href = canvas.toDataURL();
        link.click();
    })},
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

        // console.log('this.gene_expression_data_tables')
        // console.log(this.gene_expression_data_tables)

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
          if (gender.length > 2) {
            console.error('WARNING: More than 2 gender in ', table)
          }
          e.gender = gender.join(',')

          const tissue = [...new Set(e.data.map(item => item.tissue))];
          if (tissue.length > 1) {
            // More than 1 tissue, shouldn't happen
            console.error('WARNING: More than 1 tissue in ', table)
          }
          e.tissue = tissue[0]
          
          this.expression_merged = this.expression_merged.concat(e.data)
        })

        // console.log('DEBUG this.expression_merged')
        // console.log(this.expression_merged)

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

        // const grouped_species = _.groupBy(this.expression_merged, e => `${e.species}`);

        const grouped_species_experiment = _.groupBy(this.expression_merged, e => `${e.species}_${e.experiment}`);

        const grouped_species_experiment_tissue = Object.keys(grouped_species_experiment).map((experiment) => {
          return [experiment, _.groupBy(grouped_species_experiment[experiment], e => `${e.tissue}`)];
        });

        const grouped_species_experiment_tissue_gene = grouped_species_experiment_tissue.map((experiment) => {
          return [experiment[0], Object.keys(experiment[1]).map((tissue) => {
            return [tissue, _.groupBy(experiment[1][tissue], e => `${e.gene_id}`)];
          })];
        });

        const grouped_species_experiment_tissue_gene_gender = grouped_species_experiment_tissue_gene.map((experiment) => {
          return [experiment[0], experiment[1].map((tissue) => {
            return [tissue[0], Object.keys(tissue[1]).map((gene) => {
              return [gene, _.groupBy(tissue[1][gene], e => `${e.gender}`)];
            })];
          })];
        });

        const grouped_species_experiment_tissue_gene_gender_groupname = grouped_species_experiment_tissue_gene_gender.map((experiment) => {
          // Experiment
          return [experiment[0].replaceAll(' ', '-'), experiment[1].map((tissue) => {
            // Tissue
            return [tissue[0].replaceAll(' ', '-'), tissue[1].map((gene) => {
              // Gene
              // console.log('Normalizing at Gene Level')
              // console.log(gene)
              // Find global max and min for the gene
              let tissueGeneMaxExpr = Number.MIN_SAFE_INTEGER;
              let tissueGeneMinExpr = Number.MAX_SAFE_INTEGER;
              Object.keys(gene[1]).forEach((gender) => {
                const grouping = _.groupBy(gene[1][gender], e => `${e.group_name}`);
                Object.values(grouping).forEach((group) => {
                  group.forEach((sample) => {
                    if (sample.gene_expression > tissueGeneMaxExpr) {
                      tissueGeneMaxExpr = sample.gene_expression;
                    }
                    if (sample.gene_expression < tissueGeneMinExpr) {
                      tissueGeneMinExpr = sample.gene_expression;
                    }
                  });
                });
              });
              
              return [gene[0].replaceAll(' ', '-'), Object.keys(gene[1]).map((gender) => {
                // Gender
                const grouping = _.groupBy(gene[1][gender], e => `${e.group_name}`)
                const keys = Object.keys(grouping).sort()
                keys.forEach((key,i) => {
                  // Condition level
                  // const key = keys[i]
                  const max = Math.max.apply(Math, grouping[key].map(
                    function(o) { return o.gene_expression; }))
                  const min = Math.min.apply(Math, grouping[key].map(
                    function(o) { return o.gene_expression; }))
                  // const mean = _.reduce(grouping[key], function(memo, v) { 
                  //   return memo + v.gene_expression; 
                  // }, 0) / grouping[key].length
                  grouping[key].forEach((sample) => {
                    sample.gene_expression_norm = (sample.gene_expression - tissueGeneMinExpr) / (tissueGeneMaxExpr - tissueGeneMinExpr)
                    sample.group_index = i
                    sample.min = min 
                    sample.max = max
                    sample.amplitude = max-min 
                    sample.mean = _.reduce(grouping[key], (memo, v) => memo + v.gene_expression, 0) / grouping[key].length;
                  })
                });
                return [gender, grouping];
              })];
            })];
          })];
        });

        this.expression_normalized = grouped_species_experiment_tissue_gene_gender_groupname
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized.map(e => e[1]))
        for (let i = 0; i < 2; i++) {
          this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => e[1]));
        }

        // Flatten the last layer (groupby object)
        this.expression_normalized_flattened = [].concat.apply([], this.expression_normalized_flattened.map(e => {
          return [].concat.apply([], Object.values(e[1]));
        }));

        const grouped_norm = _.groupBy(this.expression_merged, e => 
          `${e.species}_${e.experiment}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}_ZT${e.time_point}`)

        // Aggregating the normalized gene expressions
        console.log('Aggregating')
        this.expression_normalized_averaged = _.mapObject(grouped_norm, function(val, key) {
          let o = JSON.parse(JSON.stringify(val[0]));

          // Average the raw gene expressions
          o.gene_expression_avg = _.reduce(val, (memo, v) => memo + v.gene_expression, 0) / val.length;

          // Average the normalized gene expressions
          o.gene_expression_norm_avg = _.reduce(val, (memo, v) => memo + v.gene_expression_norm, 0) / val.length;
          o.gene_expression_norm = o.gene_expression_norm_avg;

          // Standard Deviation and Standard Error
          o.std_dev = Math.sqrt(_.reduce(val, (memo, v) => memo + Math.pow((v.gene_expression_norm - o.gene_expression_norm_avg), 2), 0) / val.length);
          o.std_err = o.std_dev / Math.sqrt(val.length);

          return o;
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
          e => `${e.species}_${e.experiment}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}`.replaceAll(' ', '-'))

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
        // this.legend()
      }
      
      const elapsed = Date.now() - start
      console.log('update_datasets time elapsed', elapsed)
    },
    initialize_bar_plot() {
      // set the dimensions and margins of the graph
      this.margin = {top: 5, right: 0, bottom: 5, left: 70}
      this.width = this.windowWidth * 0.7 - this.margin.left - this.margin.right,
      this.height = this.windowHeight * 0.7 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 0.95
      this.drawable_height_scale = 0.90

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
      // this.svg.append('g')
      //   .attr('id', 'legend')
      //   .attr('transform', `translate(0, ${this.legendY})`)

      this.color = d3.scaleSequential(d3.interpolateSinebow)

    },
    update_grouped_bar_plot() {
      console.log('===================')
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
        console.log('Time')
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

        console.log('data')
        console.log(data)
      }

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

      this.x.domain(groups)
        .padding([0.1])
      var x = this.x
      this.svg.selectAll(".myXaxis").transition()
        .duration(this.animationInterval)
        .call(this.xAxis)
        .end()
        .then(() => {
          if (this.grouped_by == 'Gene') {
            this.svg.selectAll(".myXaxis .tick text")  // select all the text elements of the x-axis
            .call(function(t) {  // t is the selection of all text elements
              t.each(function(d) {  // for each text element, d is the data bound to the text element
                // console.log('d')
                // console.log(d)
                var text = d3.select(this);  // select the current text element
                text.text('');  // clear the current text
                
                // var words = d.split("_");  // split the label into lines
                var lines = formatLabel(d)
                for (var i = 0; i < lines.length; i++) {
                  text.append("tspan")  // append a tspan for each line
                    .text(lines[i])
                    .attr("x", 0)
                    .attr("dy", i ? "1.2em" : 0);  // adjust vertical position of the second and subsequent lines
                }
              });
            });

            this.svg.selectAll(".myXaxis .tick line")
              .attr("stroke" , "none")


          }
        
        })


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
            const bargroup = enter.append('g')
              .attr("transform", d => `translate(${x(d[0])}, 0)`)
              .attr("class", "bar-group")
              .attr('id', d => `group_${d[0]}`)
            bargroup.selectAll(".subgroup-rect")
              .data(d => {
                // console.log('subgroup-rect data')
                // console.log(d)
                return d[1]
              })
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
      // this.legend()
      this.getTreeNodes(this.expression_normalized)
      console.log('===================')
    },
    getTreeNodes(data) {
      const transformLevel = (items, parentKey = '', parentOriginalLabel = '', level = 0) => {
          return items.flatMap((item, index) => {
              const key = `${parentKey}${index}`;
              let label, children;
              
              if (Array.isArray(item) && typeof item[0] === 'string') {
                  [label, children] = item;
              } else {
                  return []; // handle the data points under ALF and TRF, which we ignore for tree structure.
              }

              const nodeOriginalLabel = `${parentOriginalLabel ? parentOriginalLabel + '_' : ''}${label}`;
              const node = {
                  key: key,
                  visible: 1,
                  originalLabel: nodeOriginalLabel,
                  label: label.replaceAll('-', ' ').replaceAll('_', ' - '),
              };

              // Set icons based on levels or labels
              const icons = ['material-icon-science', 'material-icon-tissue', 'material-icon-genetics'];
              node.icon = icons[level] || (label === 'Male' ? 'material-icon-male' : (label === 'Female' ? 'material-icon-female' : undefined));

              // Set children for different levels
              if (level === 3) {
                  node.children = Object.keys(children).map((condition, cIndex) => ({
                      key: `${key}-${cIndex}`,
                      label: condition,
                      visible: 1,
                      originalLabel: nodeOriginalLabel + "_" + condition,
                  }));
              } else {
                  node.children = Array.isArray(children) ? transformLevel(children, `${key}-`, nodeOriginalLabel, level + 1) : undefined;
              }

              return node;
          });
      };

      this.nodes = transformLevel(data);
      this.expandTreeNodes();
      this.complete = true
    },
    expandTreeNodes() {
      for (let node of this.nodes) {
        this.expandNode(node);
      }
      this.expandedKeys = { ...this.expandedKeys };
    },
    expandNode(node) {
      if (node.children && node.children.length) {
          this.expandedKeys[node.key] = true;
          for (let child of node.children) {
              this.expandNode(child);
          }
      }
    },
    collapseTreeNodes() {
      this.expandedKeys = {};
    },
    nodeToggled(node) {
      console.log('nodeToggled')
      console.log(node)
    },
    toggleDatasetVisibility(node) {
      console.log('toggleDatasetVisibility')
      console.log(node)
      // Compute the prefix for the selected node
      const prefix = this.computePrefixForNode(node);
      console.log('prefix')
      console.log(prefix)
      const newOpacity = node.visible === 1 ? 0 : 1;
      console.log('newOpacity', newOpacity)
      node.visible = newOpacity;

      this.toggleVisibility(newOpacity, prefix)
      this.setNodeVisibilityRecursive(node, newOpacity);
    },
    setNodeVisibilityRecursive(node, newOpacity) {
      node.visible = newOpacity
      // Process child nodes if they exist
      if (node.children && node.children.length) {
        node.children.forEach(childNode => {
          // Compute prefix for child node
          this.setNodeVisibilityRecursive(childNode, newOpacity);
        });
      }
    },
    computePrefixForNode(node) {
      return node.originalLabel;
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
      if (name_split.length > 5) {
        // ['Mus musculus', 'TRF Experiment 2018', 'Adrenal gland', 'Clock', 'Male', 'ALF', 'ZT12']
        id = name_split.slice(0, 5).join('_')
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
    getHSLprefix(node) {
      console.log('getHSLprefix')
      console.log(node)
      let prefix = node.originalLabel
      let group_index = parseInt(node.key.split('-').slice(-1)[0], 10)
      console.log('group_index ' + group_index)
      const DEFAULT_COLOR = "#000000"; // default font color, set this to your preferred default
      const shade_factor = 3;
      // Split the prefix by underscores.
      const elements = prefix.split('_');
      const elementCount = elements.length;
      
      console.log(prefix)
      console.log(elementCount)

      // If fewer than 5 elements, return the default color.
      if (elementCount < 5) {
          return DEFAULT_COLOR;
      }

      let gender = false;

      // Based on the number of elements, determine the current level.
      if (elementCount === 5) { // Assume that at this level, we're dealing with gender.
          gender = true;
      } else if (elementCount === 6) { // Assume that at this level, we're dealing with condition.
          gender = false;
          prefix = elements.slice(0, 5).join('_')
          console.log('new prefix: ' + prefix)
      } else {
          console.error('Unexpected number of prefix elements. Defaulting gender to false.');
      }

      // Get color based on the prefix. Assuming that the cat_map uses the prefix for mapping.
      let hsl = d3.hsl(this.color(this.cat_map.get(prefix)));

      // If gender flag is false, shade the base color.
      if (!gender) {
          const factor = 1 + (((group_index === 0) - 0.5) / shade_factor);
          hsl.l *= factor;
      }
      console.log(hsl.toString())

      return hsl.toString();
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
        text += `\n Expr Avg: ${Math.round(d.gene_expression_avg*1000)/1000}`
      } else {
        text += `\n Sample: ${d.sample_name}`
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

  }
}

</script>


<style lang="scss" scoped>

#plot-options 
{
  :deep(.p-button) {
    font-size: 0.85rem !important;
    padding-left: 0.25rem !important;
    padding-right: 0.25rem !important;
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

#legend-area {
  :deep(.p-tree) {
    padding: 0.25rem !important; /* Removes padding */
    font-size: 0.75rem; /* Adjusts the font size */
    // border: 0 !important;

    .p-tree-wrapper {
      padding-bottom: 2px !important;
    }

    .p-treenode {
      padding: 0.0rem !important; /* Removes padding */
      font-size: 0.75rem; /* Adjusts the font size */
      // border: 0 !important;
    }

    .p-treenode-content {
      padding: 0 0 1px 0 !important; /* Removes padding */
      font-size: 0.75rem; /* Adjusts the font size */
      border: 0 !important;
      display:flex;
      align-items: center;
    }
    .p-tree-toggler {
      // font-size: 0.5em !important;
      width: 1rem !important;
      height: 1rem !important;
      margin-right: 0.25rem !important;
      .p-tree-toggler-icon {
        font-size: 0.5em !important;
        margin-right: 0.0rem !important;
        margin-left: 0.0rem !important;
      }
    }
    .p-treenode-icon {
      margin-right:0.0rem !important;
    }

    .custom-icon {
      font-size:0.75rem !important;
    }

    .icon-label {
      display:flex;
      align-items: center;
      gap: 0.25rem;
    }
  }

  .disabled-node {
    color: #888;     /* Gray out the text */
    opacity: 0.3;    /* Make it slightly transparent */
    // text-decoration: line-through; /* Add strike-through */
  }
}

</style>