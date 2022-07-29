<template>
  <div class="p-5 font-semibold text-3xl text-center">Temporal Gene Expression</div>




  <div class="flex flex-wrap p-5 mx-auto w-11/12">
    <div class="w-1/3">
      <div class="font-semibold mb-2">Species</div>
      <MultiSelect v-model="speciesSelected" :options="this.speciesFiltered" optionLabel="name" placeholder="Species" @change="speciesChange" class="w-10 text-left"/>
      <!-- <Dropdown v-model="speciesSelected" :options="this.speciesFiltered" optionLabel="name" placeholder="Species" @change="speciesChange" :show-clear="true"  class="w-10 text-left"/> -->
    </div>
    <div class="w-1/3">
      <div class="font-semibold mb-2">Experiment</div>
      <MultiSelect v-model="experimentsSelected" :options="this.experimentsFiltered" optionLabel="name" placeholder="Experiments" @change="experimentsChange" class="w-10 text-left"/>
      
      <!-- <Dropdown v-model="experimentsSelected" :options="this.experimentsFiltered" optionLabel="name" placeholder="Experiment" @change="experimentsChange" :show-clear="true" class="w-10 text-left"/> -->
    </div>
    <div class="w-1/3">
      <div class="font-semibold mb-2">Tissue</div>
      <MultiSelect v-model="tissuesSelected" :options="this.tissuesFiltered" optionLabel="name" placeholder="Tissues" @change="tissuesChange" class="w-10 text-left"/>
      
      <!-- <Dropdown v-model="tissuesSelected" :options="this.tissuesFiltered" optionLabel="name" placeholder="Tissue" @change="tissuesChange" :show-clear="true" class="w-10 text-left"/> -->
    </div>
  </div>
  <div class="mx-auto w-3/4">
    <div class="font-semibold my-2">Genes</div>
    <span class="p-fluid">
        <AutoComplete :multiple="true" v-model="this.genesSelected" :suggestions="this.genesFiltered" @complete="searchGenes($event)" @item-select="updatePlot" @item-unselect="updatePlot" field="name" />
    </span>

  </div>


  <div>
    <div class="card w-3/4 mx-auto mt-2">
      <!-- <div class="font-semibold text-center mt-3">Chart Types</div> -->
      <TabMenu :model="items"/>
      <router-view :genes="this.genesSelected"/>
    </div>
  </div>

  <!-- <div class="mx-auto w-full">
    <LinePlot :genes="this.genesSelected"/>
  </div> -->


  

</template>

<script>
import Dropdown from "primevue/dropdown"
import AutoComplete from "primevue/autocomplete"
import TabMenu from 'primevue/tabmenu'
import Button from 'primevue/button'
import MultiSelect from 'primevue/multiselect';

import Selection from "@/components/Selection.vue"
import Prime from "@/components/Prime.vue"
import LinePlot from "@/components/svg/LinePlot.vue"
import BarPlot from "@/components/svg/BarPlot.vue"
// import MarginTranslation from "@/components/svg/MarginTranslation.vue"

import DataService from "@/services/DataService.js"
import {FilterService,FilterMatchMode} from 'primevue/api';

export default {
  name: "Main",
  components: {
    Dropdown,
    AutoComplete,
    TabMenu,
    Button,
    MultiSelect,

    Selection,
    Prime,
    
    LinePlot,
    BarPlot,
    // MarginTranslation,
},
  data() {
    return {
      items: [
        {
          label: 'Bar',
          icon: 'pi pi-fw pi-chart-bar',
          to: '/main/bar'
        },
        {
          label: 'Line',
          icon: 'pi pi-fw pi-chart-line',
          to: '/main/line',

        }
      ],

      database_metadata: null,

      species: ["Mouse", "Human", "Baboon"],
      speciesFiltered: null,
      speciesSelected: [],

      experiments: ["Mouse_TRF_2018", "Mouse_TRF_2019", "Baboon_TRF_2020", "Human_ABC_2020"],
      experimentsFiltered: null,
      experimentsSelected: [],

      tissues:["Liver", "Muscle", "Adipose", "Heart", "Neuron", "Something", "Another", "Some more", "Over"],
      tissuesFiltered: null,     
      tissuesSelected: [],

      genes: null,
      genesFiltered: [],
      genesSelected: ['Alb', 'Fga','Trf'],

    }
  },
  created() {
    console.log('Main created')
    this.species = this.buildList(this.species)
    this.speciesFiltered = this.species
    this.experiments = this.buildList(this.experiments)
    this.experimentsFiltered = this.experiments
    this.tissues = this.buildList(this.tissues)
    this.tissuesFiltered = this.tissues
    this.genesSelected = this.buildList(this.genesSelected)

    // console.log('this.menuIndex: ' + this.menuIndex)
    // console.log()
    // Default chart selection is bar
    this.$router.push('/main/bar')
  },
  async mounted() {
    // Populate array with all genes
    // console.log('Main mounted, await genes: ')
    this.genes = await DataService.getGenes()
    this.database_metadata = await DataService.getDatabaseMetadata()
    this.database_metadata = this.database_metadata.data

    this.genes = this.buildList(this.genes.data.map((d) => d.gene_name))

  
    console.log('Database metadata:')
    const metadata = this.database_metadata
    console.log(metadata)

    const speciesUniq = [...new Set(metadata.map(item => item.species))]
    console.log('Species')
    console.log(speciesUniq)
    this.species = this.buildList(speciesUniq)

    const expUniq = [...new Set(metadata.map(item => item.experiment))]
    console.log('Experiments')
    console.log(expUniq)
    this.experiments = this.buildList(expUniq)

    const tissuesUniq = [...new Set(metadata.map(item => item.tissue))]
    console.log('Tissues')
    console.log(tissuesUniq)
    this.tissues = this.buildList(tissuesUniq)
    

    
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
      const result = this.filterResults()
      this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
      if (!e.value.length)
        this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])

    },
    experimentsChange(e) {
      console.log('experimentsChange')
      const result = this.filterResults()
      this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
      this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
      if (!e.value.length)
        this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])

    },
    tissuesChange(e) {
      console.log('tissuesChange')
      const result = this.filterResults()
      this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
      this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      if (!e.value.length)
        this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])

    },
    filterResults() {
      // Inputs are arrays of strings
      // If array is empty then no filter is performed
      const speciesSelectedNames = this.speciesSelected.map(el => el.name)
      const experimentsSelectedNames = this.experimentsSelected.map(el => el.name)
      const tissuesSelectedNames = this.tissuesSelected.map(el => el.name)

      let result = this.database_metadata

      if (speciesSelectedNames.length)
        result = result.filter(
          ({ species }) => speciesSelectedNames.some(
            (s) => species.toLowerCase().includes(s.toLowerCase())))

      if (experimentsSelectedNames.length) 
        result = result.filter(
          ({ experiment }) => experimentsSelectedNames.some(
            (s) => experiment.toLowerCase().includes(s.toLowerCase())))

      if (tissuesSelectedNames.length)
        result = result.filter(
          ({ tissue }) => tissuesSelectedNames.some(
            (s) => tissue.toLowerCase().includes(s.toLowerCase())))

      return result
    },
    searchGenes(event) {
      //console.log('searchGenes')
      //console.log(event.query)
      //console.log(this.genes)
      setTimeout(() => {
        if (!event.query.trim().length) {
            this.genesFiltered = [...this.genes];
        }
        else {
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