<template>
  <div class="text-center mx-auto">Margin Translation component</div>
  <div id="viz-area" class="relative text-center mt-10">
  </div>
  <div id="table-area"></div>
</template>


<script>
import * as d3 from "d3";
import DataService from "../../services/DataService.js";

export default {
  name: "MarginTranslation",
  props: {
    //width: Number, 
    //height: Number, 
    msg: String,
  },
  data() {
    return {
      dataset: [],
    }
  },
  async mounted() {
    console.log("MarginTranslation mounted");
    // this.retrieveData();
    // console.log("After retrieve");
    // console.log(this.dataset)
    //this.display_gene_expression_data_table();
    let result = await DataService.getAllSampleMetadata()
    console.log(result)
    
  },
  methods: {
    retrieveData() {
      console.log("Retrieving data...")
      DataService.getAllSampleMetadata()
        .then(response => {
          this.dataset = response.data;
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },
    margin_translation() {
      console.log("margin_translation from component")
      // set the dimensions and margins of the graph
      var margin = {top: 10, right: 40, bottom: 30, left: 30},
          width = 450 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var sVg = d3.select("#viz-area")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        // translate this svg element to leave some margin.
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      

      // X scale and Axis
      var x = d3.scaleLinear()
          .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
          .range([0, width]);       // This is the corresponding value I want in Pixel
      sVg
        .append('g')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // X scale and Axis
      var y = d3.scaleLinear()
          .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
          .range([height, 0]);       // This is the corresponding value I want in Pixel
      sVg
        .append('g')
        .call(d3.axisLeft(y));

      console.log(sVg);

    },
    data_binding() {
      console.log("Data binding");
      // set the dimensions and margins of the graph
      var margin = {top: 10, right: 40, bottom: 30, left: 30},
          width = 450 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var svG = d3.select("#viz-area")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

      // Create data
      var data = [ {x:10, y:20}, {x:40, y:90}, {x:80, y:50} ]

      // X scale and Axis
      var x = d3.scaleLinear()
          .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
          .range([0, width]);       // This is the corresponding value I want in Pixel
      svG
        .append('g')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // X scale and Axis
      var y = d3.scaleLinear()
          .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
          .range([height, 0]);       // This is the corresponding value I want in Pixel
      svG
        .append('g')
        .call(d3.axisLeft(y));

      // Add 3 dots for 0, 50 and 100%
      svG
        .selectAll("whatever")
        .data(data)
        .enter()
        .append("circle")
          .attr("cx", function(d){ return x(d.x) })
          .attr("cy", function(d){ return y(d.y) })
          .attr("r", 7)

    },
    display_sample_metadata_table() {
      console.log('sample_metadata')
      DataService.getAllSampleMetadata()
        .then(response => {
          this.dataset = response.data;
          var myTable = this.tabulate(this.dataset, ['sample_name','group_name','time_point','organism',	
            'type_of_data', 'age',	'gender', 'tissue',	'number_of_replicates'])

          myTable.selectAll("tbody tr") 
            .sort(function(a, b) {
                    return d3.descending(a.sample_name, b.sample_name);
            });

          myTable.selectAll("thead th")
            .text(function(column) {
                    return column.charAt(0).toUpperCase()+column.substr(1);
            })
            .attr("style", "margin-left: 5px");
        })      
    },
    display_gene_expression_data_table() {
      console.log('gene_expression_data')
      DataService.getExpressionData(5000, 4000, 100)
        .then(response => {
          this.dataset = response.data;
          console.log(this.dataset)
          var myTable = this.tabulate(this.dataset, ['gene_name', 'sample_name', 'gene_expression'])

          myTable.selectAll("tbody tr") 
            .sort(function(a, b) {
                    return d3.descending(a.gene_expression, b.gene_expression);
            });

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
        const svg = d3.select("#viz-area")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Parse the Data
        //d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/7_OneCatOneNum_header.csv").then( function(data) {

        
        // X axis
        const x = d3.scaleBand()
          .range([ 0, width ])
          .domain(data.map(d => d.Country))
          .padding(0.2);
        svg.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        const y = d3.scaleLinear()
          .domain([0, 13000])
          .range([ height, 0]);
        svg.append("g")
          .call(d3.axisLeft(y));

        // Bars
        svg.selectAll("mybar")
          .data(data)
          .join("rect")
            .attr("x", d => x(d.Country))
            .attr("y", d => y(d.Value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.Value))
            .attr("fill", "#69b3a2")

        



        }) 
    },
    tabulate(data, columns) {
      console.log("Tabulating")
      var table = d3.select("#table-area").append("table")
              .attr("style", "margin-left: 0px")
              .style("border-collapse", "collapse")// <= Add this line in
              .style("border", "2px black solid"), // <= Add this line in
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