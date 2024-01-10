<template>
  <div id="frame">
    <div id="datasets">
      <DataTable :value="datasets" :paginator="true" :rows="10"
          dataKey="sample_metadata_table_name" :rowHover="true" v-model:selection="selected_datasets"
          v-model:filters="filters" :loading="this.loading" filterDisplay="menu"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" 
          :rowsPerPageOptions="[10,25,50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          :globalFilterFields="['experimentName','description','doi', 'tissues',
            'timePoints','organism', 'conditions', 'genders','institution']" 
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <h5 class="m-0">Datasets</h5>
              <span class="p-input-icon-left mr-0">
                  <i class="pi pi-search" />
                  <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
              </span>
            </div>
          </template>
          <template #empty>
              No datasets found.
          </template>
          <template #loading>
              Loading datasets. Please wait.
          </template>
          <Column field="experimentName" header="Dataset" sortable style="min-width: 10rem">
            <template #body="{data}">
              {{data.experimentName}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by dataset name"/>
            </template>
          </Column>

          <Column field="description" header="Description" style="min-width: 10rem">
            <template #body="{data}">
              {{data.description}}
            </template>
            <!-- <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by description"/>
            </template> -->
          </Column>

          <Column field="doi" header="DOI" style="min-width: 10rem">
            <template #body="{data}">
              {{data.doi}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by DOI"/>
            </template>
          </Column>

          <Column field="tissues" header="Tissues" filterMatchMode="contains" style="min-width: 12rem">
            <template #body="{data}">
              <div v-if="data.tissues.length === 1">
                {{ data.tissues[0] }}
              </div>
              <div v-else @mouseover="showPanel($event, data)" @mouseout="hidePanel(data)">

                {{ data.tissues.length }} tissues
                <OverlayPanel :ref="getOverlayRef(data.experimentName)" :showCloseIcon="false" :dismissable="true">
                  <div v-if="currentHoveredData === data" class="flex">
                    <div class="w-full lg:w-1/2 mr-2" 
                      
                      >
                      <ul>
                        <li v-for="(tissue, index) in getTissuesForColumn(data.tissues, 1)" :key="index">
                          {{ tissue }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="data.tissues.length > 20" class="w-full lg:w-1/2 ml-2" 
                      
                      >
                      <ul>
                        <li v-for="(tissue, index) in getTissuesForColumn(data.tissues, 2)" :key="index">
                          {{ tissue }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </OverlayPanel>

              </div>
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by tissue"/>
            </template>
          </Column>

          <Column field="timePoints" header="Time Points (ZT)"
            style="max-width: 10rem">
            <template #body="{data}">
              {{data.timePoints.join(', ')}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by time points"/>
            </template>
          </Column>

          <Column field="organism" header="Organism" sortable filterMatchMode="contains"  
            style="min-width: 10rem">
            <template #body="{data}">
              {{data.organism}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by organism"/>
            </template>
          </Column>
        
          <Column field="conditions" header="Conditions" sortable filterMatchMode="contains"  
            style="min-width: 6rem">
            <template #body="{data}">
              {{ data.conditions.join(', ') }}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by conditions"/>
            </template>
          </Column>
          <Column field="genders" header="Sex" filterMatchMode="contains" 
            style="min-width: 6rem">
            <template #body="{data}">
              {{data.genders.join(', ')}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by conditions"/>
            </template>
          </Column>
          <Column field="institution" header="Institution" sortable filterMatchMode="contains"  
            style="min-width: 14rem">
            <template #body="{data}">
              {{data.institution}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by institution"/>
            </template>
          </Column>
          
      </DataTable>
    </div>
  </div>

  
</template>

<script>
import { FilterMatchMode, FilterOperator } from 'primevue/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import OverlayPanel from 'primevue/overlaypanel'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ToggleButton from 'primevue/togglebutton'
import { PaperClipIcon } from '@heroicons/vue/solid'
import { auth } from "@/firebase/firebaseInit";
import { getAuth } from "firebase/auth";

// in your Vue file
import 'primevue/resources/primevue.min.css';
import 'primevue/resources/themes/saga-blue/theme.css'; // replace with your chosen theme
import 'primeicons/primeicons.css';


// Testing
import DataService from "@/services/DataService.js"

// PaperClipIcon

export default {
  name: "Datasets",
  components : {
    DataTable,
    Column,
    OverlayPanel,
    Dialog,
    Button,
    InputText,
    ToggleButton,
    PaperClipIcon,
  },
  data() {
    return {
      loading: true,

      db_metadata: [],
      datasets: [],
      selected_datasets: [],

      filters: {
        'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
        'organism': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        'experimentName': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        'tissues': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]}, 
        'institution': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        'timePoints': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]}, 
      },

      
      currentHoveredData: null,

    }
  },
  // async mounted() {
  //   console.log('Datasets mounted')

  //   let formData = new FormData() 

  //   // Bug - Returns null if session is new
  //   let token = this.$store.getters.getToken
  //   formData.append('authorization', token)
  //   let api_result = await DataService.testAuth(formData)
  //   console.log('api_result')
  //   console.log(api_result)

  //   await this.load_metadata()

  //   console.log('db_metadata')
  //   console.log(this.db_metadata)

  //   this.process_datasets()

  //   console.log('datasets')
  //   console.log(this.datasets)

  //   this.loading = false



  // },
  methods: {
    async load_metadata() {
      console.log('load_metadata')
      let formData = new FormData() 
      let token = this.$store.getters.getToken
      formData.append('authorization', token)
      console.log('formData')
      console.log(formData)
      this.db_metadata = await DataService.getDatasetsMetadata(formData).then(e => e.data)
    },
    process_datasets() {
      console.log('process_datasets')
      console.log(this.db_metadata)
      
      let groupedData = this.db_metadata.reduce((acc, obj) => {
        // // Create experiment name combining obj.experiment and obj.year
        // let experimentName = `${obj.experiment} ${obj.year}`;
        // Experiment is only obj.experiment
        let experimentName = `${obj.experiment}`;
        
        // If this experiment name doesn't exist in the accumulator object, initialize it
        if (!acc[experimentName]) {
          acc[experimentName] = {
            experimentName,
            description: obj.otherInformation,
            doi: obj.doi,
            institution: obj.institution,
            tissues: [obj.tissue],
            timePoints: obj.time_points.map(function(string) {
              return string.replace('ZT', '');
            }),
            organism: obj.species,
            conditions: JSON.parse(obj.condition.replace(/'/g, '"')).map(conditionObj => conditionObj.condition),
            genders: JSON.parse(obj.gender.replace(/'/g, '"')).map(genderObj => genderObj.gender)
          };
        } else {
          // If this experiment name already exists, append new tissue to the tissues array
          acc[experimentName].tissues.push(obj.tissue);

          // Add unique conditions and genders
          const newConditions = JSON.parse(obj.condition.replace(/'/g, '"')).map(conditionObj => conditionObj.condition);
          const newGenders = JSON.parse(obj.gender.replace(/'/g, '"')).map(genderObj => genderObj.gender);

          newConditions.forEach(condition => {
            if (!acc[experimentName].conditions.includes(condition)) {
              acc[experimentName].conditions.push(condition);
            }
          });

          newGenders.forEach(gender => {
            if (!acc[experimentName].genders.includes(gender)) {
              acc[experimentName].genders.push(gender);
            }
          });
        }

        return acc;
      }, {});

      // Convert the grouped data object to an array
      this.datasets = Object.values(groupedData);

    },
    showPanel(event, data) {
      console.log('showPanel')
      console.log(event)
      console.log(data)
        this.currentHoveredData = data;
        this.$refs[this.getOverlayRef(data.experimentName)].show(event);
    },
    hidePanel(data) {
      console.log('hidePanel')
      console.log(data)
        this.$refs[this.getOverlayRef(data.experimentName)].hide();
        this.currentHoveredData = null;
    },
    getOverlayRef(name) {
        return `overlayPanel-${name}`;
    },
    getTissuesForColumn(tissues, column) {
      if (tissues.length > 20) {
        if (column === 1) {
          return tissues.slice(0, Math.ceil(tissues.length / 2));
        } else {
          return tissues.slice(Math.ceil(tissues.length / 2));
        }
      } else {
        return tissues;
      }
    },
    longestTissueLength(tissues) {
      let longestLength = 0;
      tissues.forEach(tissue => {
        const length = tissue.length;
        if (length > longestLength) {
          longestLength = length;
        }
      });
      return longestLength;
    },


  },
  watch: {
    '$store.state.token': {
      handler: async function (token) {
        // if user is logged in and token is not available, wait
        if (this.$store.state.user && !token) {
          return;
        }

        token = this.$store.getters.getToken

        console.log('Datasets mounted')

        let formData = new FormData()

        
        formData.append('authorization', token)
        

        let api_result = await DataService.testAuth(formData)
        console.log('api_result')
        console.log(api_result)

        await this.load_metadata()

        console.log('db_metadata')
        console.log(this.db_metadata)

        this.process_datasets()

        console.log('datasets')
        console.log(this.datasets)

        this.loading = false
      },
      immediate: true,
    },
  }


}
</script>

<style  scoped>
:deep(.p-disabled) { 
  fill:black;

}
</style>