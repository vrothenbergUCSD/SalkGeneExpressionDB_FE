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
              @remove="remove_species_filter(item.name)" />
            <span class="px-1 font-semibold" v-if="index < this.species_selected.length - 1">or</span>
          </div>
        </div>
        <div id="filters-experiment" v-if="this.experiment_selected.length"
          class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
          <div class="font-semibold text-sm pl-1">Experiments:</div>
          <div v-for="(item, index) in this.experiment_selected" :key="item" class="my-1">
            <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable
              @remove="remove_experiment_filter(item.name)" />
            <span class="px-1 font-semibold text-sm" v-if="index < this.experiment_selected.length - 1">or</span>
          </div>
        </div>
        <div id="filters-tissue" v-if="this.tissue_selected.length"
          class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
          <div class="font-semibold text-sm pl-1">Tissues:</div>
          <div v-for="(item, index) in this.tissue_selected" :key="item">
            <!-- content -->
            <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable
              @remove="remove_tissue_filter(item.name)" />
            <span class="px-1 font-semibold text-sm" v-if="index < this.tissue_selected.length - 1">or</span>
          </div>
        </div>
        <div id="filters-gender" v-if="this.gender_selected.length"
          class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
          <div class="font-semibold text-sm pl-1">Genders:</div>
          <div v-for="(item, index) in this.gender_selected" :key="item">
            <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable
              @remove="remove_gender_filter(item.name)" />
            <span class="px-1 font-semibold text-sm" v-if="index < this.gender_selected.length - 1">or</span>
          </div>
        </div>
        <div id="filters-condition" v-if="this.condition_selected.length"
          class="bg-slate-200 p-1 rounded-lg border border-slate-300 my-2 flex flex-wrap align-items-center mx-3">
          <div class="font-semibold text-sm pl-1">conditions:</div>
          <div v-for="(item, index) in this.condition_selected" :key="item">
            <Chip :label="item.name" class="mx-1 custom-chip text-sm" removable
              @remove="remove_condition_filter(item.name)" />
            <span class="px-1 font-semibold text-sm" v-if="index < this.condition_selected.length - 1">or</span>
          </div>
        </div>
        <div id="clear-filters" class="my-2 flex flex-wrap align-items-center mx-3">
          <Chip label="Clear All Filters" class="mx-1 text-sm font-semibold" removable @remove="clear_all_filters" />
        </div>
      </div>
      <div id="filters-graph-view" class="flex pl-3">
        <div id="filters-boxes" class="w-1/4 mt-2 min-w-[20rem]">

          <Accordion :multiple="true" :activeIndex="[0, 1, 2]">
            <AccordionTab header="Filters">
              <div v-if="!this.datasets_filter_warning">
                <div class="font-semibold mb-1 text-sm flex flex-row">
                  <div class="flex justify-start">
                  Datasets
                  <span class="font-light ml-1">
                    {{ this.number_datasets_selected() }}
                  </span>
                </div>
                  <div id="update-button" class="flex grow justify-end">
                    <Button class="align-middle" style="height: 1.375rem; font-size:0.5rem;" 
                    label="Update" @click="get_datasets" 
                    :loading="this.getting_datasets || this.getting_gene_data || this.loading_genes" />
                  </div>             
                </div>
                <div class="p-1 border my-3 rounded" :class="{ 'border-red-600 border-3': this.species_error }">
                  <DataTable :value="speciesWithFreq" v-model:selection="this.species_selected"
                    class="p-datatable-sm p-datatable-species" stripedRows :scrollable="true" scrollHeight="200px"
                    :loading="loading" selectionMode="multiple" :metaKeySelection="false"
                    @row-select="update_lookup_table" @row-unselect="update_lookup_table()"
                    @row-select-all="update_lookup_table" @row-unselect-all="update_lookup_table()"
                    sortField="freq" :sortOrder="-1">
                    <Column selectionMode="multiple" headerStyle="width: 1rem" style="width: 1rem"></Column>
                    <Column field="name" header="Species" headerStyle="width: 10rem" style="width: 10rem"></Column>
                    <Column field="count" header="#" headerStyle="width: 2rem" style="width: 2rem">
                      <template #body="slotProps">
                        {{ get_count('species', slotProps.data.name) }}
                      </template>
                    </Column>
                    <Column field="freq" header="Freq" sortable 
                      headerStyle="width: 4rem" style="width: 4rem">
                      <template #body="slotProps">
                        <!-- {{ slotProps.data.freq }} -->
                        {{ get_freq('species', slotProps.data.name) }}
                      </template>
                    </Column>
                  </DataTable>
                  <div v-show="this.species_error" class="text-sm text-red-600">No species selected </div>
                </div>
                <div class="p-1 border my-3 rounded" :class="{ 'border-red-600 border-3': this.experiment_error }">
                  <DataTable :value="experimentWithFreq" v-model:selection="experiment_selected" class="p-datatable-sm"
                    stripedRows :scrollable="true" scrollHeight="200px" :loading="loading" selectionMode="multiple"
                    :metaKeySelection="false" @row-select="update_lookup_table" @row-unselect="update_lookup_table"
                    @row-select-all="update_lookup_table" @row-unselect-all="update_lookup_table"
                    sortField="freq" :sortOrder="-1">
                    <Column selectionMode="multiple" headerStyle="width: 1rem" style="width: 1rem"></Column>
                    <Column field="name" header="Dataset" headerStyle="width: 10rem" style="width: 10rem"></Column>
                    <Column field="count" header="#" headerStyle="width: 2rem" style="width: 2rem">
                      <template #body="slotProps">
                        {{ get_count('experiment', slotProps.data.name) }}
                      </template>
                    </Column>
                    <Column field="freq" header="Freq" sortable
                      headerStyle="width: 4rem" style="width: 4rem">
                      <template #body="slotProps">
                        <!-- {{ slotProps.data.freq }} -->
                        {{ get_freq('experiment', slotProps.data.name) }}
                      </template>
                    </Column>
                  </DataTable>
                  <div v-show="this.experiment_error" class="text-sm text-red-600">No datasets selected </div>

                </div>
                <div class="p-1 border my-3 rounded" :class="{ 'border-red-600 border-3': this.year_error }">
                  <DataTable :value="yearWithFreq" v-model:selection="year_selected" class="p-datatable-sm"
                    stripedRows :scrollable="true" scrollHeight="200px" :loading="loading" selectionMode="multiple"
                    :metaKeySelection="false" @row-select="update_lookup_table" @row-unselect="update_lookup_table"
                    @row-select-all="update_lookup_table" @row-unselect-all="update_lookup_table"
                    sortField="freq" :sortOrder="-1">
                    <Column selectionMode="multiple" headerStyle="width: 1rem" style="width: 1rem"></Column>
                    <Column field="name" header="Year" headerStyle="width: 10rem" style="width: 10rem"></Column>
                    <Column field="count" header="#" headerStyle="width: 2rem" style="width: 2rem">
                      <template #body="slotProps">
                        {{ get_count('year', slotProps.data.name) }}
                      </template>
                    </Column>
                    <Column field="freq" header="Freq" sortable
                      headerStyle="width: 4rem" style="width: 4rem">
                      <template #body="slotProps">
                        <!-- {{ slotProps.data.freq }} -->
                        {{ get_freq('year', slotProps.data.name) }}
                      </template>
                    </Column>
                  </DataTable>
                  <div v-show="this.year_error" class="text-sm text-red-600">No years selected </div>

                </div>
                <div class="p-1 border my-3 rounded" :class="{ 'border-red-600 border-3': this.tissue_error }">
                  <DataTable :value="tissueWithFreq" v-model:selection="tissue_selected" class="p-datatable-sm"
                    stripedRows selectionMode="multiple" :metaKeySelection="false" :scrollable="true"
                    scrollHeight="200px" :loading="loading" 
                    @row-select="update_lookup_table"
                    @row-unselect="update_lookup_table" 
                    @row-select-all="update_lookup_table"
                    @row-unselect-all="update_lookup_table"
                    sortField="freq" :sortOrder="-1">
                    <Column selectionMode="multiple" headerStyle="width: 2rem" style="width: 2rem"></Column>
                    <Column field="name" header="Tissue" headerStyle="width: 10rem" style="width: 10rem"></Column>
                    <Column field="count" header="#" headerStyle="width: 2rem" style="width: 2rem">
                      <template #body="slotProps">
                        {{ get_count('tissue', slotProps.data.name) }}
                      </template>
                    </Column>
                    <Column field="freq" header="Freq" sortable 
                      headerStyle="width: 4rem" style="width: 4rem">
                      <template #body="slotProps">
                        <!-- {{ slotProps.data.freq }} -->
                        {{ get_freq('tissue', slotProps.data.name) }}
                      </template>
                    </Column>
                  </DataTable>
                  <div v-show="this.tissue_error" class="text-sm text-red-600">No tissues selected </div>
                </div>
                <div class="font-semibold my-1 text-sm">
                  Samples
                </div>
                <div class="p-1 border my-3 rounded" :class="{ 'border-red-600 border-3': this.gender_error }">
                  <DataTable :value="genderWithFreq" v-model:selection="gender_selected" class="p-datatable-sm"
                    stripedRows selectionMode="multiple" :metaKeySelection="false" :scrollable="true"
                    scrollHeight="200px" :loading="loading" 
                    @row-select="update_lookup_table"
                    @row-unselect="update_lookup_table" 
                    @row-select-all="update_lookup_table"
                    @row-unselect-all="update_lookup_table"
                    sortField="freq" :sortOrder="-1">
                    <Column selectionMode="multiple" headerStyle="width: 2rem" style="width: 2rem"></Column>
                    <Column field="name" header="Gender" style="text-align:left"></Column>
                    <Column field="count" header="#" headerStyle="width: 2rem" style="width: 2rem">
                      <template #body="slotProps">
                        {{ get_count('gender', slotProps.data.name) }}
                      </template>
                    </Column>
                    <Column field="freq" header="Freq" sortable 
                     headerStyle="width: 4rem" style="width: 4rem">
                      <template #body="slotProps">
                         <!-- {{ slotProps.data.freq }} -->
                        {{ get_freq('gender', slotProps.data.name) }}
                      </template>
                    </Column>
                  </DataTable>
                  <div v-show="this.gender_error" class="text-sm text-red-600">No genders selected </div>
                </div>
                <div class="p-1 border my-3 rounded" :class="{ 'border-red-600 border-3': this.condition_error }">
                  <DataTable :value="conditionWithFreq" v-model:selection="condition_selected"
                    class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" :loading="loading"
                    selectionMode="multiple" :metaKeySelection="false" 
                    @row-select="update_lookup_table"
                    @row-unselect=" update_lookup_table" 
                    @row-select-all="update_lookup_table"
                    @row-unselect-all="update_lookup_table"
                    sortField="freq" :sortOrder="-1">
                    <Column selectionMode="multiple" headerStyle="width: 2rem" style="width: 2rem"></Column>
                    <Column field="name" header="Condition" style="text-align:left"></Column>
                    <Column field="count" header="#" headerStyle="width: 2rem" style="width: 2rem">
                      <template #body="slotProps">
                        {{ get_count('condition', slotProps.data.name) }}
                      </template>
                    </Column>
                    <Column field="freq" header="Freq" sortable 
                    :sortFunction="() => customSort(this.condition_filtered, 'condition')" headerStyle="width: 4rem" style="width: 4rem">
                      <template #body="slotProps">
                        {{ get_freq('condition', slotProps.data.name) }}
                      </template>
                    </Column>
                  </DataTable>
                  <div v-show="this.condition_error" class="text-sm text-red-600">No conditions selected </div>
                </div>

                <div id="get-datasets" class="mt-1 text-center">
                  <Button label="Get Datasets" @click="get_datasets" 
                  :loading="this.getting_datasets || this.getting_gene_data || this.loading_genes" />
                </div>
              </div>
              <div v-else class="text-center font-semibold text-lg">
                Warning: No datasets in filtered selection. Clear filters to regain datasets for selection.
              </div>
            </AccordionTab>
            <AccordionTab header="Genes">
              <div id="genes-view" class="" v-show="this.got_datasets">
                <div class="font-semibold text-sm my-1">Select Genes:</div>
                <!-- <div v-show="this.loading_genes" class="">
                <ProgressBar mode="indeterminate" />
              </div> -->
                <div id="gene-search" class="p-1" v-show="!this.loading_genes">
                  <AutoComplete :multiple="true" v-model="this.genes_selected" :suggestions="this.genes_filtered"
                    @complete="search_genes($event)" field="name" :disabled="this.loading_genes"
                    @item-unselect="remove_gene" />
                </div>
                <div id="get-genes" class="mt-1 text-center">
                  <Button label="Get Genes" @click="get_datasets"
                    :loading="this.getting_gene_data || this.loading_genes" />
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
                <TabMenu :model="plots" v-model:activeIndex="index" />
              </div>
              <div v-if="index != null" class="mx-auto px-3 ">
                <KeepAlive>
                  <component :is="plots[index].current_component" :genes="this.genes_selected"
                    :datasets="this.datasets" />
                </KeepAlive>
              </div>
            </div>
          </div>
          <div v-else class="flex h-[50vh]">
            <ProgressSpinner v-show="this.getting_datasets" class="m-auto" />
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
import HeatMap from "@/components/svg/HeatMap.vue"

import DataService from "@/services/DataService.js"
import { getAuth } from "firebase/auth";

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
    HeatMap,

  },
  DataService: null,
  data() {
    return {
      plots: [
        {
          label: 'Line',
          icon: 'pi pi-fw pi-chart-line',
          current_component: 'LinePlot',
        },
        {
          label: 'Histogram',
          icon: 'pi pi-fw pi-chart-bar',
          current_component: 'BarPlot',
        },
        {
          label: 'Heat Map',
          icon: 'pi pi-fw pi-th-large',
          current_component: 'HeatMap'
        }
        
      ],
      index: null,
      current_component: null,

      loading: true,
      loading_genes: true,
      got_datasets: false,
      getting_datasets: false,
      got_gene_data: false,
      getting_gene_data: false,
      datasets_filter_warning: false,
      filter_warning: false,

      db_metadata: null, // Should be constant
      selected_metadata: null,
      lookup_table: {},

      dataset_categories: ['species', 'experiment', 'year', 'tissue'],
      sample_categories: ['gender', 'condition'],

      species_list: [], //["Mouse", "Human", "Baboon"],
      species_filtered: [], // [{name: Mouse}, {name:Human}]
      species_selected: [],
      species_result: null,
      species_error: null,

      experiment_list: [], //["Mouse_TRF_2018", "Mouse_TRF_2019", "Baboon_TRF_2020", "Human_ABC_2020"],
      experiment_filtered: [],
      experiment_selected: [],
      experiment_result: null,
      experiment_error: null,

      year_list: [], //["2019", "2018"],
      year_filtered: [],
      year_selected: [],
      year_result: null,
      year_error: null,

      tissue_list: [], //["Liver", "Muscle", "Adipose", "Heart", "Neuron"],
      tissue_filtered: [],
      tissue_selected: [],
      tissue_result: null,
      tissue_error: null,

      genes: [], // [{name:'Alb'},...]
      genes_filtered: [],
      genes_selected: [],
      genes_results: null,
      genes_error: null,

      gender: [],
      gender_filtered: [],
      gender_selected: [],
      gender_result: null,
      gender_error: null,

      condition: [],
      condition_filtered: [],
      condition_selected: [],
      condition_result: null,
      condition_error: null,

      gene_metadata_table_names: [],
      sample_metadata_table_names: [],
      gene_expression_data_table_names: [],

      gene_metadata_tables: [],
      gene_metadata_tables_all: [],
      selected_gene_metadata: [],
      selected_gene_metadata_all: [],
      sample_metadata_tables: [],
      sample_metadata_tables_all: [],
      gene_expression_data_tables: [],
      gene_expression_data_tables_all: [],

      datasets: null,

    }
  },
  async mounted() {
    // First check if user exists 
    console.log('Main mounted')

    let user = await this.user_logged_in()

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

    // Default selection
    this.species_selected = [{ name: 'Mus musculus' }]
    this.experiment_selected = [{ name: 'TRF Experiment' }, { name: 'WFF Experiment' }]
    this.year_selected = [{ name: '2018'}, { name: '2020'}]
    this.tissue_selected = [{ name: 'BAT'}]
    this.gender_selected = [{ name: 'Male' }]
    this.condition_selected = [ { name: 'TRF' }, { name: 'ALF'}]
    this.genes_selected = [{ name: 'Clock' }]

    this.$nextTick(() => {
      this.species_selected = this.updateDefaultSelection('speciesWithFreq', this.species_selected);
      this.experiment_selected = this.updateDefaultSelection('experimentWithFreq', this.experiment_selected);
      this.year_selected = this.updateDefaultSelection('yearWithFreq', this.year_selected);
      this.tissue_selected = this.updateDefaultSelection('tissueWithFreq', this.tissue_selected);
      this.gender_selected = this.updateDefaultSelection('genderWithFreq', this.gender_selected);
      this.condition_selected = this.updateDefaultSelection('conditionWithFreq', this.condition_selected);
      
    });

    this.update_lookup_table()

    // TODO: Re-enable
    await this.get_datasets()

    // Line chart at index 0
    // Line = 0, Bar = 1, Heat Map = 2 
    this.index = 0

    const elapsed = Date.now() - start
    console.log('Main mounted time elapsed ', elapsed)
  },
  computed: {
    speciesWithFreq() {
      return this.species_filtered.map(item => {
        return {
          ...item,
          freq: this.get_freq('species', item.name)
        };
      });
    },
    experimentWithFreq() {
      return this.experiment_filtered.map(item => {
        return {
          ...item,
          freq: this.get_freq('experiment', item.name)
        };
      });
    },
    tissueWithFreq() {
      return this.tissue_filtered.map(item => {
        return {
          ...item,
          freq: this.get_freq('tissue', item.name)
        };
      });
    },
    conditionWithFreq() {
      return this.condition_filtered.map(item => {
        return {
          ...item,
          freq: this.get_freq('condition', item.name)
        };
      });
    },
    genderWithFreq() {
      return this.gender_filtered.map(item => {
        return {
          ...item,
          freq: this.get_freq('gender', item.name)
        };
      });
    },
    yearWithFreq() {
      return this.year_filtered.map(item => {
        return {
          ...item,
          freq: this.get_freq('year', item.name)
        };
      });
    },
    
  },
  methods: {
    updateDefaultSelection(field, selected) {
      return this[field].filter(item => 
        selected.some(sel => sel.name === item.name)
      );
    },
    async user_logged_in() {
      try {
        // console.log('Trying')
        const auth = getAuth()
        await new Promise(async (resolve, reject) =>
          auth.onAuthStateChanged(
              async user => {
                if (user) {
                  // Yes User is signed in.
                  // console.log('Main: User is there') 
                  // console.log(user)
                  await this.$store.commit("updateUser", user)
                  if (user) {
                    // console.log("Main: Before getCurrentUser")
                    await this.$store.dispatch("getCurrentUser", user)
                  }
                  // console.log('Main: After auth state changed')
                  resolve('User is there', user);
                } else {
                  // No user is not signed in.
                  // console.log('No user')
                  reject('There is no user');
                }
              },
              // Prevent console errors
              error => reject(error)
            )
          )
        return true
      } catch (error) {
        // console.log('Catch')
        // console.log(error)
        return false
      }
      },
    async load_metadata() {
      // Called only once by mounted()
      console.log('load_metadata')
      const start = Date.now()

      let formData = new FormData()
      let token = null
      if (this.$store.state.token)
        token = this.$store.state.token.token

      // console.log('token')
      // console.log(token)
      formData.append('authorization', token)
      // console.log('formData')
      // console.log(formData)

      this.db_metadata = await DataService.getDatasetsMetadata(formData).then(e => e.data)

      // Parse gender and condition fields
      this.db_metadata.forEach(e => {
        const genderStr = e.gender.replaceAll(/[']+/g, '"')
        e.gender = JSON.parse(genderStr)
        const conditionStr = e.condition.replaceAll(/[']+/g, '"')
        e.condition = JSON.parse(conditionStr)
        e.year = e.year.toString()
      })

      this.species_list = this.build_list([...new Set(this.db_metadata.map(item => item.species))])
      this.species_filtered = this.species_list
      console.log('this.species_filtered')
      console.log(this.species_filtered)

      this.experiment_list = this.build_list([...new Set(this.db_metadata.map(item => item.experiment))])
      this.experiment_filtered = this.experiment_list
      console.log('this.experiment_filtered')
      console.log(this.experiment_filtered)

      this.year_list = this.build_list([...new Set(this.db_metadata.map(item => item.year))])
      this.year_filtered = this.year_list
      console.log('this.year_filtered')
      console.log(this.year_filtered)

      this.tissue_list = this.build_list([...new Set(this.db_metadata.map(item => item.tissue))])
      this.tissue_filtered = this.tissue_list
      console.log('this.tissue_filtered')
      console.log(this.tissue_filtered)

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
    async update_selection() {
      console.log('update_selection')
      const start = Date.now()
      this.getting_datasets = true
      this.gene_metadata_table_names = []
      this.sample_metadata_table_names = []
      this.gene_expression_data_table_names = []
      console.log(this.selected_metadata)
      if (!this.selected_metadata.length) {
        this.getting_datasets = false
        this.got_datasets = false
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'No datasets selected', life: 5000 });
        return
      }
      const elapsed = Date.now() - start
      console.log('update_selection time elapsed: ', elapsed)
    },
    validate_dataset_selection() {
      console.log('validate_dataset_selection')
      const start = Date.now()

      this.species_error = (this.species_selected.length == 0)
      console.log('this.species_error', this.species_error)
      console.log(this.species_selected)
      this.experiment_error = (this.experiment_selected.length == 0)
      console.log('this.experiment_error', this.experiment_error)
      console.log(this.experiment_selected)
      this.year_error = (this.year_selected.length == 0)
      console.log('this.year_error', this.year_error)
      console.log(this.year_selected)
      this.tissue_error = (this.tissue_selected.length == 0)
      console.log('this.tissue_error', this.tissue_error)
      this.gender_error = (this.gender_selected.length == 0)
      console.log('this.gender_error', this.gender_error)
      this.condition_error = (this.condition_selected.length == 0)
      console.log('this.condition_error', this.condition_error)
      

      const elapsed = Date.now() - start
      console.log('validate_dataset_selection time elapsed: ', elapsed)
    },
    async get_datasets() {
      // TODO: get_datasets Optimize filtering..
      // Called on initial mount, and by remove_filter functions on update
      console.log('get_datasets')
      const start = Date.now()

      this.getting_datasets = true
      this.gene_metadata_table_names = []
      this.sample_metadata_table_names = []
      this.gene_expression_data_table_names = []
      console.log(this.selected_metadata)
      this.validate_dataset_selection()
      if (!this.selected_metadata.length) {
        this.getting_datasets = false
        this.got_datasets = false
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'No datasets selected', life: 5000 });
        return
      } else if (this.selected_metadata.length > 8) {
        this.getting_datasets = false
        this.got_datasets = false
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Too many datasets selected.\nSelect 8 or fewer.', life: 5000 });
        return
      }
      this.selected_metadata.forEach((e) => {
        // Build list of gene_metadata_tables
        this.gene_metadata_table_names.push(e.gene_metadata_table_name)
        this.sample_metadata_table_names.push(e.sample_metadata_table_name)
        this.gene_expression_data_table_names.push(e.gene_expression_data_table_name)
      })
      console.log('this.gene_metadata_table_names')
      console.log(this.gene_metadata_table_names)
      await Promise.all([
        // TODO: get_datasets Query Firestore gene list 
        this.get_gene_metadata_tables(this.gene_metadata_table_names),
        this.get_sample_metadata_tables(this.sample_metadata_table_names),
      ])
      this.got_datasets = true
      this.getting_datasets = false
      if (this.genes_selected.length)
        // If user has at least one selected genes call get_gene_data 
        // Updates chart with selected gene data for corresponding datasets
        await this.get_gene_data()
      console.log('this.datasets')
      console.log(this.datasets)

      const elapsed = Date.now() - start
      console.log('get_datasets time elapsed: ', elapsed)
    },
    async get_gene_metadata_tables(tables) {
      // Gets list of all gene metadata for each table in tables
      // Creates a unique set of all genes, assigns to this.genes
      // tables: Array of table names e.g. ["TRF_2018_Mouse_Arcuate_gene_metadata_UCb0eBc2ewPjv9ipwLaEUYSwdhh1"]
      console.log('get_gene_metadata_tables')
      console.log(tables)
      const start = Date.now()
      this.loading_genes = true
      this.gene_metadata_tables = await Promise.all(tables.map(async (t) => {
        // Check table in gene_metadata_tables_all
        let table_obj = this.gene_metadata_tables_all.find(e => e.table_name == t)
        if (!table_obj) {
          const result = await DataService.getGenes(t)
          table_obj = {
            table_name: t,
            data: result.data.map(d => d.gene_name)
          }
          this.gene_metadata_tables_all.push(table_obj)
        }
        return table_obj
      }))
      this.genes = this.build_list([...new Set(...this.gene_metadata_tables.map(
        e => e.data))])
      this.genes_filtered = this.genes
      this.loading_genes = false
      const elapsed = Date.now() - start
      console.log('get_gene_metadata_tables elapsed: ', elapsed)
    },
    async get_sample_metadata_tables(tables) {
      // Gets all sample metadata corresponding to list of table names
      // tables: Array of table names e.g. ["TRF_2018_Mouse_Arcuate_gene_metadata_UCb0eBc2ewPjv9ipwLaEUYSwdhh1"]
      const start = Date.now()
      this.sample_metadata_tables = await Promise.all(tables.map(async (t) => {
        // Check table in sample_metadata_tables_all
        let table_obj = this.sample_metadata_tables_all.find(e => e.table_name == t)
        if (!table_obj) {
          // Table not found, query
          console.log('sample metadata table not found')
          const result = await DataService.getSampleMetadata(t)
          // console.log(result)
          table_obj = {
            table_name: t,
            data: result.data
          }
          // Object.defineProperty(table_obj, 'data', {
          //   value: result.data,
          //   writable: false
          // });
          
          this.sample_metadata_tables_all.push(table_obj)
        }
        return JSON.parse(JSON.stringify(table_obj))
      }))
      // Filter tables of samples based on condition and gender
      // this.sample_metadata_tables.forEach(table => {
      //   table.data = table.data.filter(e => e.condition in this.condition_selected.map(d => d.name))
      //   table.data = table.data.filter(e => e.gender in this.gender_selected.map(d => d.name))
      // })
      console.log('this.sample_metadata_tables')
      console.log(this.sample_metadata_tables)
      console.log(this.sample_metadata_tables_all)
      const elapsed = Date.now() - start
      console.log('get_sample_metadata_tables elapsed: ', elapsed)
    },
    check_combo(table_obj, sample_metadata_lookup, genes_arr) {
      // Check for missing combinations of gene condition and gender
      // Used for updating differential data, instead of downloading everything again
      for (let i = 0; i < genes_arr.length; i++) {
        for (let j = 0; j < conditions_arr.length; j++) {
          for (let k = 0; k < genders_arr.length; k++) {
            // Check combination exists in table
            const combo = table_obj.data.find(e =>
              e.gene_id == genes_arr[i]
              && sample_metadata_lookup[e.sample_name].condition == conditions_arr[j]
              && sample_metadata_lookup[e.sample_name].gender == genders_arr[k]
            )
            if (!combo)
              // Missing at least one combination
              return true
          }
        }
      }
      return false
    },
    async get_gene_expression_data_tables(genes, tables) {
      // genes: List of selected gene objects
      console.log('get_gene_expression_data_tables')
      const start = Date.now()
      const genes_str = genes.map(d => d.name).toString()
      console.log('genes_str')
      console.log(genes_str)
      const genders_str = this.gender_selected.map(d => d.name).toString()
      console.log('genders_str')
      console.log(genders_str)
      const conditions_str = this.condition_selected.map(d => d.name).toString()
      console.log('conditions_str')
      console.log(conditions_str)
      
      this.gene_expression_data_tables = await Promise.all(tables.map(async (t) => {
        // Check table in gene_expression_data_tables_all
        let table_obj = this.gene_expression_data_tables_all.find(e => e.table_name == t)
        if (table_obj) {
          console.log('Table exists')
          // Table object exists, check if all genes in table
          // Deep copy table_obj to prevent overwriting 
          table_obj = JSON.parse(JSON.stringify(table_obj))
          const table_obj_index = this.gene_expression_data_tables_all
            .findIndex(e => e.table_name == t)
          const sample_table_name = t.replace('gene_expression_data', 'sample_metadata')
          // console.log(this.sample_metadata_tables_all)
          const sample_metadata = this.sample_metadata_tables_all.find(e =>
            e.table_name == sample_table_name)
          console.log('sample_metadata')
          console.log(sample_metadata)
          const sample_metadata_lookup = sample_metadata.data.reduce(
            (obj, item) => (obj[item.sample_name] = item, obj), {})
          console.log('sample_metadata_lookup')
          console.log(sample_metadata_lookup)

          const table_obj_genes = [...new Set(table_obj.data.map(item => item.gene_id))]
          const genes_arr = genes.map(d => d.name)
          const genes_to_add = _.difference(genes_arr, table_obj_genes)
          console.log('genes_to_add')
          console.log(genes_to_add)
          
          console.log('table_obj')
          console.log(table_obj)
          console.log(sample_metadata_lookup)

          // // Check if all genders in table 
          // const table_obj_genders = [...new Set(table_obj.data.map(item =>
          //   sample_metadata_lookup[item.sample_name].gender))]

          // const genders_arr = this.gender_selected.map(d => d.name)
          // const genders_to_add = _.difference(genders_arr, table_obj_genders)
          // console.log('genders_to_add')
          // console.log(genders_to_add)

          // Check if all conditions in table
          // console.log('sample_metadata_tables_all')
          // console.log(this.sample_metadata_tables_all)

          // console.log('sample_metadata_lookup')
          // console.log(sample_metadata_lookup)
          // const table_obj_conditions = [...new Set(table_obj.data.map(item =>
          //   sample_metadata_lookup[item.sample_name].condition))]
          // console.log('table_obj_conditions')
          // console.log(table_obj_conditions)
          // const conditions_arr = this.condition_selected.map(d => d.name)
          // console.log('conditions_arr')
          // console.log(conditions_arr)
          // const conditions_to_add = _.difference(conditions_arr, table_obj_conditions)
          // console.log('conditions_to_add')
          // console.log(conditions_to_add)

          // Check if any combination of gene, condition and gender are missing
          // const combo_missing = this.check_combo(table_obj,
          //   sample_metadata_lookup, genes_arr)

          if (genes_to_add.length
            // || combo_missing
            ) {
            // New data needed, run query
            const data = this.gene_expression_data_tables_all[table_obj_index].data

            const genes_str = genes_arr.toString()
            // const genders_str = genders_arr.toString()
            // const conditions_str = conditions_arr.toString()

            // console.log('Querying DataService.getExpressionData...')
            const result = await DataService
              .getExpressionDataByGenes(genes_str, t)
              // .getExpressionDataByGenesGendersConditions(
              //   genes_str, genders_str, conditions_str, t)

            // Union to only add data and not overwrite old results 
            const data_all = _.union(data, result.data)
            this.gene_expression_data_tables_all[table_obj_index].data = data_all
          }
          // Update current table_obj to only contain selected genes
          // Deep copy with [...]
          table_obj.data = [...this.gene_expression_data_tables_all[table_obj_index]
            .data].filter(item => genes_arr.indexOf(item.gene_id) !== -1)
          
        } else {
          // Table does not exist, query 
          console.log('Table does not exist')
          // Get all samples for table
          //  Filter based on gender or condition afterwards
          const result = await DataService
            .getExpressionDataByGenes(genes_str, t)
            // .getExpressionDataByGenesGendersConditions(genes_str, genders_str, conditions_str, t)
          

          table_obj = {
            table_name: t,
            data: result.data
          }
          this.gene_expression_data_tables_all.push(JSON.parse(JSON.stringify(table_obj)))
        } 
        // After fetching table 
        console.log('After fetching table')
        console.log(table_obj)

        // Get samples which are in one of the selected conditions
        const sample_names = [...new Set(table_obj.data.map(item => item.sample_name))]
        console.log('sample_names')
        console.log(sample_names)

        const sample_table_name = t.replace('gene_expression_data', 'sample_metadata')
        // console.log(this.sample_metadata_tables_all)
        const sample_metadata = this.sample_metadata_tables_all.find(e =>
          e.table_name == sample_table_name)
        console.log('sample_metadata')
        console.log(sample_metadata)

        let filtered_samples = sample_metadata.data
        console.log('filtered_samples')
        console.log(filtered_samples)

        // Create condition property if does not exist 
        filtered_samples.forEach(obj => {
        if (!obj.hasOwnProperty('condition') && obj.hasOwnProperty('group_name')) {
            Object.assign(obj, { condition: obj.group_name });
          }
        });

        const conditions = this.condition_selected.map(d => d.name)
        console.log('conditions')
        console.log(conditions)

        if (conditions.length)
          filtered_samples = filtered_samples.filter(obj => 
            conditions.includes(obj.condition));

        console.log('filtered_samples')
        console.log(filtered_samples)
        
        const genders = this.gender_selected.map(d => d.name)
        console.log('genders')
        console.log(genders)

        if (genders.length)
          filtered_samples = filtered_samples.filter(obj => genders.includes(obj.gender));
        console.log('filtered_samples')
        console.log(filtered_samples)

        const filtered_samples_names = filtered_samples.map(d => d.sample_name)
        console.log('filtered_samples_names')
        console.log(filtered_samples_names)

        console.log('genes')
        console.log(genes)
        const genes_arr = genes.map(d => d.name)

        let filtered_data = table_obj.data.filter(obj => genes_arr.includes(obj.gene_id));
        console.log('filtered_data')
        console.log(filtered_data)
        
        filtered_data = filtered_data.filter(obj => filtered_samples_names.includes(obj.sample_name));

        console.log('filtered_data')
        console.log(filtered_data)

        table_obj.data = filtered_data

        return table_obj
      }))
      console.log('this.gene_expression_data_tables')
      console.log(this.gene_expression_data_tables)
      console.log('this.gene_expression_data_tables_all')
      console.log(this.gene_expression_data_tables_all)
      // this.gene_expression_data_tables.forEach(table => {
      //   table.data
      // })
      const elapsed = Date.now() - start
      console.log('get_gene_expression_data_tables elapsed:', elapsed)
    },
    async get_selected_gene_metadata(genes, tables) {
      console.log('get_selected_gene_metadata')
      const start = Date.now()
      const genes_str = genes.map((d) => d.name).toString()
      this.selected_gene_metadata = await Promise.all(tables.map(async (t) => {
        // Deep copy table_obj
        let table_obj = this.selected_gene_metadata_all.find(e => e.table_name == t)
        if (!table_obj) {
          // console.log('Not found: ', t)
          const result = await DataService.getGeneMetadata(genes_str, t)
          table_obj = {
            table_name: t,
            data: result.data
          }
          this.selected_gene_metadata_all.push(table_obj)
        } else {
          // Table object exists, check if all genes in table
          // console.log('Found: ', t)
          // console.log(table_obj)
          table_obj = JSON.parse(JSON.stringify(table_obj))
          const table_obj_genes = [...new Set(table_obj.data.map(item => item.gene_id))]
          const genes_arr = genes.map(d => d.name)
          // console.log('genes_arr')
          // console.log(genes_arr)
          const genes_to_add = _.difference(genes_arr, table_obj_genes)
          // console.log('genes_to_add')
          // console.log(genes_to_add)

          const table_obj_index = this.selected_gene_metadata_all
            .findIndex(e => e.table_name == t)
          if (genes_to_add.length > 0) {
            // Check if 
            // Cache new genes to table in memory 
            const data = this.selected_gene_metadata_all[table_obj_index].data
            // console.log('data')
            // console.log(data)

            // Only query new genes to save on egress cost
            const genes_to_add_str = genes_to_add.toString()
            const result = await DataService.getGeneMetadata(genes_to_add_str, t)

            const data_all = _.union(data, result.data)
            // console.log('data_all')
            // console.log(data_all)
            this.selected_gene_metadata_all[table_obj_index].data = data_all
          }
          // Update current table_obj to only contain selected genes
          // Deep copy [...]
          table_obj.data = [...this.selected_gene_metadata_all[table_obj_index]
            .data].filter(item => genes_arr.indexOf(item.gene_id) !== -1)

        }
        return table_obj
      }))
      const elapsed = Date.now() - start
      console.log('get_selected_gene_metadata elapsed:', elapsed)
    },
    async get_gene_data() {
      console.log('get_gene_data')
      const start = Date.now()

      this.getting_gene_data = true
      if (!this.genes_selected.length) {
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'No genes selected', life: 5000 });
        this.got_gene_data = false
        this.getting_gene_data = false
        return
      }
      await Promise.all([
        this.get_gene_expression_data_tables(this.genes_selected, this.gene_expression_data_table_names),
        this.get_selected_gene_metadata(this.genes_selected, this.gene_metadata_table_names)
      ])
      // Filter tables based on gender and condition
      const conditions = this.condition_selected.map(d => d.name)
      const genders = this.gender_selected.map(d => d.name)
      this.sample_metadata_tables.forEach(table => {
        if (conditions.length) {
          table.data = table.data.filter(d => conditions.includes(d.condition))
        }
        if (genders.length) {
          table.data = table.data.filter(d => genders.includes(d.gender))
        }
        const sample_names = table.data.map(d => d.sample_name)
        const gene_expr_table_name = table.table_name.replace('sample_metadata', 'gene_expression_data')
        const gene_expr_table = this.gene_expression_data_tables.find(d => d.table_name == gene_expr_table_name)
        gene_expr_table.data = gene_expr_table.data.filter(d => sample_names.includes(d.sample_name))
      })

      this.datasets = {
        sample_metadata_tables: this.sample_metadata_tables,
        gene_expression_data_tables: this.gene_expression_data_tables,
        gene_metadata: this.selected_gene_metadata,
        selected_metadata: this.selected_metadata,
      }
      console.log('this.datasets')
      console.log(this.datasets)
      this.got_gene_data = true
      this.getting_gene_data = false
      const elapsed = Date.now() - start
      console.log('get_gene_data time elapsed: ', elapsed)
    },
    update_lookup_table() {
      // TODO: update_lookup_table optimize 
      // BUG: update_lookup_table not working, empty sets with NaN% in table
      // Called by dataset filter row select / unselect
      console.log('update_lookup_table')
      const start = Date.now()
      // Get each subset of all datasets for each filter grouping, excluding its
      //  own additional filter conditions to prevent prematurely locking in a selection
      this.species_result = this.filter_metadata_except('species')
      console.log('this.species_result')
      console.log(this.species_result)
      this.experiment_result = this.filter_metadata_except('experiment')
      console.log('this.experiment_result')
      console.log(this.experiment_result)
      this.year_result = this.filter_metadata_except('year')
      console.log('this.year_result')
      console.log(this.year_result)
      this.tissue_result = this.filter_metadata_except('tissue')
      console.log('this.tissue_result')
      console.log(this.tissue_result)
      this.gender_result = this.filter_metadata_except('gender')
      console.log('this.gender_result')
      console.log(this.gender_result)
      this.condition_result = this.filter_metadata_except('condition')
      console.log('this.condition_result')
      console.log(this.condition_result)

      // this.species_filtered = this.build_list([...new Set(this.species_result.map(item => item.species))].sort())
      this.species_filtered = this.build_list([...new Set(this.db_metadata.map(item => item.species))].sort())
      console.log('species_filtered')
      console.log(this.species_filtered)
      // this.experiment_filtered = this.build_list([...new Set(this.experiment_result.map(item => item.experiment))].sort())
      this.experiment_filtered = this.build_list([...new Set(this.db_metadata.map(item => item.experiment))].sort())
      console.log('experiment_filtered')
      console.log(this.experiment_filtered)
      // this.year_filtered = this.build_list([...new Set(this.year_result.map(item => item.year))].sort())
      this.year_filtered = this.build_list([...new Set(this.db_metadata.map(item => item.year))].sort())
      
      console.log('this.year_filtered')
      console.log(this.year_filtered)
      // this.tissue_filtered = this.build_list([...new Set(this.tissue_result.map(item => item.tissue))].sort())
      this.tissue_filtered = this.build_list([...new Set(this.db_metadata.map(item => item.tissue))].sort())
      
      console.log('this.tissue_filtered')
      console.log(this.tissue_filtered)
      // Get all genders in filtered list then flatten and get unique values
      // this.gender_filtered = this.build_list([...new Set(
      //   this.gender_result.map(item =>
      //     [...new Set(item.gender.map(m => m.gender))]).flat()
      // )].sort())
      this.gender_filtered = this.build_list([...new Set(
        this.db_metadata.map(item =>
          [...new Set(item.gender.map(m => m.gender))]).flat()
      )].sort())
      console.log('this.gender_filtered')
      console.log(this.gender_filtered)

      // this.condition_filtered = this.build_list([...new Set(
      //   this.condition_result.map(item =>
      //     [...new Set(item.condition.map(m => m.condition))]).flat()
      // )].sort())
      this.condition_filtered = this.build_list([...new Set(
        this.db_metadata.map(item =>
          [...new Set(item.condition.map(m => m.condition))]).flat()
      )].sort())
      console.log('this.condition_filtered')
      console.log(this.condition_filtered)

      // BUG: Check if result is empty, 

      this.selected_metadata = _.intersection(
        this.species_result,
        this.experiment_result,
        this.tissue_result,
        this.gender_result,
        this.condition_result)

      let uniqVal, catResult, dataset, catFiltered, sum

      this.dataset_categories.forEach((cat) => {
        // cat = species, experiment, tissue
        console.log(cat)
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
        // this.computeFrequencies(this[catFiltered], cat)
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
              return cat in cur ? acc + reduce_result : acc
            }, 0)
          sum += this.lookup_table[cat][val].count
        })
        uniqVal.forEach((val) => {
          this.lookup_table[cat][val].freq = this.lookup_table[cat][val].count / sum
        })
        // this.computeFrequencies(this[catFiltered], cat)
      })

      // Performs API calls to Database on change to filters
      // TODO: Make sure Update button calls this.get_datasets()
      // await this.get_datasets()

      const elapsed = Date.now() - start
      console.log('update_lookup_table time elapsed: ', elapsed)
    },
    computeFrequencies(arr, field) {
      console.log('computeFrequencies')
      console.log(arr)
      console.log(field)
      arr.forEach(item => {
        item.freq = this.get_freq(field, item.name);
      });
    },
    filter_metadata_except(except_category) {
      // Applies all selection filters for other categories excluding the provided category
      // Allows for selecting more instances of a filter category without prematurely
      //  locking in current filters, preventing adding new selections that are not 
      //  in the intersection, e.g. selecting Heart tissue would filter down all 
      //  datasets to only include those from Heart tissue, preventing selecting Liver, etc.
      console.log('filter_metadata_except: ' + except_category)
      let filtered = this.db_metadata
      // console.log('this.db_metadata')
      // console.log(typeof(this.db_metadata))
      console.log(filtered)
      if (except_category != 'species') {
        const species_selected_names = this.species_selected.map(el => el.name)
        // console.log('species_selected_names')
        // console.log(species_selected_names)
        // NOTE: Do not allow select all if empty
        // If no species selected, then skip filtering
        // if (species_selected_names.length)
          filtered = filtered.filter(
            ({ species }) => species_selected_names.some(
              (s) => species.toLowerCase().includes(s.toLowerCase())))
      }
      console.log('After species filter '  + filtered.length)
      // console.log(filtered)

      if (except_category != 'experiment') {
        const experiment_selected_names = this.experiment_selected.map(el => el.name)
        // console.log('experiment_selected_names')
        // console.log(experiment_selected_names)
        // if (experiment_selected_names.length)
          filtered = filtered.filter(
            ({ experiment }) => experiment_selected_names.some(
              (s) => experiment.toLowerCase().includes(s.toLowerCase())))
      }
      console.log('After experiment filter '  + filtered.length)
      // console.log(filtered)

      if (except_category != 'year') {
        const year_selected_names = this.year_selected.map(el => el.name)
        // console.log('year_selected_names')
        // console.log(year_selected_names)
        // if (year_selected_names.length)
          filtered = filtered.filter(
            ({ year }) => year_selected_names.some(
              (s) => year.toLowerCase().includes(s.toLowerCase())))
      }
      console.log('After year, filter length ' + filtered.length)
      // console.log(filtered)

      if (except_category != 'tissue') {
        const tissue_selected_names = this.tissue_selected.map(el => el.name)
        // console.log('tissue_selected_names')
        // console.log(tissue_selected_names)
        // if (tissue_selected_names.length)
          filtered = filtered.filter(
            ({ tissue }) => tissue_selected_names.some(
              (s) => tissue.toLowerCase().includes(s.toLowerCase())))
      }

      console.log('After tissue filter ' + filtered.length)
      // console.log(filtered)

      if (except_category != 'gender') {
        const gender_selected_names = this.gender_selected.map(el => el.name)
        // console.log('gender_selected_names')
        // console.log(gender_selected_names)
        // if (gender_selected_names.length)
          filtered = filtered.filter(
            ({ gender }) => gender_selected_names.some(
              (s) => gender.some((gend) =>
                gend.gender.toLowerCase() == s.toLowerCase())))
      }

      console.log('After gender filter '  + filtered.length)
      // console.log(filtered)

      if (except_category != 'condition') {
        const condition_selected_names = this.condition_selected.map(el => el.name)
        // console.log('condition_selected_names')
        // console.log(condition_selected_names)
        // if (condition_selected_names.length)
          filtered = filtered.filter(
            ({ condition }) => condition_selected_names.some(
              (s) => condition.some((cond) =>
                cond.condition.toLowerCase() == s.toLowerCase())))
      }

      console.log('After condition filter '  + filtered.length)
      console.log(filtered)

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
        return { 'name': object }
      })
    },
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
    remove_year_filter(text) {
      this.year_selected = this.year_selected.filter((obj) =>
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
    remove_gene() {
      this.update_lookup_table()
    },
    clear_all_filters() {
      this.species_selected = []
      this.experiment_selected = []
      this.year_selected = []
      this.tissue_selected = []
      
      this.gender_selected = []
      this.condition_selected = []
      this.update_lookup_table()
    },
    number_datasets_selected() {
      // Show number of current datasets selected
      let selected = 0
      if (this.selected_metadata)
        selected = this.selected_metadata.length 
      if (this.db_metadata == null)
        return '0'
      let total = this.db_metadata.length
      return `(${selected} / ${total})`;
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
  background: rgb(78, 128, 238);
  color: #ffffff;
}

#gene-search {
  :deep(.p-autocomplete-token) {
    margin-top: 0.25rem !important;
    padding: 0.25rem 0.5rem !important;
    font-size: 0.8rem !important;
  }

}

#filters-boxes {
  :deep(.p-accordion-header-link) {
    padding: 10px !important;
  }

  :deep(.p-accordion-content) {
    padding: 10px !important;
    // font-size:0.2rem !important;
  }

  :deep(.p-datatable-wrapper) {
    font-size: 80% !important;
  }

  :deep(td) {
    padding: 2px !important;

  }

  :deep(th) {
    padding: 2px !important;
  }

  :deep(.p-checkbox-box) {
    font-size: 70% !important;
    height: 70% !important;
    width: 70% !important;
    margin: auto !important;
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
    padding: 0.4rem 0.5rem !important;
    font-size: 0.9rem !important;
  }
}

#update-button {
  :deep(.p-button) {
    font-size: 0.75rem !important;
    // font-weight: 100 !important;
  }

  :deep(.p-button-label) {
    font-weight: 500 !important;
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