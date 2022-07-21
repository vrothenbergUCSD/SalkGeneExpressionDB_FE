<template>
  <div class="p-5 font-semibold text-3xl text-center">Main</div>
  <div class="flex flex-wrap p-5 mx-auto w-11/12">
    <div class="w-1/3 min-w-max">
      <div class="font-semibold mb-2">Species</div>
      <Dropdown v-model="speciesSelected" :options="this.speciesFiltered" optionLabel="name" placeholder="Species" @change="speciesChange" :show-clear="true"  class="w-10 text-left"/>
    </div>
    <div class="w-1/3 min-w-max">
      <div class="font-semibold mb-2">Experiment</div>
      <Dropdown v-model="experimentSelected" :options="this.experimentsFiltered" optionLabel="name" placeholder="Experiment" @change="experimentChange" :show-clear="true" class="w-10 text-left"/>
    </div>
    <div class="w-1/3 min-w-max">
      <div class="font-semibold mb-2">Tissue</div>
      <Dropdown v-model="tissueSelected" :options="this.tissuesFiltered" optionLabel="name" placeholder="Tissue" @change="tissueChange" :show-clear="true" class="w-10 text-left"/>
    </div>
  </div>
  <div class="mx-auto w-3/4">
    <div class="font-semibold my-2">Genes</div>
    <span class="p-fluid">
        <AutoComplete :multiple="true" v-model="this.genesSelected" :suggestions="this.genesFiltered" @complete="searchGenes($event)" @item-select="updatePlot" @item-unselect="updatePlot" field="name" />
    </span>

  </div>

  <div class="mx-auto w-full">
    <LinePlot :genes="this.genesSelected"/>
    <!--<MarginTranslation/>-->
  </div>
  

</template>

<script>
import Dropdown from "primevue/dropdown"
import AutoComplete from "primevue/autocomplete"

import Selection from "../components/Selection.vue"
import Prime from "../components/Prime.vue"
import LinePlot from "@/components/svg/LinePlot.vue"
import BarPlot from "@/components/svg/BarPlot.vue"
import MarginTranslation from "@/components/svg/MarginTranslation.vue"

import DataService from "@/services/DataService.js"
import {FilterService,FilterMatchMode} from 'primevue/api';

export default {
  name: "Main",
  components: {
    AutoComplete,
    Selection,
    Prime,
    Dropdown,
    LinePlot,
    BarPlot,
    MarginTranslation,
},
  data() {
    return {
      species: ["Mouse", "Human", "Baboon"],
      speciesFiltered: null,
      speciesSelected: null,

      experiments: ["Mouse_TRF_2018", "Mouse_TRF_2019", "Baboon_TRF_2020", "Human_ABC_2020"],
      experimentsFiltered: null,
      experimentSelected: null,

      tissues:["Liver", "Muscle", "Adipose", "Heart", "Neuron", "Something", "Another", "Some more", "Over"],
      tissuesFiltered: null,     
      tissueSelected: null,

      genes: null,
      genesFiltered: null,
      genesSelected: ['Alb', 'Fga','Trf'],
    }
  },
  created() {
    this.species = this.buildList(this.species)
    this.speciesFiltered = this.species
    this.experiments = this.buildList(this.experiments)
    this.experimentsFiltered = this.experiments
    this.tissues = this.buildList(this.tissues)
    this.tissuesFiltered = this.tissues
    this.genesSelected = this.buildList(this.genesSelected)
  },
  async mounted() {
    // Populate array with all genes
    this.genes = await DataService.getGenes()
    this.genes = this.buildList(this.genes.data.map((d) => d.gene_name))
    // console.log('mounted, await genes: ')
    // console.log(this.genes)
    console.log('Main mounted')
    console.log(this.genesSelected)
  },
  methods: {
    updatePlot() {
      console.log('updatePlot')
      console.log(this.genesSelected)


    },
    buildList(list) {
      return list.map(object => {
        return {'name' : object}
    })},
    filterList(list, s) {
      console.log('filterList')
      list.forEach(object => {
        object.visible = (object.name.toLowerCase().includes(s.toLowerCase()));
      })
    },
    speciesChange(e) {
      console.log('speciesChange')
      if(!e.value) {
        this.experimentsFiltered = this.experiments
        return
      }
      //console.log(e.value.name)
      console.log(this.speciesSelected)
      this.experimentsFiltered = this.experiments.filter(obj => obj.name.toLowerCase().includes(e.value.name.toLowerCase()))
      //console.log(this.experimentsFiltered)
    },
    experimentChange(e) {
      //console.log('experimentChange')
      //console.log(e.value.name)
      if(!e.value) {
        this.tissuesFiltered = this.tissues
        return
      }
      const searchString = e.value.name === "Human" ? "Heart" : "Liver";
      this.tissuesFiltered = this.tissues.filter(obj => obj.name.toLowerCase().includes(searchString.toLowerCase()))
      const speciesFromExperiment = e.value.name.split("_")[0]
      this.speciesSelected = {'name' : speciesFromExperiment}
      console.log('speciesFromExperiment: ' + speciesFromExperiment)
      //this.speciesFiltered = this.species.filter(obj => obj.name.toLowerCase().includes(speciesFromExperiment.toLowerCase()))[0]
      
    },
    tissueChange(e) {
      //console.log('tissueChange')
      //console.log(e.value.name)
      if(!e.value) {
        return
      }
      if (this.speciesSelected && this.experimentSelected && this.tissueSelected) {
        console.log("All selected")

      }
    },
    searchGenes(event) {
      //console.log('searchGenes')
      //console.log(event.query)
      //console.log(this.genes)
      setTimeout(() => {
        if (!event.query.trim().length) {
          //console.log('up here')
            this.genesFiltered = [...this.genes];
        }
        else {
          console.log('down ehre')
            this.genesFiltered = this.genes.filter((gene) => {
                return gene.name.toLowerCase().startsWith(event.query.toLowerCase());
            });
            //console.log(this.genesFiltered)
        }
      }, 250);
    },
  },


}
</script>

<style>

</style>