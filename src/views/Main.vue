<template>
<div id="main" class="w-11/12 p-3 mx-auto">
  <div class="p-5 font-semibold text-3xl text-center">Temporal Gene Expression</div>
  <div id="filters-ui" class="my-3 p-2 mx-auto bg-slate-100 rounded-2xl flex flex-wrap" v-if="this.speciesSelected.length || this.experimentSelected.length || this.tissueSelected.length"> 
    <div id="filters-species" class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3" v-if="this.speciesSelected.length">
      <div class="font-semibold text-sm pl-1">Species:</div>
      <div v-for="(item, index) in this.speciesSelected" :key="item">
        <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable @remove="removeSpeciesFilter(item.name)"/>
        <span class="px-1 font-semibold" v-if="index < this.speciesSelected.length-1">or</span>
      </div>
    </div>
    <div id="filters-experiment" class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3" v-if="this.experimentSelected.length">
      <div class="font-semibold text-sm pl-1">Experiments:</div>
      <div v-for="(item, index) in this.experimentSelected" :key="item" class="my-1">
        <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable @remove="removeExperimentFilter(item.name)"/>
        <span class="px-1 font-semibold text-sm" v-if="index < this.experimentSelected.length-1">or</span>
      </div>
    </div>
    <div id="filters-tissue" class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3" v-if="this.tissueSelected.length">
      <div class="font-semibold text-sm pl-1">Tissues:</div>
      <div v-for="(item, index) in this.tissueSelected" :key="item">
        <!-- content -->
        <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable @remove="removeTissueFilter(item.name)"/>
        <span class="px-1 font-semibold text-sm" v-if="index < this.tissueSelected.length-1">or</span>
      </div>
    </div>
    <div id="clear-filters" class=" my-2 flex flex-wrap align-items-center mx-3" >
      <Chip label="Clear All Filters" class="mx-1 text-sm font-semibold" removable @remove="clearAllFilters"/>
    </div>
  </div>
  <div class="flex flex-wrap mx-auto " v-if="!this.filterWarning">
    <div class="w-1/3 px-2 border">
      <div class="font-semibold my-2">Species</div>
      <DataTable :value="speciesFiltered" v-model:selection="speciesSelected" 
        class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
        :loading="loading" @row-select="speciesRowChange('select')" 
        @row-unselect="speciesRowChange('unselect')"
        @row-select-all="speciesRowChange('select-all')"
        @row-unselect-all="speciesRowChange('unselect-all')">
      <Column selectionMode="multiple" style="width: 3rem" ></Column>
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
      <DataTable :value="experimentFiltered" v-model:selection="experimentSelected" 
        class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
        :loading="loading" @row-select="experimentRowChange('select')"
        @row-unselect="experimentRowChange('unselect')"
        @row-select-all="experimentRowChange('select-all')"
        @row-unselect-all="experimentRowChange('unselect-all')">
      <Column selectionMode="multiple" style="width: 3rem"></Column>
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
      <DataTable :value="tissueFiltered" v-model:selection="tissueSelected" 
        class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
        :loading="loading" @row-select="tissueRowChange('select')" 
        @row-unselect="tissueRowChange('unselect')"
        @row-select-all="tissueRowChange('select-all')"
        @row-unselect-all="tissueRowChange('unselect-all')">
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
  <div v-else class="text-center font-semibold text-lg">
    Warning: No datasets in filtered selection.  Clear filters to regain datasets for selection.
  </div>
  <div id="fetch-datasets" class="mx-auto my-5 text-center">
    <Button label="Fetch Datasets" class="p-button-lg" @click="fetchDatasets"/>
  </div>
  

  <div id="selected-metadata-view" v-if="this.fetched">
    <div id="genes-view" class="mx-auto my-3 w-3/4" >
      <div class="font-semibold m-2">Genes</div>
      <div v-show="this.loadingGenes">
        <ProgressBar mode="indeterminate" />
      </div>
      <span class="p-fluid" v-show="!this.loadingGenes">
        <AutoComplete :multiple="true" v-model="this.genesSelected" 
        :suggestions="this.genesFiltered" @complete="searchGenes($event)" field="name" />
      </span>
    </div>
    <div id="graphs-view">
      <div class="card w-3/4 mx-auto mt-2">
        <TabMenu :model="items"/>
        <router-view :genes="this.genesSelected"/>
      </div>
    </div>

  </div>
 


</div>

</template>

<script>
// TODO: Fix Experiment # Count alignment CSS
import ProgressBar from 'primevue/progressbar';
import AutoComplete from "primevue/autocomplete"
import TabMenu from 'primevue/tabmenu'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chip from 'primevue/chip'

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
    Chip,

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
      selected_metadata: null,
      lookup_table: null,
      filterWarning: false,
      fetched: false,

      columns: null,
      categories: ['species', 'experiment', 'tissue'],

      speciesList: [], //["Mouse", "Human", "Baboon"],
      speciesFiltered: [], // [{name: Mouse}, {name:Human}]
      speciesSelected: [],
      speciesSelectedFilters: [],

      experimentList: [], //["Mouse_TRF_2018", "Mouse_TRF_2019", "Baboon_TRF_2020", "Human_ABC_2020"],
      experimentFiltered: [],
      experimentSelected: [],
      experimentSelectedFilters: [],

      tissueList: [], //["Liver", "Muscle", "Adipose", "Heart", "Neuron"],
      tissueFiltered: [],     
      tissueSelected: [],
      tissueSelectedFilters: [],

      genes: [],
      genesFiltered: [],
      genesSelected: [],

    }
  },
  computed: {
    speciesOnlySelected() {
      return (this.speciesSelected.length 
        && !this.experimentSelected.length && !this.tissueSelected.length)
    },
    experimentOnlySelected() {
      return (!this.speciesSelected.length 
        && this.experimentSelected.length && !this.tissueSelected.length)
    },
    tissueOnlySelected() {
      return (!this.speciesSelected.length 
        && !this.experimentSelected.length && this.tissueSelected.length)
    }

  },
  created() {
    console.log('Main created')

    this.columns = [
      {field:'name', header:''},
      {field:'count', header:'#'},
      {field:'freq', header:'Freq'}
    ]

    this.speciesList = this.buildList(this.speciesList)
    this.speciesFiltered = this.speciesList
    
    this.experimentList = this.buildList(this.experimentList)
    this.experimentFiltered = this.experimentList

    this.tissueList = this.buildList(this.tissueList)
    this.tissueFiltered = this.tissueList

    this.genesSelected = this.buildList(this.genesSelected)

    // Not necessary to immediately display a visualization
    // this.$router.push('/main/bar')
  },
  async mounted() {
    // Populate array with all genes
    console.log('Main mounted, await genes: ')
    const start = Date.now()

    await Promise.all([
      this.loadMetadata(), 
      // this.loadGenes()
    ])

    // this.loadMetadata()
    // this.loadGenes()
    
    console.log('Main mount finished')
    console.log('Time elapsed')
    console.log(Date.now() - start)
  },
  methods: {
    async fetchDatasets() {
      console.log('fetchDatasets')
      const start = Date.now()
      // console.log(this.filtered_metadata)
      // this.getSelectedDatasets()
      console.log(this.selected_metadata)
      let gene_metadata_tables = []
      let sample_metadata_tables = []
      let gene_expression_data_tables = []
      this.selected_metadata.forEach((e) => {
        // Build list of gene_metadata_tables
        console.log(e)
        gene_metadata_tables.push(e.gene_metadata_table_name)
        sample_metadata_tables.push(e.sample_metadata_table_name)
        gene_expression_data_tables.push(e.gene_expression_data_table_name)
      })

      await Promise.all([
        this.fetchGeneMetadataTables(gene_metadata_tables), 
        // this.loadGenes()
      ])

      // this.genes = await DataService.getGenes()
      // this.genes = this.genes.data.map((d) => ({name: d.gene_name}))
      // this.loadingGenes = false
      // this.datasets = await DataService.getDatasets
      this.fetched = true
      console.log('fetchDatasets time elapsed: ')
      console.log(Date.now() - start)
    },
    
    async fetchGeneMetadataTables(tables) {
      console.log('fetchGeneMetadataTables')
      const results = await Promise.all(tables.map(async (t) => {
        const result = await DataService.getGenes(t)
        console.log('table: ', t)
        
        console.log(result)
        let data = result.data.map(d => d.gene_name)
        console.log(data)
        return data
      }))

      let uniqGenes = [...new Set(...results)]
      console.log(uniqGenes) 
      this.genes = this.buildList(uniqGenes)

      this.loadingGenes = false
      return results
    },
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
      // this.db_metadata = await DataService.getDatabaseMetadata().then(e => e.data)
      this.db_metadata = await DataService.getDatasetsMetadata().then(e => e.data)
      this.lookup_table = this.initializeLookupTable(this.db_metadata)
      this.filtered_metadata = this.db_metadata
      this.selected_metadata = []

      this.speciesList = this.buildList([...new Set(this.db_metadata.map(item => item.species))])
      this.speciesFiltered = this.speciesList

      this.experimentList = this.buildList([...new Set(this.db_metadata.map(item => item.experiment))])
      this.experimentFiltered = this.experimentList

      this.tissueList = this.buildList([...new Set(this.db_metadata.map(item => item.tissue))])
      this.tissueFiltered = this.tissueList

      this.loading = false
      console.log('loadMetadata time elapsed:')
      console.log(Date.now() - start)
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
      // Converts array of strings to array of objects with name properties of strings
      return list.map(object => {
        return {'name' : object}
    })},
    removeSpeciesFilter(text) {
      // console.log('removeSpeciesFilter')
      this.speciesSelected = this.speciesSelected.filter((obj) => 
         obj.name != text
      );
      let reset = false
      if (!this.speciesSelected.length) reset = true
      this.updateLookupTable('species', reset)
    },
    removeExperimentFilter(text) {
      // console.log('removeExperimentsFilter')
      this.experimentSelected = this.experimentSelected.filter((obj) => 
         obj.name != text
      );
      let reset = false
      if (!this.experimentSelected.length) reset = true
      this.updateLookupTable('experiment', reset)
    },
    removeTissueFilter(text) {
      // console.log('removeTissuesFilter')
      this.tissueSelected = this.tissueSelected.filter((obj) => 
         obj.name != text
      );
      let reset = false
      if (!this.tissueSelected.length) reset = true
      this.updateLookupTable('tissue', reset)
    },
    clearAllFilters() {
      // console.log('clearAllFilters')
      this.speciesSelected = []
      this.experimentSelected = []
      this.tissueSelected = []
      this.updateLookupTable('', true)
    },
    initializeLookupTable(metadata) {
      console.log('initializeLookupTable')
      const table = {}
      this.categories.forEach((cat) => {
        // species, experiment, tissue
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
    updateLookupTable(origin, reset) {
      // console.log('===========')
      // console.log('updateLookupTable', origin, reset)

      // Inputs are arrays of strings
      // If array is empty then no filter is performed
      const speciesSelectedNames = this.speciesSelected.map(el => el.name)
      const experimentSelectedNames = this.experimentSelected.map(el => el.name)
      const tissueSelectedNames = this.tissueSelected.map(el => el.name)

      // Array of full dataset objects, to be filtered down, then intersected (ANDs of ORs)
      let speciesResult = this.db_metadata
      let experimentsResult = this.db_metadata
      let tissuesResult = this.db_metadata

      // Check if there are any filters selected, then filter down from full array of dataset metadata
      if (speciesSelectedNames.length)
        speciesResult = this.db_metadata.filter(
          ({ species }) => speciesSelectedNames.some(
            (s) => species.toLowerCase().includes(s.toLowerCase())))

      if (experimentSelectedNames.length) 
        experimentsResult = this.db_metadata.filter(
          ({ experiment }) => experimentSelectedNames.some(
            (s) => experiment.toLowerCase().includes(s.toLowerCase())))

      if (tissueSelectedNames.length)
        tissuesResult = this.db_metadata.filter(
          ({ tissue }) => tissueSelectedNames.some(
            (s) => tissue.toLowerCase().includes(s.toLowerCase())))

      // If any filters were selected, one of the result arrays will be smaller than db_metadata 
      // The intersection of results will be used to display remaining possible datasets to select
      let intersection = speciesResult.filter(value => experimentsResult.includes(value));
      intersection = intersection.filter(value => tissuesResult.includes(value));
      this.filtered_metadata = intersection

      // Assign selected_metadata to intersection if there is at least one selection
      this.selected_metadata = []
      if (speciesSelectedNames.length || experimentSelectedNames.length || tissueSelectedNames.length )
        this.selected_metadata = intersection

      // console.log('intersection')
      // console.log(intersection)
      // If no datasets in intersection, show warning
      this.filterWarning = intersection.length == 0

      // If not called from species change, update possible selections  
      // If called from species change, and reset is true
      // Reset is true if there are now 0 filters selected, should show all possible choices
      if (origin != 'species' || (origin == 'species' && reset))
        // List of unique values 
        this.speciesFiltered = this.buildList([...new Set(intersection.map(item => item.species))])
      if (this.speciesOnlySelected)
        this.speciesFiltered = this.buildList([...new Set(this.db_metadata.map(item => item.species))])

      if (origin != 'experiment' || (origin == 'experiment' && reset))
        this.experimentFiltered = this.buildList([...new Set(intersection.map(item => item.experiment))])
      if (this.experimentOnlySelected)
        this.experimentFiltered = this.buildList([...new Set(this.db_metadata.map(item => item.experiment))])

      if (origin != 'tissue' || (origin == 'tissue' && reset))
        this.tissueFiltered = this.buildList([...new Set(intersection.map(item => item.tissue))])
      if (this.tissueOnlySelected)
        this.tissueFiltered = this.buildList([...new Set(this.db_metadata.map(item => item.tissue))])

      this.categories.forEach((cat) => {
        // cat = species, experiment, tissue
        let uniqVal = [...new Set(intersection.map(item => item[cat]))]
        // If called by current category and not resetting 
        //  then only use the older, not updated filtered list 
        //  Solves frequency count bug.  
        let onlySelected = cat + 'OnlySelected'
        let dataset = intersection

        if (cat == origin && !reset) {
          // console.log('cat == ', origin, reset)
          let filterIdentifier = cat + 'Filtered'
          uniqVal = this[filterIdentifier]
        }
        if (this[onlySelected] && reset) {
          // console.log('only..')
          // console.log(onlySelected )
          uniqVal = [...new Set(this.db_metadata.map(item => item[cat]))]
          // console.log(uniqVal)
          dataset = this.db_metadata
        }

        let sum = 0
        uniqVal.forEach((val) => {
          // Mouse, TRF_2020, Liver, etc. 
          this.lookup_table[cat][val] = {}
          this.lookup_table[cat][val].count = dataset
            .reduce((acc, cur) => cur[cat] === val ? ++acc : acc, 0)
          sum += this.lookup_table[cat][val].count
        })
        uniqVal.forEach((val) => {
          this.lookup_table[cat][val].freq = this.lookup_table[cat][val].count / sum
        })
        // console.log(this.lookup_table)
      })
      // console.log('===========')
    },
    speciesRowChange(text) {
      // console.log('----------------')
      // console.log('speciesRowChange')
      // console.log(text)
      // console.log(this.speciesFiltered)
      let reset = this.speciesSelected.length == 0

      if (text == 'unselect-all') {
        this.speciesSelected = []
        reset = true
      } else if (text == 'select-all') {
        this.speciesSelected = this.speciesFiltered
        reset = false
      }
      // console.log('----------------')
      this.updateLookupTable('species', reset)
    },

    experimentRowChange(text) {
      // console.log('----------------')
      // console.log('experimentRowChange')
      // console.log(text)
      // console.log('this.experimentSelected')
      // console.log(this.experimentSelected)
      let reset = this.experimentSelected.length == 0
      if (text == 'unselect-all') {
        this.experimentSelected = []
        reset = true
      } else if (text == 'select-all') {
        this.experimentSelected = this.experimentFiltered
        reset = false
      }
      // console.log('----------------')
      this.updateLookupTable('experiment', reset)

    },
    tissueRowChange(text) {
      // console.log('----------------')
      // console.log('tissueRowChange')
      // console.log(this.tissueSelected)
      let reset = this.tissueSelected.length == 0
      if (text == 'unselect-all') {
        this.tissueSelected = []
        reset = true
      } else if (text == 'select-all') {
        this.tissueSelected = this.tissueFiltered
        reset = false
      }
      this.updateLookupTable('tissue', reset)
      // console.log('----------------')
    },
    filterResults() {
      // Inputs are arrays of strings
      // If array is empty then no filter is performed
      const speciesSelectedNames = this.speciesSelected.map(el => el.name)
      const experimentSelectedNames = this.experimentSelected.map(el => el.name)
      const tissueSelectedNames = this.tissueSelected.map(el => el.name)

      // let result = this.db_metadata
      let speciesResult = this.db_metadata
      let experimentsResult = this.db_metadata
      let tissuesResult = this.db_metadata

      if (speciesSelectedNames.length)
        speciesResult = this.db_metadata.filter(
          ({ species }) => speciesSelectedNames.some(
            (s) => species.toLowerCase().includes(s.toLowerCase())))

      if (experimentSelectedNames.length) 
        experimentsResult = this.db_metadata.filter(
          ({ experiment }) => experimentSelectedNames.some(
            (s) => experiment.toLowerCase().includes(s.toLowerCase())))

      if (tissueSelectedNames.length)
        tissuesResult = this.db_metadata.filter(
          ({ tissue }) => tissueSelectedNames.some(
            (s) => tissue.toLowerCase().includes(s.toLowerCase())))

      // console.log('speciesResult')
      // console.log(speciesResult)
      // console.log('experimentsResult')
      // console.log(experimentsResult)
      // console.log('tissuesResult')
      // console.log(tissuesResult)

      let intersection = speciesResult.filter(value => experimentsResult.includes(value));
      intersection = intersection.filter(value => tissuesResult.includes(value));
      console.log('intersection')
      console.log(intersection)

      return intersection
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

<style lang="scss" scoped>
.p-chip.custom-chip {
  // 78, 128, 238
    background: rgb(78,128,238);
    color: #ffffff;
}

</style>