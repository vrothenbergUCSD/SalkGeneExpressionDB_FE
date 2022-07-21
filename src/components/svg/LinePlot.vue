<template>
  <div class="mx-auto">
    <div class="text-center mb-5">Line Plot component</div>
    <div id="plot-area" class="mt-10">
    </div>
    <div id="table-area" class=""></div>

  </div>
</template>


<script>
import * as d3 from "d3";
//import {Delaunay} from "d3-delaunay";
import DataService from "@/services/DataService.js";

export default {
  name: "LinePlot",
  props: {
    //width: Number, 
    //height: Number, 
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
    }
  },
  created() {
    console.log("LinePlot created")
    console.log(this.genes)

  },

  async mounted() {
    console.log("LinePlot mounted")
    //this.display_gene_expression_data_table();
    this.genesData = this.genes.map((d) => d.name)
    this.initialize_line_plot()
    await this.update_line_plot()
  },
  async updated () {
    console.log("LinePlot updated")
    console.log(this.genes)
    this.genesData = this.genes.map((d) => d.name)
    //document.getElementById("plot-area").innerHTML = "";
    //document.getElementById("table-area").innerHTML = "";
    //this.display_data()

    this.update_line_plot()


  },
  methods: {
    filter_data(arr) {
      // One gene, one group
      let first_gene = arr[0].gene_name;
      let first_group = arr[0].group_name;
      return arr.filter((a) => {
        return a.gene_name == first_gene
      }).filter((a) => {
        return a.group_name == first_group
      })
    },
    single_line_plot() {
      // Filter data
      console.log('single_line_plot')
      

    },
    multi_line_plot(data) {
      console.log('multi_line_plot')

      // D3 SVG
      // set the dimensions and margins of the graph
      const margin = {top: 30, right: 30, bottom: 70, left: 60},
          width = 700 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      const drawable_width_scale = 4/5

      const svg = d3.select("#plot-area")
          .append("svg")
            .attr("id", "plot-svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "mx-auto")
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);



      console.log('data')
      console.log(data)

      // group the data: I want to draw one line per group
      //const sumstat = d3.group(data, d => d.gene_name, d => d.group_name); // nest function allows to group the calculation per level of a factor
      const sumstat = d3.group(data, d => `${d.gene_name}_${d.group_name}`);
      console.log('sumstat')
      console.log(sumstat)
      const sumstat_arr = Array.from(sumstat.entries())
      const num_groups = sumstat_arr.length 
      const zt_values = sumstat_arr[0][1].map(a => a.time_point)

      // Add X axis
      var x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.time_point; }))
        .range([ 0, width*drawable_width_scale]); 

      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr('class', 'x-axis')
        .call(d3.axisBottom(x))
        //.ticks(12);

      // X axis label
      svg.append("text")
          .attr("class", "x-label")
          .attr("text-anchor", "middle")
          .attr("x", width/2)
          .attr("y", height + 40)
          .text("Time Point");

      // Add Y axis
      var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d.gene_expression; })])
        .range([ height, 0 ]);

      svg.append("g")
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y))
        
      // Y Axis label
      svg.append("text")
          .attr("class", "y-label")
          .attr("text-anchor", "middle")
          .attr("y", -45)
          .attr("x", -height/2)
          .attr("transform", "rotate(-90)")
          .text("Gene Expression");

      // This allows to find the closest X index of the mouse:
      var bisect = d3.bisector(function(d) { return d.x; }).left;

      // color palette
      var color = d3.scaleOrdinal(d3.schemeCategory10);
      
      var focusArr = [];
      var focusTextArr = [];
      for (var i=0; i<num_groups; i++) {
        // Create the circles that travels along the curve of chart
        focusArr[i] = svg
          .append('g')
          .append('circle')
            .style("fill", color(sumstat_arr[i][0]))
            .attr("stroke", color(sumstat_arr[i][0]))
            .attr('r', 2)
            .style("opacity", 0)

        // Create the text that travels along the curve of chart
        focusTextArr[i] = svg
          .append('g')
          .append('text')
            .style("opacity", 0)
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "middle")

        // Add one dot in the legend for each name.
        var dotX = width*drawable_width_scale+20
        svg.selectAll("legendLines")
          .data(sumstat_arr)
          .enter()
          .append("line")
            .attr("x1", dotX)
            .attr("x2", dotX+15)
            .attr("y1", function(d,i){ return 0 + i*25})
            .attr("y2", function(d,i){ return 0 + i*25})
            //.attr("cx", width*drawable_width_scale+20)
            //.attr("cy", function(d,i){ return 0 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            //.attr("r", 3)
            .style("stroke", function(d){ return color(d[0])})
            .style("stroke-width", 1.5)

        svg.selectAll("legendText")
          .data(sumstat_arr)
          .enter()
          .append("text")
            .attr("x", dotX+20)
            .attr("y", function(d,i){ return 0 + i*25})
            .style("fill", function(d){ return color(d[0])})
            .text(function(d){ return d[0]})
            .attr("text-anchor", "left")
            .attr("font-size", "0.7em")

      }

      var focusLine = svg.append('g')
          .append('line')
          .attr('class', 'focusLine')
          .attr('x1', x(0))
          .attr('y1', 0)
          .attr('x2', x(0))
          .attr('y2', height )
          .style("stroke-width", 1.5)
          .style("stroke", "black")
          .style("fill", "none")
          .style("opacity", 0)    

      // Draw the line
      svg.selectAll(".line")
          .data(sumstat)
          .join("path")
            .attr("fill", "none")
            .attr("stroke", function(d){ return color(d[0]) })
            .attr("stroke-width", 1.5)
            .attr("d", function(d){
              return d3.line()
                //.curve(d3.curveBasis)
                .x(function(d) { return x(d.time_point); })
                .y(function(d) { return y(+d.gene_expression); })
                (d[1])
            })

      // Create a rect on top of the svg area: this rectangle recovers mouse position
      svg.append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width*drawable_width_scale)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

      // What happens when the mouse move -> show the annotations at the right positions.
      function mouseover() {
        for (var i=0; i<num_groups; i++) {
          focusArr[i].style("opacity", 1)
          focusTextArr[i].style("opacity", 1)
        }
        focusLine.style("opacity", 0.5)
      }

      function mousemove() {
        // recover coordinate we need
        var x0 = x.invert(d3.pointer(event)[0]);
        var y0 = y.invert(d3.pointer(event)[1]);
        //console.log('y0: ' + y0)
        
        var i = d3.bisect(zt_values, x0)
        let selectedData = sumstat_arr.map((el) => {
          return el[1][i]
        })

        focusLine.attr('x1', x(selectedData[0].time_point))
        focusLine.attr('x2', x(selectedData[0].time_point))        

        for(var i=0; i<num_groups; i++) {
          focusArr[i].attr("cx", x(selectedData[i].time_point))
            .attr("cy", y(selectedData[i].gene_expression))
          focusTextArr[i].html(Math.round(selectedData[i].gene_expression * 1000) / 1000)
            .attr("x", x(selectedData[i].time_point)+15)
            .attr("y", y(selectedData[i].gene_expression))
            .attr("font-size", "0.7em")
        }
      }

      function mouseout() {
        for (var i=0; i<num_groups; i++) {
          focusArr[i].style("opacity", 0)
          focusTextArr[i].style("opacity", 0)
        }
        focusLine.style("opacity", 0)
        // focus.style("opacity", 0)
        // focusText.style("opacity", 0)
      }

    },
    initialize_line_plot() {
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
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      // Initialize X axis
      this.x = d3.scaleLinear().range([0,this.width * this.drawable_width_scale])
      this.xAxis = d3.axisBottom().scale(this.x);
      this.svg.append("g")
          .attr("transform", `translate(0, ${this.height})`)
          .attr("class","myXaxis")

      // Initialize Y axis
      this.y = d3.scaleLinear().range([this.height, 0]);
      this.yAxis = d3.axisLeft().scale(this.y);
      this.svg.append("g")
        .attr("class","myYaxis")

    },
    async get_dataset() {
      let data = await DataService.getExpressionDataByGenes(this.genesData.toString())
      this.dataset = data.data
    },
    async update_line_plot() {
      console.log('update_line_plot')
      if (this.genesData.length) {
        await this.get_dataset()
      } else {
        this.dataset = []
      }

      const sumstat = d3
        .group(this.dataset, d => `${d.gene_name}_${d.group_name}`);
      console.log('sumstat: ')
      console.log(sumstat)  
      console.log('sumstat_map')
      const sumstat_arr = this.dataset.map((d,i) => [
        `${d.gene_name}_${d.group_name}_${d.time_point}`,{
        time_point: d.time_point,
        gene_expression: d.gene_expression,
        gene_group: `${d.gene_name}_${d.group_name}`,
        i: i,
        }]
      )
      console.log(sumstat_arr)
      const sumstat_map = new Map(sumstat_arr)
      console.log('sumstat_map')
      console.log(sumstat_map)
      
      var color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create the X axis
      var x = this.x
      x.domain([0, d3.max(this.dataset, (d) => d.time_point )])
      this.svg.selectAll(".myXaxis").transition()
        .duration(1000)
        .call(this.xAxis);

      // Create the Y axis
      var y = this.y
      y.domain([0, d3.max(this.dataset, (d) => +d.gene_expression)])
      this.svg.selectAll('.myYaxis')
          .transition()
          .duration(1000)
          .call(this.yAxis)

      var updateInterval = 500

      // Logic for plotting lines
      this.svg.selectAll(".line")
          .data(sumstat)
          .join(
            function(enter) {
              enter.append('path')
                .attr('class', 'line')
                .attr("d", (d) => d3.line()
                    .curve(d3.curveNatural)
                    .x((d) => x(d.time_point))
                    .y((d) => y(+d.gene_expression))
                    (d[1])
                )
                .attr("fill", "none")
                .attr("stroke-width", 1.5)
                .attr("stroke", (d) => color(d[0]))
              
              enter.append('g')

            },
            (update) => {
              update
                .transition()
                .duration(500)
                .attr("d", (d) => d3.line()
                    .curve(d3.curveNatural)
                    .x((d) => x(d.time_point))
                    .y((d) => y(+d.gene_expression))
                    (d[1]))
                .attr('stroke', (d) => color(d[0]))
            },
            (exit) => {
              exit  
                .style('stroke-opacity', 0)
                .transition()
                .ease(Math.sqrt)
                .duration(updateInterval)
                .remove()
            }
          )
      
      // Legend color
      var legendX = this.width*this.drawable_width_scale+20
      this.svg.selectAll(".legendLines")
          .data(sumstat)
          .join(
            (enter) => {
              enter.append('line')
                .attr('class', 'legendLines')
                .attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) => i*25 )
                .attr('y2', (d,i) => i*25 )
                .style("stroke", (d) => color(d[0]))
                .style("stroke-width", 1.5)
            },
            (update) => {
              update.attr('x1', legendX)
                .attr('x2', legendX + 15)
                .attr('y1', (d,i) =>  i*25 )
                .attr('y2', (d,i) =>  i*25 )
                .style("stroke", (d) => color(d[0]))
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
          .data(sumstat)
          .join(
            (enter) => {
              console.log('legendText enter')
              console.log(enter)
              enter.append('text')
                .attr('class', 'legendText')
                .attr('x', legendX+20)
                .attr('y', (d,i) => i*25)
                .style('fill', (d) => color(d[0]))
                .text((d) => d[0] )
                .attr('text-anchor', 'left')
                .attr('font-size', '0.7em')
                .style('fill-opacity', 1)
            },
            (update) => {
              update.attr('y', (d,i) => i*25 )
                .style('fill', (d) => color(d[0]))
                .text((d) => d[0])

            },
            (exit) => {
              exit.transition()
                .ease(Math.sqrt)
                .duration(updateInterval)
                .style('fill-opacity', 0)
                .remove()

            }
          )
    
      // Draw dots on points
      this.svg.selectAll(".dot")
        // Flattened sumstat array with gene_group keys
        .data(sumstat_map)
        .join(
          (enter) => {
            console.log('dots enter')
            console.log(enter)
            enter.append("circle")
              .attr("class", "dot")
              .style("fill", d => color(d[1].gene_group))
              //.style("stroke-width", "3px")
              //.style("stroke", d => color(d.key))
              .attr("cx", d => x(d[1].time_point))
              .attr("cy", d => y(d[1].gene_expression))
              .attr("r", 2)
              .transition()
              .ease(Math.sqrt)
              .duration(updateInterval)
              .style('fill-opacity', 1)
          },
          (update) => {
            //update
            console.log('dots update')
            console.log(update)
            update.attr('cx', d => x(d[1].time_point))
              .attr('cy', d => y(d[1].gene_expression))
              .style('fill', d => color(d[1].gene_group))
              .transition()
              .ease(Math.sqrt)
              .duration(updateInterval)
          },
          (exit) => {
            console.log('dots exit')
            console.log(exit)
            exit.transition()
              .ease(Math.sqrt)
              .duration(updateInterval)
              .style('fill-opacity', 0)
              .remove()
          }
        )
        

      // Voronoi cells to select nearest point
      var voronoi = d3.Delaunay
        .from(sumstat_map, d => x(d[1].time_point), d => y(d[1].gene_expression))
        .voronoi([0, 0, this.width * this.drawable_width_scale, this.height])

      //Create the voronoi grid
      this.svg.append("g")
        .attr("class", "voronoiWrapper")
        .selectAll("path")
        .data(sumstat_map)
        .join(
          (enter) => {
            enter.append("path")
            .attr("opacity", 0.5)
            //.attr("stroke", "#ff1493") // Hide overlay
            .attr("fill", "none")
            .style("pointer-events", "all")
            .attr("d", (d, i) => voronoi.renderCell(i))
            .on("mouseover", (d,i) => {
              console.log('mouseover')
              console.log(d)
              console.log(i)
              if (d.y > 1) {
                console.log('d.y > 1')
                console.log(d.y)
                console.log(i)
                this.svg.append('g')
                  .attr('class', 'tooltip')
                  .attr("transform", `translate(${x(i[1].time_point)},${y(i[1].gene_expression)})`)
                  .call(popover, `${i[1].gene_group} 
                  Time: ZT${i[1].time_point} 
                  Expr: ${Math.round(i[1].gene_expression)}`, i[1].gene_group)
              }
            })
            .on("mouseout", () => this.svg.selectAll('.tooltip').remove());
          },
          (update) => {

          },
          (exit) => {
            exit.remove()

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
        
        // tooltip container path
        path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
      }

      
      // // create focus chart
      // var focus = svg
      //   .append("g")
      //   .attr("class", "focus")
      //   .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

      // // Tooltip 
      // var tooltip = d3.select('#plot-area')
      //   .append('div')
      //   .style('width', '200px')
      //   .style('position', 'absolute')
      //   .style('padding', '8px')
      //   .style('border', '1px solid #ccc')
      //   .style('pointer-events', 'none')
      //   .style('background', 'white')
      //   .style('display', 'none')
      //   .node()

      // // Mouse sensor rect
      // this.svg.append('rect')
      //     .style('fill', 'none')
      //     .style('pointer-events', 'all')
      //     .attr('width', this.width*this.drawable_width_scale)
      //     .attr('height', this.height)
      //     .on('mouseover', mouseover)
      //     .on('mousemove', mousemove)
      //     .on('mouseout', mouseout)

      // var tooltip = d3.select("#plot-area")
      //     .append('div')
      //     .attr("id", "tooltip")
      //     .style("position", "absolute")
      //     .style("visibility", "hidden")
      //     .style("background-color", "white")
      //     .style("border", "solid")
      //     .style("border-width", "1px")
      //     .style("border-radius", "5px")
      //     .style("padding", "10px")
      //     .html("<p>Hello</p>")

      // // Delaunay nearest data point search
      // // delaunay = d3.Delaunay.from(sumstat, d => x(d.time_point), d => y(d.gene_expression))
      // // console.log('delaunay')
      // // console.log(delaunay)



      // function mouseout() {
      //   console.log('mouseout')
      //   //tooltip.style('visibility', 'hidden')
      // }



      // function find(mx, my) {
      //   const idx = delaunay.find(mx, my);

      //   if (idx !== null) {
      //     const datum = data[idx];
      //     const d = distance(x(datum.time_point), y(datum.gene_expression), mx, my);

      //     return d < radius ? datum : null;
      //   }

      //   return null;
      // }

      // function distance(px, py, mx, my) {
      //   const a = px - mx;
      //   const b = py - my;

      //   return Math.sqrt(a * a + b * b);
      // }

      // function mouseleft () {
      //   d3.select(tooltip).style('display', 'none');
      // }

          
    },
    async display_data() {
      console.log('display_data')
      if (!this.genes) {
        console.log('Resetting this.genes')
        this.genesData = ['0610009B22Rik','Agrn']
      } else {
        console.log('Props genes: ')
        console.log(this.genes.map((d) => d.name))
        this.genesData = this.genes.map((d) => d.name)
      }
      
      //genes = genes.toString()
      //console.log(genes)
      let data = await DataService
        .getExpressionDataByGenes(this.genesData.toString())
      this.dataset = data
      console.log('data.data:')
      console.log(data.data)
      //console.log(this.dataset)

      let columns = ['gene_name', 'group_name' ,'time_point', 'gene_expression']
      //this.tabulate(data.data, columns)
      this.multi_line_plot(data.data)

    },
    display_gene_expression_data_table() {
      let genes = ['0610009B22Rik','Agrn']
      genes = genes.toString()
      console.log(genes)

      console.log('gene_expression_data_by_genes')
      DataService.getExpressionDataByGenes(genes)
        .then(response => {
          this.dataset = response.data
          //var data = this.filter_data(this.dataset)
          let data = this.dataset
          let columns = ['gene_name', 'group_name' ,'time_point', 'gene_expression']
          var myTable = this.tabulate(data, columns)

          myTable.selectAll("tbody tr") 
            // .sort(function(a, b) {
            //         return d3.descending(a.gene_expression, b.gene_expression);
            // });

          myTable.selectAll("thead th")
            .text(function(column) {
                    return column.charAt(0).toUpperCase()+column.substr(1);
            })
            .attr("style", "padding: 0 5px");

        // D3 SVG
        // set the dimensions and margins of the graph
        const margin = {top: 30, right: 30, bottom: 70, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#plot-area")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "mx-auto")
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add X axis --> it is a date format
        var x = d3.scaleLinear()
          .domain(d3.extent(data, function(d) { return d.time_point; }))
          .range([ 0, width ]);

        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

        // Add Y axis
        var y = d3.scaleLinear()
          .domain([0, d3.max(data, function(d) { return +d.gene_expression; })])
          .range([ height, 0 ]);
        svg.append("g")
          .call(d3.axisLeft(y));

        // Add the line
        svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", d3.line()
            .x(function(d) { return x(d.time_point) })
            .y(function(d) { return y(d.gene_expression) })
            )
        }) 
    },
    tabulate(data, columns) {
      console.log("Tabulating")
      var table = d3.select("#table-area").append("table")
              .attr("style", "margin-left: 0px")
              .style("border-collapse", "collapse")// <= Add this line in
              .style("border", "2px black solid") // <= Add this line in
              .attr("class", "mx-auto"),
          thead = table.append("thead"),
          tbody = table.append("tbody");

      // append the header row
      thead.append("tr")
          .selectAll("th")
          .data(columns)
          .enter()
          .append("th")
              .text(function(column) { return column; });

      // create a row for each object in the data
      var rows = tbody.selectAll("tr")
          .data(data)
          .enter()
          .append("tr");

      console.log('rows')
      console.log(rows)
      console.log(this.dataset)

      // create a cell in each row for each column
      var cells = rows.selectAll("td")
          .data(function(row) {
              return columns.map(function(column) {
                  return {column: column, value: row[column]};
              });
          })
          .enter()
          .append("td")
          .attr("style", "font-family: Courier") // sets the font style
              .html(function(d) { return d.value; });
      console.log('cells')
      console.log(cells)
      
      return table;
    },
  }

}
</script>

<style>

</style>