<template>
  <div id="line" class="mx-auto">

    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>
    <div id="plot-container">
      <div id="plot-options" class="w-3/4 mx-auto mt-1 flex flex-row" v-show="this.complete">
        <div id="toggle_data_points" class="flex flex-col align-items-center mx-2">
          <div class="font-semibold pb-2">Data Points</div>
          <InputSwitch v-model="showReplicatePoints" @change="this.update_line_plot" />
        </div>
        <div id="toggle_error_bars" class="flex flex-col align-items-center mx-2">
          <div class="font-semibold pb-2">Error Bars</div>
          <InputSwitch v-model="showErrorBars" @change="this.update_line_plot" />
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
import InputSwitch from 'primevue/inputswitch'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tree from 'primevue/tree'

import _ from 'underscore';

import Table from '@/components/svg/Table.vue'

d3.selection.prototype.transition_attributes = function(
  attr_name, opacity, duration=animationInterval) {
  return this.transition()
      // .ease(Math.sqrt)
      // .duration(duration)
      .attr(attr_name, opacity)
}

export default {
  name: "LinePlot",
  components: {
    ProgressSpinner,
    InputSwitch,
    Menu,
    Button,
    ToggleButton,
    DataTable,
    Column,
    Table,
    Tree
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
      legend_group_data: [],

      // legend
      nodes: null,
      expandedKeys: {},

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
      showErrorBars: false,

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
    console.log('LinePlot mounted')
    const start = Date.now()

    this.initialize_line_plot()
    // console.log('Initialized line plot')

    if (this.datasets) {
      this.update_datasets()
    }
    // Wait for SVG to load before calling legend
    // Fixes bug where info icons don't yet have BBox dimensions to position after text
    const svgElem = document.getElementById('plot-svg')

    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    })
    
    const elapsed = Date.now() - start
    console.log('LinePlot mounted, time elapsed', elapsed)
  },
  beforeDestroy() { 
    window.removeEventListener('resize', this.onResize); 
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
            'material-icon-tissue': 'science',
            'material-icon-male': 'male',
            'material-icon-female': 'female',
            'material-icon-solid': 'maximize',
            'material-icon-dashed': 'minimize'
        };

        return iconMapping[icon] || ''; // Return an empty string if the icon isn't in the mapping
    },
    async downloadChart(filetype) {
      console.log('downloadChart')
      const element = document.getElementById("plot-area-legend");
      html2canvas(element).then(canvas => {
        // Or convert the canvas to a PNG and download it
        const link = document.createElement("a");
        link.download = "expression_line_plot.png";
        link.href = canvas.toDataURL();
        link.click();
      });
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

          e.experiment_species = e.experiment + ' ' + e.species

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
            // More than 1 gender may happen
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
                for(let i = 0; i < keys.length; i++) {
                  // Condition level
                  const key = keys[i]
                  const max = Math.max.apply(Math, grouping[key].map(
                    function(o) { return o.gene_expression; }))
                  const min = Math.min.apply(Math, grouping[key].map(
                    function(o) { return o.gene_expression; }))
                  const mean = _.reduce(grouping[key], function(memo, v) { 
                    return memo + v.gene_expression; 
                  }, 0) / grouping[key].length
                  grouping[key].forEach((sample) => {
                    sample.gene_expression_norm = (sample.gene_expression - tissueGeneMinExpr) / (tissueGeneMaxExpr - tissueGeneMinExpr)
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

        this.expression_normalized = grouped_species_experiment_tissue_gene_gender_groupname
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

        console.log('this.expression_normalized_averaged')
        console.log(this.expression_normalized_averaged)

        this.sumstat = d3
          .group(this.expression_normalized_averaged, 
          e => `${e.species}_${e.experiment}_${e.tissue}_${e.gene_id}_${e.gender}_${e.group_name}`.replaceAll(' ', '-'))

        console.log('this.sumstat')
        console.log(this.sumstat)
        this.sumstat_visibility = Object.fromEntries(
          new Map([...this.sumstat.keys()].map(e => [e, 1])))
        console.log('this.sumstat_visibility')
        console.log(this.sumstat_visibility)

        // species_experiment_year_tissue_gene_id_gender_group_name_ZT

        this.categories = [...new Set(
          [...this.sumstat.keys()] 
          .map(e => e.split('_').slice(0,-1).join('_'))
          )]

        console.log('this.categories')
        console.log(this.categories)
        this.cat_map = new Map(this.categories.map((d,i) => [
          d, i/this.categories.length
        ]))
        console.log('this.cat_map')
        console.log(this.cat_map)

        this.update_line_plot()
        // this.legend()
      }
      
      const elapsed = Date.now() - start
      console.log('update_datasets time elapsed', elapsed)
    },
    initialize_line_plot() {
      console.log('initialize_line_plot')
      // set the dimensions and margins of the graph
      this.margin = {top: 5, right: 0, bottom: 5, left: 70}

      this.width = this.windowWidth * 0.7 - this.margin.left - this.margin.right,
      this.height = this.windowHeight * 0.7 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 0.95
      this.drawable_height_scale = 0.90
      this.svg = d3.select("#plot-area")
          .append("svg")
            .attr("id", "plot-svg")
            // .attr("width", this.width + this.margin.left + this.margin.right)
            // .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("class", "mx-auto")
            .attr("viewBox", `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMid")
            .attr("style", "font-family:sans-serif")
          .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      // Initialize X axis
      this.x = d3.scaleLinear().range([0,this.width * this.drawable_width_scale])
      this.xAxis = d3.axisBottom().scale(this.x);
      this.svg.append("g")
          .attr("transform", `translate(0, ${this.height*this.drawable_height_scale})`)
          .attr("class","myXaxis")

      // X axis label
      this.svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", this.width * this.drawable_width_scale / 2)
        .attr("y", this.height*this.drawable_height_scale+40)
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
        .attr("x",-this.height*this.drawable_height_scale/2)
        .attr("transform", "rotate(-90)")
        .text("Gene Expression");

      // Lines grouping element
      this.svg.append("g")
        .attr("id", "lines")

      // avgPoints grouping element
      this.svg.append("g")
        .attr("id", "avgPoints")

      // errorBars grouping element
      this.svg.append("g")
        .attr("id", "errorBars")

      // replicatePoints grouping element
      this.svg.append("g")
        .attr("id", "replicatePoints")

      // Voronoi wrapper
      this.svg.append("g")
        .attr("id", "voronoiWrapper")
      
      this.legendX = this.width*this.drawable_width_scale + 5
      this.legendY = this.height*this.drawable_height_scale + 60
      this.legendY_spacing = 10
      // Legend 
      // this.svg.append('g')
      //   .attr('id', 'legend')
      //   .attr('transform', `translate(0, ${this.legendY})`)
      
      // Color 
      this.color = d3.scaleSequential(d3.interpolateSinebow)

    },
    change_color(d3color) {
      this.color = d3.scaleSequential(d3color)
      this.update_line_plot()
      // this.legend()
    },
    update_line_plot() {
      console.log('===================')
      console.log('update_line_plot')

      // Animation transition time in ms
      var animationInterval = this.animationInterval
      
      // Create the X axis
      this.x.domain([0, d3.max(this.expression_merged, (d) => d.time_point )])
      var x = this.x
      this.svg.selectAll(".myXaxis").transition()
        .duration(this.animationInterval)
        .call(this.xAxis)

      // Create the Y axis
      this.y.domain([0, 1])
      var y = this.y
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(this.animationInterval)
          .call(this.yAxis)

      // Logic for plotting lines
      this.svg.select("#lines")
          .selectAll(".line")
          .data(this.sumstat)
          .join(
            (enter) => {
              console.log('line enter')
              console.log(enter)
              enter.append('path')
                .attr('class', 'line')
                .attr('id', d => {
                  return `line_${d[0]}`})
                .attr("d", (d) => d3.line()
                  .curve(d3.curveMonotoneX)
                  .x((d) => x(d.time_point))
                  .y((d) => y(d.gene_expression_norm_avg))
                  (d[1]))
                .attr("fill", "none")
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", d => {
                  console.log('stroke-dasharray')
                  console.log('d')
                  console.log(d)
                  // const group = d[0].split('_').at(-1)
                  return d[1][0].group_index == 1 ? null : ('3,3');
                })
                // d[0] = Mus musculus_TRF Experiment_2018_Adrenal gland_Clock_Male_TRF_ZT22
                .attr("stroke", d => {
                  return this.getHSL(d[1][0])})
                .transition_attributes('stroke-opacity', d => 
                  this.sumstat_visibility[d[0]])
                
            },
            (update) => {
              update
                .attr('id', d => `line_${d[0]}`)
                .attr("d", d => d3.line()
                  .curve(d3.curveMonotoneX)
                  .x((d) => x(d.time_point))
                  .y((d) => y(d.gene_expression_norm))
                  (d[1]))
                .attr('stroke', d => {
                  return this.getHSL(d[1][0])
                })
                .attr("stroke-dasharray", d => {
                  console.log('stroke-dasharray')
                  console.log('d')
                  console.log(d)
                  // const group = d[0].split('_').at(-1)
                  return d[1][0].group_index == 1 ? null : ('3,3');
                })
                .transition_attributes('stroke-opacity', d => 
                  this.sumstat_visibility[d[0]])
            },
            (exit) => exit.transition_attributes('stroke-opacity', 0).remove()
          )

      // Tissue > Gene > Group 
      console.log('\n\nthis.avgPoints')
      console.log(this.avgPoints)

      // Draw dots on line with averaged data points
      // TRF points represented with a solid circle
      // ALF points represented with a hollow circle
      this.svg.select('#avgPoints')
        .selectAll(".dot")
        // Flattened array
        .data(this.avgPoints)
        .join(
          (enter) => {
            // console.log('dot enter')
            // console.log(enter)
            enter.append("circle")
              .attr('class', 'dot')
              .attr('id', d => `dot_${d.identifier}`)
              .attr('stroke', d => {
                return this.getHSL(d)})
              .attr("fill", d => {
                console.log('Solid or Hollow')
                console.log(d)
                return d.group_index ? this.getHSL(d) : d3.color('white');
              })
              .attr("cx", d => x(d.time_point))
              .attr("cy", d => y(d.gene_expression_norm_avg))
              .attr("r", 2)
              .transition_attributes('opacity', d => 
                this.sumstat_visibility[d.identifier] ? 1 : 0)
          },
          (update) => {
            // console.log('dot update')
            // console.log(update)
            update.attr('cx', d => x(d.time_point))
              .attr('cy', d => y(d.gene_expression_norm_avg))
              .attr('stroke', d => this.getHSL(d))
              .attr('fill', d => {
                return d.group_index ? this.getHSL(d) : d3.color('white');
              })
              .transition_attributes('opacity', d =>
                this.sumstat_visibility[d.identifier] ? 1 : 0)
              .attr('id', d => `dot_${d.identifier}`)
          },
          (exit) => exit.remove()
        )
      
      console.log('\n\nthis.errorBarsData')
      console.log(this.errorBarsData)
      // Draw error bars
      this.svg.select('#errorBars')
        .selectAll(".error")
        // Flattened array
        .data(this.errorBarsData)
        .join(
          (enter) => {
            // console.log('error enter')
            // console.log(enter)
            enter.append("path")
              .attr("class", "error")
              .attr('id', d => {
                // console.log('d')
                // console.log(d)
                return `error_${d.identifier}`})
              .attr('d', d => {
                // console.log('d')
                // console.log(d)
                let p = d3.path()
                // Vertical line
                p.moveTo(x(d.time_point), y(d.gene_expression_norm_avg - d.std_err))
                p.lineTo(x(d.time_point), y(d.gene_expression_norm_avg + d.std_err))
                // Bottom error bar
                p.moveTo(x(d.time_point-0.25), y(d.gene_expression_norm_avg - d.std_err))
                p.lineTo(x(d.time_point+0.25), y(d.gene_expression_norm_avg - d.std_err))
                // Top error bar
                p.moveTo(x(d.time_point-0.25), y(d.gene_expression_norm_avg + d.std_err))
                p.lineTo(x(d.time_point+0.25), y(d.gene_expression_norm_avg + d.std_err))
                return p.toString()
              })
              .attr('stroke', d => this.getHSL(d))
              .attr('stroke-width', 1.5)
              .transition_attributes('stroke-opacity', d => 
                (this.sumstat_visibility[d.identifier] && this.showErrorBars) ? 1 : 0)
          },
          (update) => {
            // console.log('error update')
            // console.log(update)
            update
              .attr('id', d => `error_${d.identifier}`)
              .attr('d', d => {
                let p = d3.path()
                // Vertical line
                p.moveTo(x(d.time_point), y(d.gene_expression_norm_avg - d.std_err))
                p.lineTo(x(d.time_point), y(d.gene_expression_norm_avg + d.std_err))
                // Bottom error bar
                p.moveTo(x(d.time_point-0.25), y(d.gene_expression_norm_avg - d.std_err))
                p.lineTo(x(d.time_point+0.25), y(d.gene_expression_norm_avg - d.std_err))
                // Top error bar
                p.moveTo(x(d.time_point-0.25), y(d.gene_expression_norm_avg + d.std_err))
                p.lineTo(x(d.time_point+0.25), y(d.gene_expression_norm_avg + d.std_err))
                return p.toString()
              })
              .attr('stroke', d => this.getHSL(d))
              .transition_attributes('stroke-opacity', d => 
                (this.sumstat_visibility[d.identifier] && this.showErrorBars) ? 1 : 0)
            
          },
          (exit) => exit.transition_attributes('stroke-opacity', 0).remove()
        )

      console.log('\n\nthis.replicatePoints')
      console.log(this.replicatePoints)
 
      // Draw dots for each replicate data point
      this.svg.select('#replicatePoints')
        .selectAll(".dot")
        // Flattened array
        .data(this.replicatePoints)
        .join(
          (enter) => {
            // console.log('dot enter')
            // console.log(enter)
            enter.append("circle")
              .attr('class', 'dot')
              .attr('id', d => {
                return `dot_${d.identifier}`})
              .attr('stroke', d => this.getHSL(d))
              .attr("fill", d => {
                return d.group_index ? this.getHSL(d) : d3.color('white');
              })
              .attr("cx", d => x(d.time_point))
              .attr("cy", d => y(d.gene_expression_norm))
              .attr("r", 2)
              .transition_attributes('opacity', d => 
                (this.sumstat_visibility[d.identifier] && this.showReplicatePoints) ? 1 : 0)
          },
          (update) => {
            // console.log('dot update')
            // console.log(update)
            update.attr('cx', d => x(d.time_point))
              .attr('cy', d => y(d.gene_expression_norm))
              .attr('stroke', d => this.getHSL(d))
              .attr("fill", d => {
                return d.group_index ? this.getHSL(d) : d3.color('white');
              })
              .transition_attributes('opacity', d => 
                (this.sumstat_visibility[d.identifier] && this.showReplicatePoints) ? 1 : 0)
              .attr('id', d => `dot_${d.identifier}`)
          },
          (exit) => exit.transition_attributes('fill-opacity', 0)
        )
      
      
      this.voronoi_grid()
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
    voronoi_grid() {
      // Initialize voronoi object, calculates cell polygons for visible cells
      this.replicatePoints.forEach(d => 
        d.visible = (this.sumstat_visibility[d.identifier] && this.showReplicatePoints) ? 1 : 0)
      this.avgPoints.forEach(d => 
        d.visible = (this.sumstat_visibility[d.identifier]) ? 1 : 0)
      const filtered_points = this.allPoints.filter(d => d.visible)
      this.voronoi = d3.Delaunay
        .from(filtered_points, d => this.x(d.time_point), d => this.y(d.gene_expression_norm))
        .voronoi([0, 0, this.width * this.drawable_width_scale, this.height * this.drawable_height_scale])
      
      // Add voronoi cells to SVG for tooltip popover
      this.svg.select('#voronoiWrapper')
        .selectAll("path")
        .data(filtered_points)
        .join(
          (enter) => {
            enter.append("path")
            .attr("fill", "none")
            // .attr('stroke', '#ff0')
            // .attr('stroke-opacity', 0.5)
            .style("pointer-events", "all")
            .attr("d", (d, i) => this.voronoi.renderCell(i))
            .on("mouseover", (d,i) => {
              if (d.y > 1) {
                // console.log(i)
                this.svg.append('g')
                  .attr('class', 'tooltip')
                  .attr("transform", `translate(${this.x(i.time_point)},${this.y(i.gene_expression_norm)})`)
                  .call(this.popover, this.popover_text(i), i.identifier)
              }
            })
            .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
          },
          (update) => {
            update.attr("d", (d, i) => this.voronoi.renderCell(i))
            .on("mouseover", (d,i) => {
              if (d.y > 1) {
                this.svg.append('g')
                  .attr('class', 'tooltip')
                  .attr("transform", `translate(${this.x(i.time_point)},${this.y(i.gene_expression_norm)})`)
                  .call(this.popover, this.popover_text(i), i.identifier)
              }
            })
          },
          (exit) => exit.remove()
        )

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
      const opacity = d3.select('#avgPoints').selectAll(`#dot_${key}`).attr('fill-opacity')
      if (opacity == 0) return g.style("display", "none");

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
          .attr("stroke", this.getHSL(key));

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
    toggleVisibility(newOpacity, id) {
      // console.log('toggleVisibility: ' + newOpacity)
      // console.log('id: ' + id)

      const lines = d3.selectAll(`[id^='line_${id}']`)
      lines.transition_attributes('stroke-opacity', newOpacity)
      const matching_keys = Object.keys(this.sumstat_visibility).filter(e => e.includes(id))
      matching_keys.forEach(e => this.sumstat_visibility[e] = newOpacity)
      // console.log(this.sumstat_visibility)

      const avgPoints = d3.select('#avgPoints').selectAll(`[id^='dot_${id}']`)
      avgPoints.transition_attributes('fill-opacity', newOpacity)
      // console.log(avgPoints)
      // console.log(newOpacity)
      
      avgPoints.transition_attributes('stroke-opacity', newOpacity)
      avgPoints._groups[0].forEach(e => e.__data__.visible = newOpacity)

      if (this.showReplicatePoints) {
        const replicatePoints = d3.select('#replicatePoints').selectAll(`[id^='dot_${id}']`)
        replicatePoints.transition_attributes('fill-opacity', newOpacity)
        replicatePoints.transition_attributes('stroke-opacity', newOpacity)
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