<template>
<div id="main" class="w-full p-3 mx-auto mb-20">
  <div id="page-title" class="pb-2 font-semibold text-3xl text-center">
    Temporal Gene Expression
  </div>
  
  <div id="selection-ui" class="mt-2 mx-auto">
    <Toast />
    <div id="current-filters-ui" class="my-1 mx-3 bg-slate-100 rounded-2xl min-w-[24rem] flex flex-wrap" 
      v-if="this.species_selected.length || this.experiment_selected.length || this.tissue_selected.length"> 
      <div id="filters-species" v-if="this.species_selected.length"
        class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
        <div class="font-semibold text-sm pl-1">Species:</div>
        <div v-for="(item, index) in this.species_selected" :key="item">
          <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable 
          @remove="remove_species_filter(item.name)"/>
          <span class="px-1 font-semibold" v-if="index < this.species_selected.length-1">or</span>
        </div>
      </div>
      <div id="filters-experiment" v-if="this.experiment_selected.length"
      class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3" >
        <div class="font-semibold text-sm pl-1">Experiments:</div>
        <div v-for="(item, index) in this.experiment_selected" :key="item" class="my-1">
          <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable 
            @remove="remove_experiment_filter(item.name)"/>
          <span class="px-1 font-semibold text-sm" v-if="index < this.experiment_selected.length-1">or</span>
        </div>
      </div>
      <div id="filters-tissue" v-if="this.tissue_selected.length" 
        class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
        <div class="font-semibold text-sm pl-1">Tissues:</div>
        <div v-for="(item, index) in this.tissue_selected" :key="item">
          <!-- content -->
          <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable 
            @remove="remove_tissue_filter(item.name)"/>
          <span class="px-1 font-semibold text-sm" v-if="index < this.tissue_selected.length-1">or</span>
        </div>
      </div>
      <div id="filters-gender" v-if="this.gender_selected.length" 
        class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
        <div class="font-semibold text-sm pl-1">Genders:</div>
        <div v-for="(item, index) in this.gender_selected" :key="item">
          <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable 
            @remove="remove_gender_filter(item.name)"/>
          <span class="px-1 font-semibold text-sm" v-if="index < this.gender_selected.length-1">or</span>
        </div>
      </div>
      <div id="filters-condition" v-if="this.condition_selected.length" 
        class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
        <div class="font-semibold text-sm pl-1">conditions:</div>
        <div v-for="(item, index) in this.condition_selected" :key="item">
          <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable 
            @remove="remove_condition_filter(item.name)"/>
          <span class="px-1 font-semibold text-sm" v-if="index < this.condition_selected.length-1">or</span>
        </div>
      </div>
      <div id="clear-filters" class="my-2 flex flex-wrap align-items-center mx-3">
        <Chip label="Clear All Filters" class="mx-1 text-sm font-semibold" 
          removable @remove="clear_all_filters"/>
      </div>
    </div>
    <div id="filters-graph-view" class="flex pl-3">
      <div id="filters-boxes" class="w-1/4 mt-2 min-w-[20rem]">
        
        <Accordion :multiple="true" :activeIndex="[0,1,2]">
          <AccordionTab header="Filters">
            <div v-if="!this.datasets_filter_warning">
              <div class="font-semibold mb-1 text-sm">
                Datasets
              </div>
              <div class="p-1 border my-1 rounded">
                <DataTable :value="this.species_filtered" v-model:selection="this.species_selected" 
                  class="p-datatable-sm p-datatable-species" stripedRows :scrollable="true" scrollHeight="200px" 
                  :loading="loading" @row-select="update_lookup_table()" 
                  @row-unselect="update_lookup_table()"
                  @row-select-all="update_lookup_table()"
                  @row-unselect-all="update_lookup_table()">
                <Column selectionMode="multiple" headerStyle="max-width: 2rem" style="max-width: 2rem"></Column>
                <Column field="name" header="Species"></Column>
                <Column field="count" header="#" headerStyle="max-width: 3rem" style="max-width: 3rem">
                  <template #body="slotProps">
                    {{get_count('species', slotProps.data.name)}}
                  </template>
                </Column>
                <Column field="freq" header="Freq" headerStyle="max-width: 4.5rem" style="max-width: 4.5rem">
                  <template #body="slotProps">
                    {{get_freq('species', slotProps.data.name)}}
                  </template>
                </Column>
                </DataTable>
              </div>
              <div class="p-1 border my-1 rounded" >
                <DataTable :value="experiment_filtered" v-model:selection="experiment_selected" 
                  class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
                  :loading="loading" @row-select="update_lookup_table"
                  @row-unselect="update_lookup_table"
                  @row-select-all="update_lookup_table"
                  @row-unselect-all="update_lookup_table">
                <Column selectionMode="multiple" headerStyle="max-width: 2rem" style="max-width: 2rem"></Column>
                <Column field="name" header="Experiment"></Column>
                <Column field="count" header="#" headerStyle="max-width: 3rem" style="max-width: 3rem">
                  <template #body="slotProps">
                    {{get_count('experiment', slotProps.data.name)}}
                  </template>
                </Column>
                <Column field="freq" header="Freq" headerStyle="max-width: 4.5rem" style="max-width: 4.5rem">
                  <template #body="slotProps">
                    {{get_freq('experiment', slotProps.data.name)}}
                  </template>
                </Column>
                </DataTable>
            
              </div>
              <div class="p-1 border my-1 rounded">
                <DataTable :value="tissue_filtered" v-model:selection="tissue_selected" 
                  class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
                  :loading="loading" @row-select="update_lookup_table" 
                  @row-unselect="update_lookup_table"
                  @row-select-all="update_lookup_table"
                  @row-unselect-all="update_lookup_table">
                <Column selectionMode="multiple" headerStyle="max-width: 2rem" style="max-width: 2rem"></Column>
                <Column field="name" header="Tissue" style="text-align:left"></Column>
                <Column field="count" header="#" headerStyle="max-width: 3rem" style="max-width: 3rem">
                  <template #body="slotProps">
                    {{get_count('tissue', slotProps.data.name)}}
                  </template>
                </Column>
                <Column field="freq" header="Freq" headerStyle="max-width: 4.5rem" style="max-width: 4.5rem">
                  <template #body="slotProps">
                    {{get_freq('tissue', slotProps.data.name)}}
                  </template>
                </Column>
                </DataTable>
                
              </div>
              <div class="font-semibold my-1 text-sm">
                Samples
              </div>
              <div class="p-1 border my-1 rounded">
                <DataTable :value="gender_filtered" v-model:selection="this.gender_selected" 
                  class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
                  :loading="loading" @row-select="update_lookup_table" 
                  @row-unselect="update_lookup_table"
                  @row-select-all="update_lookup_table"
                  @row-unselect-all="update_lookup_table">
                <Column selectionMode="multiple" headerStyle="max-width: 2rem" style="max-width: 2rem"></Column>
                <Column field="name" header="Gender" style="text-align:left"></Column>
                <Column field="count" header="#" headerStyle="max-width: 3rem" style="max-width: 3rem">
                  <template #body="slotProps">
                    {{get_count('gender', slotProps.data.name)}}
                  </template>
                </Column>
                <Column field="freq" header="Freq" headerStyle="max-width: 4.5rem" style="max-width: 4.5rem">
                  <template #body="slotProps">
                    {{get_freq('gender', slotProps.data.name)}}
                  </template>
                </Column>
                </DataTable>
              </div>
              <div class="p-1 border my-1 rounded">
                <DataTable :value="condition_filtered" v-model:selection="this.condition_selected" 
                  class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" 
                  :loading="loading" @row-select="update_lookup_table" 
                  @row-unselect="update_lookup_table"
                  @row-select-all="update_lookup_table"
                  @row-unselect-all="update_lookup_table">
                <Column selectionMode="multiple" headerStyle="max-width: 2rem" style="max-width: 2rem"></Column>
                <Column field="name" header="Condition" style="text-align:left"></Column>
                <Column field="count" header="#" headerStyle="max-width: 3rem" style="max-width: 3rem">
                  <template #body="slotProps">
                    {{get_count('condition', slotProps.data.name)}}
                  </template>
                </Column>
                <Column field="freq" header="Freq" headerStyle="max-width: 4.5rem" style="max-width: 4.5rem">
                  <template #body="slotProps">
                    {{get_freq('condition', slotProps.data.name)}}
                  </template>
                </Column>
                </DataTable>
              </div>

              <div id="get-datasets" class="mt-1 text-center">
                <Button label="Get Datasets" @click="get_datasets" :loading="this.getting_datasets"/>
              </div>
            </div>
            <div v-else class="text-center font-semibold text-lg">
              Warning: No datasets in filtered selection.  Clear filters to regain datasets for selection.
            </div>
          </AccordionTab>
          <AccordionTab header="Genes">
            <div id="genes-view" class="" v-show="this.got_datasets">
              <div class="font-semibold text-sm my-1">Select Genes:</div>
              <div v-show="this.loading_genes" class="">
                <ProgressBar mode="indeterminate" />
              </div>
              <div id="gene-search" class="p-1" v-show="!this.loading_genes">
                <AutoComplete :multiple="true" v-model="this.genes_selected" 
                :suggestions="this.genes_filtered" @complete="search_genes($event)" field="name" />
              </div>  
              <div id="get-genes" class="mt-1 text-center">
                  <Button label="Update Chart" @click="get_gene_data" :loading="this.getting_gene_data || this.loading_genes"/>
                </div>
            </div>
            <div v-show="!this.got_datasets">
              <div v-show="this.getting_datasets">
              Loading... please wait.
              </div>
              <div v-show="!this.getting_datasets">
              Please first select at least one dataset.
              </div>
            </div>
          </AccordionTab>
        </Accordion>
      </div>
      <div id="graphs-view" class="w-3/4 h-1/2 min-w-[50rem]">
        <div v-if="this.got_datasets && this.got_gene_data">
          <div class="card mt-1">
            <div class="mx-auto w-3/4">
              <TabMenu :model="items" v-model:activeIndex="index"/>
            </div>
            <div v-if="index != null" class="mx-auto px-3 ">
              <component :is="items[index].current_component" :genes="this.genes_selected" :datasets="this.datasets"/>
            </div>
          </div>
        </div>
        <div v-else class="flex h-[50vh]">
          <ProgressSpinner v-show="!(this.got_datasets && this.got_gene_data)" class="m-auto"/>
        </div>
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
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'

import _ from 'underscore'

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
    Accordion,
    AccordionTab,

    BarPlot,
    LinePlot,
    
},
  DataService: null,
  data() {
    return {
      items: [
        {
          label: 'Histogram',
          icon: 'pi pi-fw pi-chart-bar',
          current_component: 'BarPlot',
        },
        {
          label: 'Line',
          icon: 'pi pi-fw pi-chart-line',
          current_component: 'LinePlot',
        }
      ],
      loading: true,
      loading_genes: true,
      got_datasets: false,
      getting_datasets: false,
      got_gene_data: false,
      getting_gene_data: false, 
      datasets_filter_warning: false,
      filter_warning: false,

      db_metadata: null,
      selected_metadata: null,
      lookup_table: {},
      
      dataset_categories: ['species', 'experiment', 'tissue'],
      sample_categories: ['gender', 'condition'],

      species_list: [], //["Mouse", "Human", "Baboon"],
      species_filtered: [], // [{name: Mouse}, {name:Human}]
      species_selected: [],
      species_result: null,

      experiment_list: [], //["Mouse_TRF_2018", "Mouse_TRF_2019", "Baboon_TRF_2020", "Human_ABC_2020"],
      experiment_filtered: [],
      experiment_selected: [],
      experiment_result: null,

      tissue_list: [], //["Liver", "Muscle", "Adipose", "Heart", "Neuron"],
      tissue_filtered: [],     
      tissue_selected: [],
      tissue_result: null,

      genes: [], // [{name:'Alb'},...]
      genes_filtered: [],
      genes_selected: [],
      genes_results: null,

      gender: [],
      gender_filtered: [],
      gender_selected: [],
      gender_result: null,

      condition: [],
      condition_filtered: [],
      condition_selected: [], 
      condition_result: null,

      gene_metadata_table_names: [],
      sample_metadata_table_names: [],
      gene_expression_data_table_names: [],

      gene_metadata_tables: [],
      selected_gene_metadata: [],
      sample_metadata_tables: [],
      gene_expression_data_tables: [],

      datasets: null,
      index: null,
      current_component: null,
    }
  },
  async mounted() {
    // Populate array with all genes
    console.log('Main mounted, await datasets metadata: ')
    const start = Date.now()

    // Initialize lookup_table
    this.dataset_categories.forEach(e => this.lookup_table[e] = {})
    this.sample_categories.forEach(e => this.lookup_table[e] = {})

    // Concurrent await
    await Promise.all([
      this.load_metadata(),
    ])

    // Testing - Remove later
    this.tissue_selected = [{name:'Arcuate'}]
    this.genes_selected = [{name:'Clock'}]
    await this.update_lookup_table()
    await this.get_datasets()

    // Line chart at index 1
    this.index = 0
    
    const elapsed = Date.now() - start
    console.log('Main mounted time elapsed ', elapsed)
  },
  methods: {
    async load_metadata() {
      console.log('load_metadata')
      const start = Date.now()
      this.db_metadata = await DataService.getDatasetsMetadata().then(e => e.data)
      // Parse gender and condition fields
      this.db_metadata.forEach(e => {
        const genderStr = e.gender.replaceAll(/[']+/g, '"')
        e.gender = JSON.parse(genderStr)

        const conditionStr = e.condition.replaceAll(/[']+/g, '"')
        e.condition = JSON.parse(conditionStr)
      })

      this.species_list = this.build_list([...new Set(this.db_metadata.map(item => item.species))])
      this.species_filtered = this.species_list
      console.log('this.species_filtered')
      console.log(this.species_filtered)

      this.experiment_list = this.build_list([...new Set(this.db_metadata.map(item => item.experiment))])
      this.experiment_filtered = this.experiment_list

      this.tissue_list = this.build_list([...new Set(this.db_metadata.map(item => item.tissue))])
      this.tissue_filtered = this.tissue_list

      this.gender_list = this.build_list([...new Set(this.db_metadata.map(item => 
        [...new Set(item.gender.map(g => g.gender))]
        ).flat())])
      this.gender_filtered = this.gender_list
      
      this.condition_list = this.build_list([...new Set(this.db_metadata.map(item =>
        [...new Set(item.condition.map(c => c.condition))]
        ).flat())])
      this.condition_filtered = this.condition_list

      this.loading = false
      const elapsed = Date.now() - start 
      console.log('load_metadata time elapsed: ', elapsed)
    },
    async get_datasets() {
      console.log('get_datasets')
      const start = Date.now()
      this.getting_datasets = true
      this.gene_metadata_table_names = []
      this.sample_metadata_table_names = []
      this.gene_expression_data_table_names = []

      if (!this.selected_metadata.length) {
        this.getting_datasets = false
        this.got_datasets = false
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
        this.get_gene_metadata_tables(this.gene_metadata_table_names), 
        this.get_sample_metadata_tables(this.sample_metadata_table_names),
      ])

      this.got_datasets = true
      this.getting_datasets = false

      if (this.genes_selected.length)
        // If user has at least one selected genes call get_gene_data 
        // Updates chart with selected gene data for corresponding datasets
        this.get_gene_data()

      const elapsed = Date.now() - start 
      console.log('get_datasets time elapsed: ', elapsed)
    },
    async get_gene_metadata_tables(tables) {
      this.loading_genes = true
      this.gene_metadata_tables = await Promise.all(tables.map(async (t) => {
        const result = await DataService.getGenes(t)
        return {
          table: t, 
          data: result.data.map(d => d.gene_name)
        }
      }))
      this.genes = this.build_list([...new Set(...this.gene_metadata_tables.map(
        e => e.data))])
      this.genes_filtered = this.genes
      this.loading_genes = false
    },
    async get_sample_metadata_tables(tables) {
      this.sample_metadata_tables = await Promise.all(tables.map(async (t) => {
        const result = await DataService.getSampleMetadata(t)
        return {
          table: t,
          data: result.data 
        }
      }))
    },
    async get_gene_expression_data_tables(genes, tables) {
      console.log('get_gene_expression_data_tables')
      let genesStr = genes.map(d => d.name).toString()
      console.log('genesStr', genesStr)
      let gendersStr = this.gender_selected.map(d => d.name).toString()
      console.log('gendersStr', gendersStr)
      let conditionsStr = this.condition_selected.map(d => d.name).toString()
      console.log('conditionsStr', conditionsStr)
      this.gene_expression_data_tables = await Promise.all(tables.map(async (t) => {
        const result = await DataService
          .getExpressionDataByGenesGendersConditions(genesStr, gendersStr, conditionsStr, t)
        // const result = await DataService.getExpressionDataByGenes(genesStr, t)
        console.log('result.data')
        console.log(result.data)
        return {
          table_name: t,
          data: result.data
        }
      }))
    },
    async get_selected_gene_metadata(genes, tables) {
      let genesStr = genes.map((d) => d.name).toString()
      this.selected_gene_metadata = await Promise.all(tables.map(async (t) => {
        const result = await DataService.getGeneMetadata(genesStr, t)     
        return {
          table_name: t,
          data: result.data
        }
      }))
    },
    async get_gene_data() {
      console.log('get_gene_data')
      const start = Date.now()
      this.getting_gene_data = true
      if (!this.genes_selected.length) {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'No genes selected', life: 5000});
        this.got_gene_data = false
        this.getting_gene_data = false
        return
      }
      await Promise.all([
        this.get_gene_expression_data_tables(this.genes_selected, this.gene_expression_data_table_names),
        this.get_selected_gene_metadata(this.genes_selected, this.gene_metadata_table_names)
      ])
      this.datasets = {
        sample_metadata_tables: this.sample_metadata_tables,
        gene_expression_data_tables: this.gene_expression_data_tables,
        gene_metadata: this.selected_gene_metadata,
      }
      this.got_gene_data = true
      this.getting_gene_data = false
      const elapsed = Date.now() - start 
      console.log('get_gene_data time elapsed: ', elapsed)
    },
    async update_lookup_table() {
      console.log('update_lookup_table')
      const start = Date.now()
      // Get each subset of all datasets for each filter grouping, excluding its
      //  own additional filter conditions to prevent prematurely locking in a selection
      this.species_result = this.filter_metadata_except('species')
      this.experiment_result = this.filter_metadata_except('experiment')
      this.tissue_result = this.filter_metadata_except('tissue')
      this.gender_result = this.filter_metadata_except('gender') 
      this.condition_result = this.filter_metadata_except('condition')

      this.species_filtered = this.build_list([...new Set(this.species_result.map(item => item.species))].sort())
      this.experiment_filtered = this.build_list([...new Set(this.experiment_result.map(item => item.experiment))].sort())
      this.tissue_filtered = this.build_list([...new Set(this.tissue_result.map(item => item.tissue))].sort())

      // Get all genders in filtered list then flatten and get unique values
      this.gender_filtered = this.build_list([...new Set(
        this.gender_result.map(item => 
          [...new Set(item.gender.map(m => m.gender))]).flat()  
        )].sort())
      this.condition_filtered = this.build_list([...new Set(
        this.condition_result.map(item => 
          [...new Set(item.condition.map(m => m.condition))]).flat() 
        )].sort())

      this.selected_metadata = _.intersection(
        this.species_result, 
        this.experiment_result,
        this.tissue_result,
        this.gender_result,
        this.condition_result)

      let uniqVal, catResult, dataset, catFiltered, sum

      this.dataset_categories.forEach((cat) => {
        // cat = species, experiment, tissue
        catResult = cat + '_result'
        dataset = this[catResult]
        catFiltered = cat + '_filtered'
        uniqVal = this[catFiltered].map(el => el.name)
        sum = 0
        this.lookup_table[cat] = {}
        uniqVal.forEach((val) => {
          // val = Mouse, TRF_2020, Liver, etc. 
          this.lookup_table[cat][val] = {}
          this.lookup_table[cat][val].count = dataset
            .reduce((acc, cur) => cur[cat] === val ? ++acc : acc, 0)
          sum += this.lookup_table[cat][val].count
        })
        uniqVal.forEach((val) => {
          this.lookup_table[cat][val].freq = this.lookup_table[cat][val].count / sum
        })
      })

      this.sample_categories.forEach((cat) => {
        // cat = gender, condition
        catResult = cat + '_result'
        dataset = this[catResult]
        catFiltered = cat + '_filtered'
        uniqVal = this[catFiltered].map(el => el.name)
        sum = 0
        this.lookup_table[cat] = {}
        uniqVal.forEach(val => {
          // val = Male, Female, etc..
          this.lookup_table[cat][val] = {}
          this.lookup_table[cat][val].count = dataset
            .reduce((acc, cur) => {
              const reduce_result = cur[cat].reduce((a, c) => 
                c[cat] === val ? a + c.count : a, 0)
              return cat in cur ? acc + reduce_result : acc}, 0)
          sum += this.lookup_table[cat][val].count
        })
        uniqVal.forEach((val) => {
          this.lookup_table[cat][val].freq = this.lookup_table[cat][val].count / sum
        })
      })

      // Performs API calls to Database on change to filters
      // await this.get_datasets()

      const elapsed = Date.now() - start 
      console.log('update_lookup_table time elapsed: ', elapsed)
    },
    filter_metadata_except(except_category) {
      // Applies all selection filters for other categories excluding the provided category
      // Allows for selecting more instances of a filter category without prematurely
      //  locking in current filters, preventing adding new selections that are not 
      //  in the intersection, e.g. selecting Heart tissue would filter down all 
      //  datasets to only include those from Heart tissue, preventing selecting Liver, etc.

      let filtered = this.db_metadata
      if (except_category != 'species') {
        const species_selected_names = this.species_selected.map(el => el.name)
        // If no species selected, then skip filtering
        if (species_selected_names.length)
          filtered = filtered.filter(
            ({ species }) => species_selected_names.some(
              (s) => species.toLowerCase().includes(s.toLowerCase())))
      }

      if (except_category != 'experiment') {
        const experiment_selected_names = this.experiment_selected.map(el => el.name)
        if (experiment_selected_names.length)
          filtered = filtered.filter(
            ({ experiment }) => experiment_selected_names.some(
              (s) => experiment.toLowerCase().includes(s.toLowerCase())))
      }

      if (except_category != 'tissue') {
        const tissue_selected_names = this.tissue_selected.map(el => el.name)
        if (tissue_selected_names.length)
          filtered = filtered.filter(
            ({ tissue }) => tissue_selected_names.some(
              (s) => tissue.toLowerCase().includes(s.toLowerCase())))
      }

      if (except_category != 'gender') {
        const gender_selected_names = this.gender_selected.map(el => el.name)
        if (gender_selected_names.length)
          filtered = filtered.filter(
            ({ gender }) => gender_selected_names.some(
              (s) => gender.some((gend) => 
                gend.gender.toLowerCase() == s.toLowerCase())))
      }

      if (except_category != 'condition') {
        const condition_selected_names = this.condition_selected.map(el => el.name)
        if (condition_selected_names.length)
          filtered = filtered.filter(
          ({ condition }) => condition_selected_names.some(
            (s) => condition.some((cond) => 
              cond.condition.toLowerCase() == s.toLowerCase())))
      }

      return filtered
    },
    get_count(cat, value) {
      // cat = 'species' 
      // value = 'Human' 
      if (Object.keys(this.lookup_table[cat]).includes(value)) 
        return this.lookup_table[cat][value].count
      return null
    },
    get_freq(cat, value) {
      if (Object.keys(this.lookup_table[cat]).includes(value))
        return (this.lookup_table[cat][value].freq * 100).toFixed(2) + '%'
      return null
    },
    build_list(list) {
      // Converts array of strings to array of objects with name properties of strings
      return list.map(object => {
        return {'name' : object}
    })},
    remove_species_filter(text) {
      this.species_selected = this.species_selected.filter((obj) => 
         obj.name != text)
      this.update_lookup_table()
    },
    remove_experiment_filter(text) {
      this.experiment_selected = this.experiment_selected.filter((obj) => 
         obj.name != text)
      this.update_lookup_table()
    },
    remove_tissue_filter(text) {
      this.tissue_selected = this.tissue_selected.filter((obj) => 
         obj.name != text)
      this.update_lookup_table()
    },
    remove_gender_filter(text) {
      this.gender_selected = this.gender_selected.filter((obj) => 
         obj.name != text)
      this.update_lookup_table()
    },
    remove_condition_filter(text) {
      this.condition_selected = this.condition_selected.filter((obj) => 
         obj.name != text)
      this.update_lookup_table()
    },
    clear_all_filters() {
      this.species_selected = []
      this.experiment_selected = []
      this.tissue_selected = []
      this.gender_selected = []
      this.condition_selected = []
      this.update_lookup_table()
    },
    async search_genes(event) {
      setTimeout(() => {
        if (!event.query.trim().length) {
            this.genes_filtered = [...this.genes];
        }
        else {
            this.genes_filtered = this.genes.filter((gene) => {
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

#gene-search {
  :deep(.p-autocomplete-token) {
    margin-top:0.25rem !important;
    padding: 0.25rem 0.5rem !important;
    font-size: 0.8rem !important;
  }

}
#filters-boxes {
  :deep(.p-accordion-header-link ) {
    padding:10px !important;
  }

  :deep(.p-accordion-content) {
    padding:10px !important;
    // font-size:0.2rem !important;
  }

  :deep(.p-datatable-wrapper) {
    font-size:80% !important;
  }

  :deep(td) {
    padding:2px!important;
    
  }

  :deep(th) {
    padding:2px !important;
  }

  :deep(.p-checkbox-box) {
    font-size: 70% !important;
    height: 70% !important;
    width: 70% !important;
    margin:auto !important;
  }

  :deep(.p-checkbox-icon) {
    font-size: 80% !important;
  }

  :deep(.p-column-header-content) {
    font-size: 100% !important;
    // height: 80% !important;
    // width: 80% !important;
    // margin:auto !important;

  }

  :deep(.p-button) {
    padding:0.4rem 0.5rem !important;
    font-size:0.9rem !important;
  }
}

#current-filters-ui {
  :deep(.p-chip) {
    margin-top: 2px !important;
  }
}

#graphs-view {
  :deep(.p-menuitem-link) {
    padding: 10px !important;
  }
}


</style>