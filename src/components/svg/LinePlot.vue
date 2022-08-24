<template>
  <div class="mx-auto">
    <!--<div class="text-center mb-5">Line Plot component</div>-->

    <div id="spinner" class="mt-10 mx-auto" v-show="!this.complete" >
      <ProgressSpinner class="w-full mt-10" />
    </div>
    <div id="plot-options" class="w-3/4 mx-auto mt-3" v-show="this.complete">
      <div class="mx-auto flex flex-col align-items-center">
        <div class="font-semibold">Data Points</div>
        <InputSwitch v-model="showDataPoints" />

      </div>
      
    </div>
    <div id="plot-area" class="mt-10" v-show="this.complete">
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
//import {Delaunay} from "d3-delaunay";
import DataService from "@/services/DataService.js";

import ProgressSpinner from 'primevue/progressspinner';
import InputSwitch from 'primevue/inputswitch'
import _ from 'underscore';

// import eye from '@/assets/eye.svg'
// import eye

export default {
  name: "LinePlot",
  components: {
    ProgressSpinner,
    InputSwitch,
  },
  props: { 
    msg: String,
    genes: Array,
    datasets: Object,
  },
  data() {
    return {
      // dataset: [],
      genes_str_arr: null,
      gene_expression_datasets: [],
      expression_merged: [],
      expression_averaged: [],
      expression_normalized: [],
      expression_normalized_averaged: [],
      expression_normalized_flattened: [],

      sumstat: null,
      sumstat_dots: null,
      categories: null,
      // cat_map: null,

      margin: null,
      width: null,
      height: null,
      drawable_width_scale: null,
      drawable_height_scale: null,
      x: null,
      xAxis: null,
      y: null,
      yAxis: null,
      svg: null,
      complete: false,

      showDataPoints: false,
      showErrorBars: true,
    }
  },
  watch: {
    datasets() {
      console.log('%%%%%%%%%%%%%%%%')
      console.log('datasets updated')
      const start = Date.now()
      // console.log('this.genes', this.genes)
      // console.log(this.genes)
      // console.log('this.datasets')
      // console.log(this.datasets)
      this.genes_str_arr = this.genes.map((d) => d.name)
      // console.log('this.genes_str_arr')
      // console.log(this.genes_str_arr)
      if (this.datasets) {
        this.expression_merged = []
        this.gene_expression_datasets = this.datasets.gene_expression_data_tables
        // console.log('gene_expression_datasets')
        // console.log(this.gene_expression_datasets)
        this.gene_expression_datasets.forEach((e) => {
          // console.log('this.gene_expression_datasets.forEach')
          // console.log(e)
          let table = e.table_name
          // "TRF_2018_Mouse_Adrenal_gene_expression_data_UCb0eBc2ewPjv9ipwLaEUYSwdhh1"
          // console.log('table ', table)
          let sample_table = table.replace('gene_expression_data', 'sample_metadata')
          // console.log('sample_table', sample_table)
          let expression_data = e.data
          let sample_data = this.datasets.sample_metadata_tables.find(obj => {
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
          this.expression_merged = this.expression_merged.concat(merged_data)
        })

        this.expression_merged.forEach((e) => {
          e.time_point = parseInt(e.time_point.split('ZT')[1])
          e.replicate = e.sample_name.split('-').at(-1)
          e.identifier = `${e.tissue.replaceAll(' ', '-')}_${e.gene_id}_${e.group_name}`
        })

        const grouped = _.groupBy(this.expression_merged, function(e){
          return `${e.tissue.replaceAll(' ', '-')}_${e.gene_id}_${e.group_name}_ZT${e.time_point}`
        })
        // console.log('grouped')
        // console.log(grouped)
       
        this.expression_averaged = _.mapObject(grouped, function(val, key) {
          let o = JSON.parse(JSON.stringify(val[0]))
          o.gene_expression = _.reduce(val, function(memo, v) { 
            return memo + v.gene_expression; 
          }, 0) / val.length
          
          return o
        });

        // console.log('expression_averaged')
        // console.log(this.expression_averaged)
        // console.log(Object.entries(this.expression_averaged))
        this.expression_averaged = Object.entries(this.expression_averaged).map(e => e[1])
        // console.log(this.expression_averaged)

        // this.expression_normalized

        const grouped_tissue = _.groupBy(this.expression_merged, e => `${e.tissue.replaceAll(' ', '-')}`)
        // console.log('grouped_tissue')
        // console.log(grouped_tissue)

        const grouped_tissue_gene = Object.keys(grouped_tissue).map((key) => {
          // console.log(key)
          // console.log(grouped_tissue)
          // console.log(grouped_tissue[key])
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
            // console.log('gene', gene[0])
            // console.log(gene)
            // console.log(Object.entries(gene[1]))
            gene[1] = Object.entries(gene[1])
            gene[1].forEach((groupname) => {
              // console.log
              // console.log('groupname', groupname)
              const max = Math.max.apply(Math, groupname[1].map(function(o) { return o.gene_expression; }))
              // console.log('max', max)
              const min = Math.min.apply(Math, groupname[1].map(function(o) { return o.gene_expression; }))
              // console.log('min', min)
              groupname[1].forEach((sample) => {
                sample.gene_expression_norm = (sample.gene_expression - min) / (max - min)
              })
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
          o.gene_expression_norm = _.reduce(val, function(memo, v) { 
            return memo + v.gene_expression_norm; 
          }, 0) / val.length
          o.avg = o.gene_expression_norm

          // console.log('o.avg', o.avg)
          
          // o.std_dev = _.reduce(val, function(memo, v) {
          //   return memo + Math.pow((v.gene_expression_norm - o.gene_expression_norm_avg),2)
          // }, 0) / val.length

          o.std_dev = Math.sqrt(_.reduce(val, function(memo, v) { 
            return memo + Math.pow((v.gene_expression_norm - o.avg), 2); 
          }, 0) / val.length)

          // console.log('o.std_dev', o.std_dev)

          o.std_err = o.std_dev / Math.sqrt(val.length)

          // console.log('o.std_err', o.std_err)

          return o
        });

        console.log('this.expression_normalized_averaged')
        console.log(this.expression_normalized_averaged)

        // console.log('average_expressions')
        // console.log(average_expressions)

        // console.log('this.expression_normalized_averaged')
        // console.log(this.expression_averaged)
        // console.log(Object.entries(this.expression_averaged))
        this.expression_normalized_averaged = Object.entries(this.expression_normalized_averaged).map(e => e[1])
        // console.log(this.expression_normalized_averaged)

        // console.log('After mutation')
        // console.log(this.gene_expression_datasets)

        this.sumstat = d3
          .group(this.expression_normalized_averaged, 
          d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);

        this.sumstat_dots = d3
          .group(this.expression_normalized_flattened, 
          d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);

        this.categories = [...new Set(
          [...this.sumstat.keys()] 
          .map(e => e.split('_').slice(0,-1).join('_'))
          )]

        // cat_map = new Map(this.categories.map((d,i) => [
        //   d, i/this.categories.length
        // ]))
      }
      this.update_line_plot()

      const elapsed = Date.now() - start
      console.log('datasets updated time elapsed', elapsed)
      console.log('%%%%%%%%%%%%%%%%')
    }

  },
  created() {
  },
  async mounted() {
    // console.log('LinePlot height')
    // console.log(this.$refs.refName.clientHeight)
    // console.log('=================')
    // console.log('LinePlot mounting')
    // console.log(this.complete)
    // console.log(this.genes)
    // this.genes_str_arr = this.genes.map((d) => d.name)
    // console.log('datasets')
    // console.log(this.datasets)
    this.initialize_line_plot()
    // await this.update_line_plot()
    // console.log('finished update_line_plot')
    this.complete = true
    // console.log(this.complete)
    // console.log('=================')
  },
  async updated () {
    console.log('-----------------')
    console.log('LinePlot updated')
    const start = Date.now()
    if (this.datasets) {
      console.log('this.datasets exists')
      console.log('showDataPoints:', this.showDataPoints)
      this.update_line_plot()

    }
      
    const elapsed = Date.now() - start
    console.log('LinePlot updated ', elapsed)
    console.log('-----------------')
  },
  methods: {
    initialize_line_plot() {
      // set the dimensions and margins of the graph
      this.margin = {top: 30, right: 30, bottom: 120, left: 80}
      this.width = 700 - this.margin.left - this.margin.right,
      this.height = 500 - this.margin.top - this.margin.bottom;
      this.drawable_width_scale = 4/5
      this.drawable_height_scale = 1
      this.svg = d3.select("#plot-area")
          .append("svg")
            .attr("id", "plot-svg")
            // .attr("width", this.width + this.margin.left + this.margin.right)
            // .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("class", "mx-auto")
            .attr("viewBox", `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMid")
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
        .attr("x",-this.height/2)
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

      // dataPoints grouping element
      this.svg.append("g")
        .attr("id", "dataPoints")

      // Voronoi wrapper
      this.svg.append("g")
        .attr("id", "voronoiWrapper")

      // Visibility icons
      this.showIcon = d3.create('svg')
        .attr('xlmns', 'http://www.w3.org/2000/svg')
        .attr('viewBox', '0 0 24 24')
        .append('path')
          .attr('d', 'M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z')

      // this.hideIcon

    },
    async update_line_plot() {
      console.log('update_line_plot')

      // const sumstat = d3
      //   .group(this.expression_normalized_averaged, 
      //   d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);
      
      // console.log('sumstat')
      // console.log(sumstat)

      // const sumstat_dots = d3
      //   .group(this.expression_normalized_flattened, 
      //   d => `${d.tissue.replaceAll(' ', '-')}_${d.gene_id}_${d.group_name}`);

      console.log('sumstat_dots')
      console.log(this.sumstat_dots)
      // // Unique categories of genes and tissues
      // const categories = [...new Set(
      //     [...sumstat.keys()] 
      //     .map(e => e.split('_').slice(0,-1).join('_'))
      //     )]

      // console.log('categories')
      // console.log(categories)

      const cat_map = new Map(this.categories.map((d,i) => [
        d, i/this.categories.length
      ]))
      console.log('cat_map')
      console.log(cat_map)
      console.log('Number of categories: ', this.categories.length)

      // console.log('this.expression_merged')
      // console.log(this.expression_merged)

      // console.log('this.expression_normalized')
      // console.log(this.expression_normalized)

      // console.log('this.expression_normalized_flattened')
      // console.log(this.expression_normalized_flattened)

      // var color = d3.scaleOrdinal(d3.schemeCategory10);
      // var color = d3.scaleSequential().domain([1,categories]).interpolator(d3.interpolateSinebow)
      
      // TODO: More color schemes, color blind, etc.
      var color2 = d3.scaleSequential(d3.interpolateWarm)


      // Create the X axis
      var x = this.x
      x.domain([0, d3.max(this.expression_merged, (d) => d.time_point )])
      this.svg.selectAll(".myXaxis").transition()
        .duration(1000)
        .call(this.xAxis);

      // Create the Y axis
      var y = this.y
      y.domain([0, 1])
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(1000)
          .call(this.yAxis)

      // Animation transition time in ms
      var animationInterval = 500

      // Logic for plotting lines
      this.svg.select("#lines")
          .selectAll(".line")
          .data(this.sumstat)
          .join(
            (enter) => {
              // console.log('line enter')
              // console.log(enter)
              enter.append('path')
                .attr('class', 'line')
                .attr('id', d => `line_${d[0]}`)
                .attr("d", (d) => {
                  // console.log('line')
                  // console.log(d)
                    return d3.line()
                    .curve(d3.curveBasis)
                    .x((d) => x(d.time_point))
                    .y((d) => y(d.gene_expression_norm))
                    (d[1])
                  }
                )
                .attr("fill", "none")
                .attr("stroke-width", 1.5)
                .attr("stroke", d => getHSL(d[0], cat_map, color2))
                .attr('stroke-opacity', 1)
                
            },
            (update) => {
              // console.log('line update')
              // console.log(update)
              update
                .transition()
                .ease(Math.sqrt)
                .duration(animationInterval)
                .attr("d", d => d3.line()
                    .curve(d3.curveMonotoneX)
                    .x((d) => x(d.time_point))
                    .y((d) => y(d.gene_expression_norm))
                    (d[1]))
                .attr('stroke', d => getHSL(d[0], cat_map, color2))
                .attr('id', d => `line_${d[0]}`)
            },
            (exit) => {
              // console.log('line exit')
              // console.log(exit)
              exit  
                .style('stroke-opacity', 0)
                .transition()
                .ease(Math.sqrt)
                .duration(animationInterval)
                .remove()
            }
          )
      // Tissue > Gene > Group 
      const num_tissues = this.expression_normalized.length
      const num_genes = this.genes.length
      const num_groups = this.expression_normalized[0][1][0][1].length

      // console.log('num_genes', num_genes)
      // console.log('num_groups', num_groups)

      const legendY_spacing = 15

      // Legend nested text
      var legendX = this.width*this.drawable_width_scale + 5
      this.svg.selectAll(".legend_tissue")
          .data(this.expression_normalized)
          .join(
            (enter) => {
              // Create root g element to position child text elements
              // console.log('tissue enter')
              // console.log(enter)
              const tissue_root = enter.append('g')
              tissue_root.attr('class', 'legend_tissue')
                .style('fill', d3.rgb("#222"))
                .attr('transform', (d,i) => `translate(${legendX}, ${
                  legendY_spacing*(i*(1+(num_genes*(num_groups + 1))))
                  })`)
                .append('text')
                  .attr('class', 'legend_tissue_text')
                  .text(d => d[0].replaceAll('-', ' '))
                  .attr('text-anchor', 'left')
                  .attr('font-size', '0.7em')
                  .attr('fill-opacity', 1)
              tissue_root.selectAll('.legend_gene')
                .data(d => d[1])
                .join(
                  (enter) => {
                    // console.log('gene enter')
                    // console.log(enter)
                    const gene_root = enter.append('g')
                    gene_root.attr('class', 'legend_gene')
                    .style('fill', d => getHSL(d[1][0][1][0].identifier, cat_map, color2, true))
                    .attr('transform', (d,i) => `translate(${5}, ${
                      legendY_spacing *(1 + i * (1 + num_groups))
                      })`)
                    .append('text')
                      .attr('class', 'legend_gene_text')
                      .text(d => d[0])
                      .attr('text-anchor', 'left')
                      .attr('font-size', '0.7em')
                      .attr('fill-opacity', 1)
                      .style('margin-bottom', 5)
                    gene_root.selectAll('.legend_groupname')
                      .data(d => d[1])
                      .join(
                        (enter) => {
                          // console.log('groupname enter')
                          // console.log(enter)
                          const groupname_root = enter.append('g')
                          groupname_root
                            .attr('class', 'legend_groupname')
                            .style('display', 'inline')
                            .style('white-space', 'no-wrap')
                            .style('fill', d => getHSL(d[1][0].identifier, cat_map, color2))
                            .attr('transform', (d,i) => `translate(${5}, ${
                              legendY_spacing * (i+1)
                              })`)
                            .on('click', groupnameClick)
                          groupname_root.append('svg:image')
                            .attr('class', 'eye')
                            .attr("xlink:href", "/assets/eye.svg")
                            .attr('type', "image/svg+xml")
                            .attr('x', -13)
                            .attr('y', -9)
                            .attr('width', 10)
                            .attr('height', 10)
                            .attr('opacity', 1)
                          groupname_root.append('svg:image')
                            .attr('class', 'eye-off')
                            .attr("xlink:href", "/assets/eye-off.svg")
                            .attr('type', "image/svg+xml")
                            .attr('x', -13)
                            .attr('y', -9)
                            .attr('width', 10)
                            .attr('height', 10)
                            .attr('opacity', 0)
                          groupname_root.append('text')
                              .attr('class', 'legend_groupname_text')
                              .text(d => d[0])
                              .attr('text-anchor', 'left')
                              .attr('font-size', '0.7em')
                              .attr('fill-opacity', 1)
                              // .style('margin-bottom', 5)
                              .style('display', 'inline-block')
                          

                            // .style('fill', d => d3.color('red'))
                          // groupname_root.append('circle')
                          //   .style("fill", d => getHSL(d[1][0].identifier, cat_map, color2))
                          //   .attr("cx", 0)
                          //   .attr("cy", -4)
                          //   .attr("r", 6)
                          //   .attr('fill-opacity', 1)

                          // groupname_root.append('g')
                          //   .attr('class', 'showIcon')
                          //   .attr('width', 10)
                          //   .attr('height', 10)
                          //   .attr('x', 0)
                          //   .attr('y', 0)
                          //   .style('fill', d3.color('steelblue'))
                          //   .append('path')
                          //     .attr('d', 'M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z')
        
            
                          return groupname_root
                        },
                        (update) => {
                          console.log('tissue enter > gene enter > groupname update')
                          console.log(update)
                        }
                      )
                    return gene_root
                  }
                )
              return tissue_root
            },
            (update) => {
              // console.log('tissue update')
              // console.log(update)
              update.attr('transform', (d,i) => `translate(${legendX}, ${
                  legendY_spacing*(i*(1+(num_genes*(num_groups + 1))))
                  })`)
                .select('.legend_tissue_text')
                  .text(d => d[0])
              update.selectAll('.legend_gene')
                .data(d => d[1])
                .join(
                  (enter) => {
                    // console.log('tissue update > gene enter')
                    // console.log(enter)
                    const gene_root = enter.append('g')
                    gene_root.attr('class', 'legend_gene')
                    .style('fill', d => getHSL(d[1][0][1][0].identifier, cat_map, color2, true))
                    .attr('transform', (d,i) => `translate(${5}, ${
                      legendY_spacing *(1 + i * (1 + num_groups))
                      })`)
                    .append('text')
                      .attr('class', 'legend_gene_text')
                      .text(d => d[0])
                      .attr('text-anchor', 'left')
                      .attr('font-size', '0.7em')
                      .attr('fill-opacity', 1)
                      .style('margin-bottom', 5)
                    gene_root.selectAll('.legend_groupname')
                      .data(d => d[1])
                      .join(
                        (enter) => {
                          // console.log('groupname enter')
                          // console.log(enter)
                          const groupname_root = enter.append('g')
                          groupname_root.attr('class', 'legend_groupname')
                          .style('fill', d => getHSL(d[1][0].identifier, cat_map, color2))
                          .attr('transform', (d,i) => `translate(${5}, ${
                            legendY_spacing * (i+1)
                            })`)
                          .on('click', groupnameClick)

                          groupname_root.append('text')
                            .attr('class', 'legend_groupname_text')
                            .text(d => d[0])
                            .attr('text-anchor', 'left')
                            .attr('font-size', '0.7em')
                            .attr('fill-opacity', 1)
                            .style('margin-bottom', 5)
                          groupname_root.append('svg:image')
                            .attr('class', 'eye')
                            .attr("xlink:href", "/assets/eye.svg")
                            .attr('type', "image/svg+xml")
                            .attr('x', -13)
                            .attr('y', -9)
                            .attr('width', 10)
                            .attr('height', 10)
                            .attr('opacity', 1)
                          groupname_root.append('svg:image')
                            .attr('class', 'eye-off')
                            .attr("xlink:href", "/assets/eye-off.svg")
                            .attr('type', "image/svg+xml")
                            .attr('x', -13)
                            .attr('y', -9)
                            .attr('width', 10)
                            .attr('height', 10)
                            .attr('opacity', 0)
                            

                          return groupname_root
                        },
                        (update) => {
                          // console.log('groupname update')
                          // console.log(update)
                          update.attr('transform', (d,i) => `translate(${5}, ${
                            legendY_spacing * (i+1)
                            })`)
                            .on('click', groupnameClick)
                            .style('fill', d => getHSL(d[1][0].identifier, cat_map, color2))
                            .transition()
                            .ease(Math.sqrt)
                            .duration(animationInterval)
                          
                        },
                        (exit) => {
                          // console.log('groupname exit')
                          // console.log(exit)
                          exit.transition()
                          .ease(Math.sqrt)
                          .duration(animationInterval)
                          .attr('fill-opacity', 0)
                          .remove()
                        }
                      )

                    return gene_root
                  },
                  (update) => {
                    // console.log('tissue update > gene update')
                    // console.log(update)
                    update.attr('transform', (d,i) => `translate(${5}, ${
                      legendY_spacing *(1 + i * (1 + num_groups))
                      })`)
                      .style('fill', d => getHSL(d[1][0][1][0].identifier, cat_map, color2, true))
                      .transition()
                      .ease(Math.sqrt)
                      .duration(animationInterval)
                      .select('.legend_gene_text')
                        .text(d => d[0])
                    update.selectAll('.legend_groupname')
                      .data(d => d[1])
                      .join(
                        (enter) => {
                          // console.log('tissue update > gene update > groupname enter')
                          // console.log(enter)
                          const groupname_root = enter.append('g')
                          groupname_root.attr('class', 'legend_groupname')
                          .style('fill', d => getHSL(d[1][0].identifier, cat_map, color2))
                          .attr('transform', (d,i) => `translate(${5}, ${
                            legendY_spacing * (i+1)
                            })`)
                          .on('click', groupnameClick)
                          .append('text')
                            .attr('class', 'legend_groupname_text')
                            .text(d => d[0])
                            .attr('text-anchor', 'left')
                            .attr('font-size', '0.7em')
                            .attr('fill-opacity', 1)
                            .style('margin-bottom', 5)
                          groupname_root.append('svg:image')
                            .attr('class', 'eye')
                            .attr("xlink:href", "/assets/eye.svg")
                            .attr('type', "image/svg+xml")
                            .attr('x', -13)
                            .attr('y', -9)
                            .attr('width', 10)
                            .attr('height', 10)
                            .attr('opacity', 1)
                          groupname_root.append('svg:image')
                            .attr('class', 'eye-off')
                            .attr("xlink:href", "/assets/eye-off.svg")
                            .attr('type', "image/svg+xml")
                            .attr('x', -13)
                            .attr('y', -9)
                            .attr('width', 10)
                            .attr('height', 10)
                            .attr('opacity', 0)

                          return groupname_root
                        },
                        (update) => {
                          // console.log('tissue update > gene update > groupname update')
                          // console.log(update)
                          update.attr('transform', (d,i) => `translate(${5}, ${
                            legendY_spacing * (i+1)
                            })`)
                            .style('fill', d => getHSL(d[1][0].identifier, cat_map, color2))
                            .on('click', groupnameClick)
                            .transition()
                            .ease(Math.sqrt)
                            .duration(animationInterval)
                            .select('.legend_groupname_text')
                              .text(d => d[0])
                        
                        },
                        (exit) => {
                          // console.log('groupname exit')
                          // console.log(exit)
                          exit.select('.legend_groupname_text')
                            .transition()
                            .ease(Math.sqrt)
                            .duration(animationInterval)
                            .attr('fill-opacity', 0)
                          exit.transition()
                            .ease(Math.sqrt)
                            .duration(animationInterval)
                            .attr('fill-opacity', 0)
                            .remove()
                        }
                      )
                  },
                  (exit) => {
                    // console.log('tissue update > gene exit')
                    // console.log(exit)
                    exit.select('.legend_gene_text')
                      .transition()
                      .ease(Math.sqrt)
                      .duration(animationInterval)
                      .attr('fill-opacity', 0)
                      .remove()
                    exit.transition()
                    .ease(Math.sqrt)
                    .duration(animationInterval)
                    .attr('fill-opacity', 0)
                    .remove()

                  }
                )
            
            },
            (exit) => {
              // console.log('tissue exit')
              // console.log(exit)
              exit.select('.legend_tissue_text')
                .transition()
                .ease(Math.sqrt)
                .duration(animationInterval)
                .attr('fill-opacity', 0)
                .remove()
              exit.transition()
                .ease(Math.sqrt)
                .duration(animationInterval)
                .attr('fill-opacity', 0)
                .remove()
            }
          )

      console.log('this.expression_normalized_averaged')
      console.log(this.expression_normalized_averaged)

      // Draw dots on line with averaged data points
      this.svg.select('#avgPoints')
        .selectAll(".dot")
        // Flattened array
        .data(this.expression_normalized_averaged)
        .join(
          (enter) => {
            // console.log('dot enter')
            // console.log(enter)
            enter.append("circle")
              // .attr("class", "dot")
              .attr('class', 'dot')
              .attr('id', d => `dot_${d.identifier}`)
              .style("fill", d => getHSL(d.identifier, cat_map, color2))
              .attr("cx", d => x(d.time_point))
              .attr("cy", d => {
                // console.log(d)
                return y(d.gene_expression_norm)
              })
              .attr("r", 2)
              .transition()
              .ease(Math.sqrt)
              .duration(animationInterval)
              .attr('fill-opacity', 1)
          },
          (update) => {
            // console.log('dot update')
            // console.log(update)
            update.attr('cx', d => x(d.time_point))
              .attr('cy', d => {
                // console.log(d)
                return y(d.gene_expression_norm)})
              .style('fill', d => getHSL(d.identifier, cat_map, color2))
              .transition()
              .ease(Math.sqrt)
              .duration(animationInterval)
              .attr('fill-opacity', 1)
              .attr('id', d => `dot_${d.identifier}`)
          },
          (exit) => {
            // console.log('dot exit')
            // console.log(exit)
            exit.transition()
              .ease(Math.sqrt)
              .duration(animationInterval)
              .attr('fill-opacity', 0)
              .remove()
          }
        )


      // Draw error bars
      this.svg.select('#errorBars')
        .selectAll(".error")
        // Flattened array
        .data(this.expression_normalized_averaged)
        .join(
          (enter) => {
            console.log('error enter')
            console.log(enter)
            enter.append("path")
              .attr("class", "error")
              .attr('id', d => `error_${d.identifier}`)
              .attr('d', d => {
                let p = d3.path()
                // Vertical line
                p.moveTo(x(d.time_point), y(d.avg - d.std_err))
                p.lineTo(x(d.time_point), y(d.avg + d.std_err))
                // Bottom error bar
                p.moveTo(x(d.time_point) - 0.5, y(d.avg - d.std_err))
                p.lineTo(x(d.time_point) + 0.5, y(d.avg - d.std_err))
                // Top error bar
                p.moveTo(x(d.time_point) - 0.5, y(d.avg + d.std_err))
                p.lineTo(x(d.time_point) + 0.5, y(d.avg + d.std_err))
                return p.toString()
              })
              .attr('stroke', d => getHSL(d.identifier, cat_map, color2))
              .attr('stroke-width', 1)

              // .style("fill", d => getHSL(d.identifier, cat_map, color2))
            //   .attr("cx", d => x(d.time_point))
            //   .attr("cy", d => {
            //     // console.log(d)
            //     return y(d.gene_expression_norm)
            //   })
            //   .attr("r", 2)
            //   .transition()
            //   .ease(Math.sqrt)
            //   .duration(animationInterval)
            //   .attr('fill-opacity', 1)
          },
          (update) => {
            console.log('error update')
            console.log(update)
            // update.attr('cx', d => x(d.time_point))
            //   .attr('cy', d => {
            //     // console.log(d)
            //     return y(d.gene_expression_norm)})
            //   .style('fill', d => getHSL(d.identifier, cat_map, color2))
            //   .transition()
            //   .ease(Math.sqrt)
            //   .duration(animationInterval)
            //   .attr('fill-opacity', 1)
            //   .attr('id', d => `dot_${d.identifier}`)
          },
          (exit) => {
            console.log('error exit')
            console.log(exit)
            exit.transition()
              .ease(Math.sqrt)
              .duration(animationInterval)
              .attr('fill-opacity', 0)
              .remove()
          }
        )

      console.log('this.expression_normalized_flattened')
      console.log(this.expression_normalized_flattened)

      let dataPoints = []
      let allPoints = this.expression_normalized_averaged
      if (this.showDataPoints) {
        dataPoints = this.expression_normalized_flattened
        allPoints = [...allPoints, ...this.expression_normalized_flattened]
      } 
      console.log('dataPoints')
      console.log(dataPoints)
        
      // Draw dots for each replicate data point
      this.svg.select('#dataPoints')
        .selectAll(".dot")
        // Flattened array
        .data(dataPoints)
        .join(
          (enter) => {
            console.log('dot enter')
            console.log(enter)
            enter.append("circle")
              // .attr("class", "dot")
              .attr('class', 'dot')
              .attr('id', d => `dot_${d.identifier}`)
              .style("fill", d => getHSL(d.identifier, cat_map, color2))
              .attr("cx", d => x(d.time_point))
              .attr("cy", d => {
                // console.log(d)
                return y(d.gene_expression_norm)
              })
              .attr("r", 2)
              .transition()
              .ease(Math.sqrt)
              .duration(animationInterval)
              .attr('fill-opacity', 1)
          },
          (update) => {
            console.log('dot update')
            console.log(update)
            update.attr('cx', d => x(d.time_point))
              .attr('cy', d => {
                // console.log(d)
                return y(d.gene_expression_norm)})
              .style('fill', d => getHSL(d.identifier, cat_map, color2))
              .transition()
              .ease(Math.sqrt)
              .duration(animationInterval)
              .attr('fill-opacity', 1)
              .attr('id', d => `dot_${d.identifier}`)
          },
          (exit) => {
            console.log('dot exit')
            console.log(exit)
            exit.transition()
              .ease(Math.sqrt)
              .duration(animationInterval)
              .attr('fill-opacity', 0)
              .remove()
          }
        )
      
      // // Only show tooltips for the averaged data points
      // dataPoints = this.expression_normalized_averaged
      
      // Select all lines and dots and set to visible, prevents bug on update where if
      // some lines are hidden then the associated dots will be out of sync
      this.svg.select('#lines').selectAll('.line').attr('stroke-opacity', 1)
      this.svg.select('#avgPoints').selectAll('.dot').attr('fill-opacity', 1)
      // Reset opacity if show data points are toggled on
      this.svg.select('#dataPoints').selectAll('.dot').attr('fill-opacity', 1)

      this.svg.selectAll('.eye').attr('opacity', 1)
      this.svg.selectAll('.eye-off').attr('opacity', 0)


      console.log('allPoints')
      console.log(allPoints)

      // Voronoi cells to select nearest point
      var voronoi = d3.Delaunay
        .from(allPoints, d => x(d.time_point), d => y(d.gene_expression_norm))
        .voronoi([0, 0, this.width * this.drawable_width_scale, this.height])

      //Create the voronoi grid
      this.svg.select('#voronoiWrapper')
        .selectAll("path")
        .data(allPoints)
        .join(
          (enter) => {
            enter.append("path")
            // .attr("opacity", 0.5)
            //.attr("stroke", "#ff1493") // Hide overlay
            .attr("fill", "none")
            .style("pointer-events", "all")
            .attr("d", (d, i) => voronoi.renderCell(i))
            .on("mouseover", (d,i) => {
              if (d.y > 1) {
                console.log(i)
                this.svg.append('g')
                  .attr('class', 'tooltip')
                  .attr("transform", `translate(${x(i.time_point)},${y(i.gene_expression_norm)})`)
                  .call(popover, `Data Point Details
                  Gene: ${i.gene_id}
                  Group: ${i.group_name}
                  Tissue: ${i.tissue}
                  Age: ${i.age_months} months
                  Species: ${i.species}
                  Time: ZT${i.time_point}
                  Expr: ${Math.round(i.gene_expression)}`, i.identifier)
              }
            })
            .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
          },
          (update) => {
            update.attr("d", (d, i) => voronoi.renderCell(i))
            .on("mouseover", (d,i) => {
              if (d.y > 1) {
                this.svg.append('g')
                  .attr('class', 'tooltip')
                  .attr("transform", `translate(${x(i.time_point)},${y(i.gene_expression_norm)})`)
                  .call(popover, `Data Point Details
                  Gene: ${i.gene_id}
                  Group: ${i.group_name}
                  Tissue: ${i.tissue}
                  Age: ${i.age_months} months
                  Species: ${i.species}
                  Time: ZT${i.time_point}
                  Expr: ${Math.round(i.gene_expression)}`, i.identifier)
              }
            })
          },
          (exit) => {
            exit.remove()

          }
        )
      
      function getHSL(name, cat_map, color_func, gene=false) {
        // console.log('getHSL')
        // Differentiate groups by making one darker and one lighter
        const shade_factor = 3
        // If gene flag is true, use unshaded base color 
        const cat = name.split('_').slice(0,-1).join('_')
        const group = name.split('_').at(-1)
        let hsl = d3.hsl(color_func(cat_map.get(cat)))
        if (!gene) {
          const factor = 1 + (((group === 'ALF') - 0.5) / shade_factor)
          hsl.l *= factor
        }

        // console.log(hsl)
        return hsl
      }
           
      function popover(g, value, key) {
        console.log('popover', key)
        // console.log(value)
        // console.log(g)

        if (!value) return g.style("display", "none");
        const opacity = d3.select('#avgPoints').selectAll(`#dot_${key}`).attr('fill-opacity')
        if (opacity == 0) return g.style("display", "none");

        // tooltip group
        g
          .style("display", "flex")
          // .style("")
          .style("pointer-events", "none")
          .style("font", "10px sans-serif");

        // tooltip container stroke
        const path = g.selectAll("path")
          .data([null])
          .join("path")
            .attr("fill", "white")
            .attr("fill-opacity", 1)
            .attr("stroke", getHSL(key, cat_map, color2));

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
      
      function groupnameClick(d, i) {
        // console.log('groupnameClick')
        // console.log(d)
        // console.log(i)
        const id = i[1][0].identifier
        // console.log('id', id)
        // console.log(this)
        
        const line = d3.selectAll(`#line_${id}`)
        // console.log(line)
        const opacity = line.attr('stroke-opacity')
        // console.log('opacity', opacity)
        const newOpacity = (opacity == 1) ? 0 : 1
        const eye = this.getElementsByClassName('eye')[0]
        const eyeOff = this.getElementsByClassName('eye-off')[0]

        // console.log(eye)

        eye.setAttribute('opacity', newOpacity)
        // console.log(eye)
        eyeOff.setAttribute('opacity', opacity)

        // console.log(newOpacity)
        line.attr('stroke-opacity', newOpacity)
        const dots = d3.selectAll(`#dot_${id}`)
        // console.log(dots)
        // const dot_opacity = dots.attr('fill-opacity')
        // const new_dot_opacity = (dot_opacity == 1) ? 0 : 1
        dots.attr('fill-opacity', newOpacity)


      }
    },
  }
}
</script>

<style>

</style>