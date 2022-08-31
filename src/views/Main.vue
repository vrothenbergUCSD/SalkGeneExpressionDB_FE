<template>
<div id="main" class="w-full p-3 mx-auto">
  
  <div id="selection-ui" class="w-11/12 p-3 mx-auto">
    <Toast />
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

    <div id="get-datasets" class="mx-auto my-5 text-center" >
      <Button label="Get Datasets" class="p-button-lg" @click="getDatasets" v-if="!this.gettingDatasets"/>
      <ProgressSpinner class="mx-auto w-1/2" v-else/>
    </div>

    <div id="selected-metadata-view" class="mx-auto" v-if="this.gotDatasets">
      <div id="genes-view" class="my-3 w-3/4 mx-auto" >
        <div class="font-semibold m-2">Genes</div>
        <div v-if="this.loadingGenes">
          <ProgressBar mode="indeterminate" />
        </div>
        <div class="flex flex-row" v-else>
          <div class="p-fluid w-3/4" v-show="!this.loadingGenes">
            <AutoComplete :multiple="true" v-model="this.genesSelected" 
            :suggestions="this.genesFiltered" @complete="searchGenes($event)" field="name" />
          </div>
          <div class="flex align-items-center">
            <Button label="Get Gene Data" class="ml-3" @click="getGeneData" :loading="this.gettingGeneData"/>
          </div>
        </div>
        
      </div>

      

    </div>

  </div>
  <div id="graphs-view" v-show="this.gotDatasets && this.gotGeneData">
    <div class="card mt-2">
      <div class="mx-auto w-3/4">
        <TabMenu :model="items" v-model:activeIndex="index"/>
        <!-- <TabMenu :model="items"/> -->
      </div>
      <div v-if="index != null" class="mx-auto w-11/12">
        <!-- <KeepAlive > -->
          <component :is="items[index].currentComponent" :genes="this.genesSelected" :datasets="this.datasets"/>
        <!-- </KeepAlive> -->
      </div>
    </div>
  </div>
  
</div>

</template>

<script>
import Toast from 'primevue/toast'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import AutoComplete from "primevue/autocomplete"
import TabMenu from 'primevue/tabmenu'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chip from 'primevue/chip'

// Needed?
import Selection from "@/components/Selection.vue"
import Prime from "@/components/Prime.vue"

import BarPlot from "@/components/svg/BarPlot.vue"
import LinePlot from "@/components/svg/LinePlot.vue"

import DataService from "@/services/DataService.js"

export default {
  name: "Main",
  components: {
    Toast,
    ProgressBar,
    ProgressSpinner,
    AutoComplete,
    TabMenu,
    Button,
    DataTable,
    Column,
    Chip,
    Selection,
    Prime,

    BarPlot,
    LinePlot,
    
},
  DataService: null,
  data() {
    return {
      items: [
        {
          label: 'Bar',
          icon: 'pi pi-fw pi-chart-bar',
          currentComponent: 'BarPlot',
          // to: '/main/bar',
        },
        {
          label: 'Line',
          icon: 'pi pi-fw pi-chart-line',
          currentComponent: 'LinePlot',
          // to: '/main/line',
        }
      ],
      loading: true,
      loadingGenes: true,
      gotDatasets: false,
      gettingDatasets: false,
      gotGeneData: false,
      gettingGeneData: false, 
      filterWarning: false,

      db_metadata: null,
      filtered_metadata: null,
      selected_metadata: null,
      lookup_table: null,
      
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

      genes: [], // [{name:'Alb'},...]
      genesFiltered: [],
      genesSelected: [],

      gene_metadata_table_names: [],
      sample_metadata_table_names: [],
      gene_expression_data_table_names: [],

      gene_metadata_tables: [],
      selected_gene_metadata: [],
      sample_metadata_tables: [],
      gene_expression_data_tables: [],

      datasets: null,
      index: null,
      currentComponent: null,
      
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
    },
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

  },
  async mounted() {
    // Populate array with all genes
    console.log('Main mounted, await datasets metadata: ')
    const start = Date.now()

    // Concurrent await
    await Promise.all([
      this.loadMetadata(), 
      // this.loadGenes()
    ])

    // Testing - Remove later
    this.tissueSelected = [{name:'BAT'}, {name:'DG'}]
    this.tissueRowChange('select')
    await this.getDatasets()
    this.genesSelected = [{name:'Alb'}]
    await this.getGeneData()
    this.index = 0


    // // this.$router.push('/main/line')
    
    const elapsed = Date.now() - start
    console.log('Main mounted time elapsed ', elapsed)
  },
  async updated() {
    // console.log('=============')
    // console.log('Main updated')
    // console.log(this.genesSelected)
    // console.log('=============')
  },
  methods: {
    async getDatasets() {
      // console.log('getDatasets')
      const start = Date.now()
      this.gettingDatasets = true
      this.gene_metadata_table_names = []
      this.sample_metadata_table_names = []
      this.gene_expression_data_table_names = []

      if (!this.selected_metadata.length) {
        this.gettingDatasets = false
        this.gotDatasets = false
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'No datasets selected', life: 5000});
        return
      }

      this.selected_metadata.forEach((e) => {
        // Build list of gene_metadata_tables
        this.gene_metadata_table_names.push(e.gene_metadata_table_name)
        this.sample_metadata_table_names.push(e.sample_metadata_table_name)
        this.gene_expression_data_table_names.push(e.gene_expression_data_table_name)
      })

      await Promise.all([
        this.getGeneMetadataTables(this.gene_metadata_table_names), 
        this.getSampleMetadataTables(this.sample_metadata_table_names),
      ])

      // this.genes = await DataService.getGenes()
      // this.genes = this.genes.data.map((d) => ({name: d.gene_name}))
      // this.loadingGenes = false
      // this.datasets = await DataService.getDatasets
      this.gotDatasets = true
      this.gettingDatasets = false

      const elapsed = Date.now() - start
      console.log('getDatasets time elapsed: ', elapsed)
    },
    async getGeneMetadataTables(tables) {
      // console.log('getGeneMetadataTables')
      const start = Date.now()
      this.loadingGenes = true
      const results = await Promise.all(tables.map(async (t) => {
        const result = await DataService.getGenes(t)
        return {
          table: t, 
          data: result.data.map(d => d.gene_name)
        }
      }))
      this.gene_metadata_tables = results
      // results = results.map(e => e.data)

      let uniqGenes = [...new Set(...results.map(e => e.data))]
      // console.log(uniqGenes) 
      this.genes = this.buildList(uniqGenes)
      this.genesFiltered = this.genes
      // console.log(this.genes)

      this.loadingGenes = false
      const elapsed = Date.now() - start
      // console.log('getGeneMetadataTables time elapsed: ', elapsed)
      return results
    },
    async getSampleMetadataTables(tables) {
      // console.log('getSampleMetadataTables')
      const start = Date.now()
      const results = await Promise.all(tables.map(async (t) => {
        const result = await DataService.getSampleMetadata(t)
        // console.log('table: ', t)
        
        // console.log(result)
        // let data = result.data.map(d => d.gene_name)
        // console.log(data)
        return {
          table: t,
          data: result.data 
        }
      }))

      this.sample_metadata_tables = results

      const elapsed = Date.now() - start
      // console.log('getSampleMetadataTables time elapsed: ', elapsed)
      return results
    },
    async getGeneExpressionDataTables(genes, tables) {
      // console.log('getGeneExpressionDataTables')
      const start = Date.now()
      // console.log(genes)
      let genesStr = genes.map((d) => d.name).toString()
      // console.log('genesStr')
      // console.log(genesStr)
      
      const results = await Promise.all(tables.map(async (t) => {
        // const result = []
        // if (this.gene_expression_data_tables)
        // console.log('table: ', t)
        // if (this.gene_expression_data_tables)

        const result = await DataService.getExpressionDataByGenes(genesStr, t)
        
        // console.log(result)
        // let data = result.data.map(d => d.gene_name)
        // console.log(data)
        return {
          table_name: t,
          data: result.data
        }
      }))

      this.gene_expression_data_tables = results
      // console.log('gene_expression_data_tables')
      // console.log(this.gene_expression_data_tables)

      const elapsed = Date.now() - start
      // console.log('getGeneExpressionDataTables time elapsed: ', elapsed)

      return results
    },
    async getSelectedGeneMetadata(genes, tables) {
      // console.log('getSelectedGeneMetadata')
      const start = Date.now()
      let genesStr = genes.map((d) => d.name).toString()
      const results = await Promise.all(tables.map(async (t) => {
        const result = await DataService.getGeneMetadata(genesStr, t)     
        return {
          table_name: t,
          data: result.data
        }
      }))
      this.selected_gene_metadata = results

      const elapsed = Date.now() - start
      // console.log('getSelectedGeneMetadata time elapsed: ', elapsed)

      return results
    },
    async getGeneData() {
      // console.log('getGeneData')
      const start = Date.now()
      this.gettingGeneData = true
      if (!this.genesSelected.length) {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'No genes selected', life: 5000});
        this.gotGeneData = false
        this.gettingGeneData = false
        return
      }
      await Promise.all([
        this.getGeneExpressionDataTables(this.genesSelected, this.gene_expression_data_table_names),
        this.getSelectedGeneMetadata(this.genesSelected, this.gene_metadata_table_names)
      ])
      // await this.getGeneExpressionDataTables(this.genesSelected, this.gene_expression_data_table_names)
      this.datasets = {
        // gene_metadata_tables: this.gene_metadata_tables,
        sample_metadata_tables: this.sample_metadata_tables,
        gene_expression_data_tables: this.gene_expression_data_tables,
        gene_metadata: this.selected_gene_metadata,
      }
      this.gotGeneData = true
      this.gettingGeneData = false
      const elapsed = Date.now() - start
      console.log('getGeneData time elapsed ', elapsed)
    },
    async loadGenes() {
      // Defunct?
      const start = Date.now()
      this.genes = await DataService.getGenes()
      this.genes = this.genes.data.map((d) => ({name: d.gene_name}))
      this.loadingGenes = false
      const elapsed = Date.now() - start
      // console.log('loadGenes time elapsed: ', elapsed)
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
      const elapsed = Date.now() - start
      // console.log('loadMetadata time elapsed: ', elapsed)
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
      // console.log('initializeLookupTable')
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
      // Defunct? 
      //
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
      // console.log('intersection')
      // console.log(intersection)

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