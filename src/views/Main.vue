<template>
  <div class="p-5 font-semibold text-3xl text-center">Temporal Gene Expression</div>
  <div class="flex flex-wrap p-5 mx-auto w-11/12">
    <div class="w-1/3 px-2 border">
      <div class="font-semibold my-2">Species</div>
      <DataTable :value="speciesFiltered" v-model:selection="speciesSelected" 
        class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
        :loading="loading" @row-select="speciesRowChange(update=false)" 
        @row-unselect="speciesRowChange(update=true)"
        @row-select-all="speciesRowChange(update=false)"
        @row-unselect-all="speciesRowChange(update=true)">
      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="name" header=""></Column>
      <Column field="count" header="#">
        <template #body="slotProps">
          {{getCount('species', slotProps.data.name)}}
        </template>
      </Column>
      <Column field="freq" header="Freq">
        <template #body="slotProps">
          {{getFreq('species', slotProps.data.name)}}
        </template>
      </Column>
      </DataTable>
    </div>
    <div class="w-1/3 px-2 border" >
      <div class="font-semibold my-2">Experiment</div>
      <DataTable :value="experimentsFiltered" v-model:selection="experimentsSelected" 
        class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
        :loading="loading" @row-select="experimentsRowChange(update=false)"
        @row-unselect="experimentsRowChange(update=true)"
        @row-select-all="experimentsRowChange(update=false)"
        @row-unselect-all="experimentsRowChange(update=true)">
      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="name" header=""></Column>
      <Column field="count" header="#">
        <template #body="slotProps">
          {{getCount('experiment', slotProps.data.name)}}
        </template>
      </Column>
      <Column field="freq" header="Freq">
        <template #body="slotProps">
          {{getFreq('experiment', slotProps.data.name)}}
        </template>
      </Column>

      </DataTable>
      
    </div>
    <div class="w-1/3 px-2 border">
      <div class="font-semibold my-2">Tissue</div>
      <DataTable :value="tissuesFiltered" v-model:selection="tissuesSelected" 
        class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
        :loading="loading" @row-select="tissuesRowChange(update=false)" 
        @row-unselect="tissuesRowChange(update=true)"
        @row-select-all="tissuesRowChange(update=false)"
        @row-unselect-all="tissuesRowChange(update=true)">
      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="name" header=""></Column>
      <Column field="count" header="#">
        <template #body="slotProps">
          {{getCount('tissue', slotProps.data.name)}}
        </template>
      </Column>
      <Column field="freq" header="Freq">
        <template #body="slotProps">
          {{getFreq('tissue', slotProps.data.name)}}
        </template>
      </Column>
      </DataTable>
      
    </div>
  </div>
  <div class="mx-auto w-3/4">
    <div class="font-semibold m-2">Genes</div>
    <div v-show="this.loadingGenes">
      <ProgressBar mode="indeterminate" />
    </div>
    <span class="p-fluid" v-show="!this.loadingGenes">
      <AutoComplete :multiple="true" v-model="this.genesSelected" 
      :suggestions="this.genesFiltered" @complete="searchGenes($event)" 
      @item-select="updatePlot" @item-unselect="updatePlot" field="name" />
    </span>
    
    

  </div>


  <div>
    <div class="card w-3/4 mx-auto mt-2">
      <TabMenu :model="items"/>
      <router-view :genes="this.genesSelected"/>
    </div>
  </div>


</template>

<script>
import ProgressBar from 'primevue/progressbar';
import AutoComplete from "primevue/autocomplete"
import TabMenu from 'primevue/tabmenu'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import Selection from "@/components/Selection.vue"
import Prime from "@/components/Prime.vue"
import LinePlot from "@/components/svg/LinePlot.vue"
import BarPlot from "@/components/svg/BarPlot.vue"

import DataService from "@/services/DataService.js"

export default {
  name: "Main",
  components: {
    ProgressBar,
    AutoComplete,
    TabMenu,
    Button,
    DataTable,
    Column,

    Selection,
    Prime,
    
    LinePlot,
    BarPlot,
  },
  DataService: null,
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
      loading: true,
      loadingGenes: true,

      db_metadata: null,

      filtered_metadata: null,
      lookup_table: null,

      columns: null,
      categories: ['species', 'experiment', 'tissue'],

      species: [], //["Mouse", "Human", "Baboon"],
      speciesFiltered: [], // [{name: Mouse}, {name:Human}]
      speciesSelected: [],

      experiments: [], //["Mouse_TRF_2018", "Mouse_TRF_2019", "Baboon_TRF_2020", "Human_ABC_2020"],
      experimentsFiltered: [],
      experimentsSelected: [],

      tissues: [], //["Liver", "Muscle", "Adipose", "Heart", "Neuron", "Something", "Another", "Some more", "Over"],
      tissuesFiltered: [],     
      tissuesSelected: [],

      genes: [],
      genesFiltered: [],
      genesSelected: ['Alb', 'Fga','Trf'],

    }
  },
  created() {
    console.log('Main created')

    this.columns = [
      {field:'name', header:''},
      {field:'count', header:'#'},
      {field:'freq', header:'Freq'}
    ]

    this.species = this.buildList(this.species)
    this.speciesFiltered = this.species
    
    this.experiments = this.buildList(this.experiments)
    this.experimentsFiltered = this.experiments

    this.tissues = this.buildList(this.tissues)
    this.tissuesFiltered = this.tissues

    this.genesSelected = this.buildList(this.genesSelected)

    this.$router.push('/main/bar')
  },
  async mounted() {
    // Populate array with all genes
    console.log('Main mounted, await genes: ')
    const start = Date.now()

    await Promise.all([this.loadMetadata(), this.loadGenes()])

    // this.loadMetadata()
    // this.loadGenes()
    
    console.log('Main mount finished')
    console.log('Time elapsed')
    console.log(Date.now() - start)
  },
  methods: {
    async loadGenes() {
      const start = Date.now()
      this.genes = await DataService.getGenes()
      this.genes = this.genes.data.map((d) => ({name: d.gene_name}))
      this.loadingGenes = false
      console.log('loadGenes time elapsed: ')
      console.log(Date.now() - start)
    },
    async loadMetadata() {
      const start = Date.now()
      this.db_metadata = await DataService.getDatabaseMetadata().then(e => e.data)
      this.lookup_table = this.initializeLookupTable(this.db_metadata)
      this.filtered_metadata = this.db_metadata

      this.species = this.buildList([...new Set(this.db_metadata.map(item => item.species))])
      this.speciesFiltered = this.species

      this.experiments = this.buildList([...new Set(this.db_metadata.map(item => item.experiment))])
      this.experimentsFiltered = this.experiments

      this.tissues = this.buildList([...new Set(this.db_metadata.map(item => item.tissue))])
      this.tissuesFiltered = this.tissues

      this.loading = false
      console.log('loadMetadata time elapsed:')
      console.log(Date.now() - start)
    },
    initializeLookupTable(metadata) {
      console.log('initializeLookupTable')
      const table = {}
      this.categories.forEach((cat) => {
        // species, experiments, tissues
        table[cat] = {}
        const uniqVal = [...new Set(metadata.map(item => item[cat]))]
        let sum = 0
        uniqVal.forEach((val) => {
          // Mouse, TRF_2020, Liver, etc. 
          table[cat][val] = {}
          table[cat][val].count = metadata
            .reduce((acc, cur) => cur[cat] === val ? ++acc : acc, 0)
          sum += table[cat][val].count
        })
        uniqVal.forEach((val) => {
          table[cat][val].freq = table[cat][val].count / sum
        })
      })
      return table
    },
    updateLookupTable(metadata, origin) {
      console.log('updateLookupTable')
      this.categories.forEach((cat) => {
        // species, experiments, tissues
        if (cat == origin) return
        const uniqVal = [...new Set(metadata.map(item => item[cat]))]
        let sum = 0
        uniqVal.forEach((val) => {
          // Mouse, TRF_2020, Liver, etc. 
          this.lookup_table[cat][val] = {}
          this.lookup_table[cat][val].count = metadata
            .reduce((acc, cur) => cur[cat] === val ? ++acc : acc, 0)
          sum += this.lookup_table[cat][val].count
        })
        uniqVal.forEach((val) => {
          this.lookup_table[cat][val].freq = this.lookup_table[cat][val].count / sum
        })
      })
    },
    updatePlot() {

    },
    getCount(cat, value) {
      // cat = 'species' 
      // value = 'Human'
      if (Object.keys(this.lookup_table[cat]).includes(value))
        return this.lookup_table[cat][value].count
      return null
    },
    getFreq(cat, value) {
      if (Object.keys(this.lookup_table[cat]).includes(value))
        return (this.lookup_table[cat][value].freq * 100).toFixed(2) + '%'
      return null
    },
    buildList(list) {
      return list.map(object => {
        return {'name' : object}
    })},
    speciesRowChange(update) {
      console.log('speciesRowChange')
      console.log(update)
      const result = this.filterResults()
      let origin = update ? '' : 'species'
      this.updateLookupTable(result, origin)
      this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
      if (!this.speciesSelected.length)
        this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
    },
    experimentsRowChange(update) {
      const result = this.filterResults()

      let origin = update ? '' : 'experiment'
      this.updateLookupTable(result, origin)

      this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
      this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])

      if (!this.experimentsSelected.length) {
        this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      }

    },
    tissuesRowChange(update) {
      const result = this.filterResults()
      
      let origin = update ? '' : 'tissue'
      this.updateLookupTable(result, origin)
      
      this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
      this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      
      if (!this.tissuesSelected.length) {
        this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
      }
        
    },

    filterResults() {
      // Inputs are arrays of strings
      // If array is empty then no filter is performed
      const speciesSelectedNames = this.speciesSelected.map(el => el.name)
      const experimentsSelectedNames = this.experimentsSelected.map(el => el.name)
      const tissuesSelectedNames = this.tissuesSelected.map(el => el.name)

      let result = this.db_metadata

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
    async searchGenes(event) {
      setTimeout(() => {
        if (!event.query.trim().length) {
            this.genesFiltered = [...this.genes];
        }
        else {
            this.genesFiltered = this.genes.filter((gene) => {
                return gene.name.toLowerCase().startsWith(event.query.toLowerCase());
            });
        }
      }, 250);
    },
  },


}
</script>

<style>

</style>