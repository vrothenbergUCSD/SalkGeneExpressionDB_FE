<template>
  <div id="admin" class="w-full p-3 mx-auto mb-20">
    <div id="page-title" class="pb-2 font-semibold text-3xl text-center">
      Administration
    </div>
    <div id="admin-ui" class="">
      <DataTable :value="owned_datasets" :paginator="true" :rows="10"
      dataKey="sample_metadata_table_name" :rowHover="true" v-model:selection="selected_datasets"
      v-model:filters="filters" filterDisplay="menu" :loading="loading"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" 
      :rowsPerPageOptions="[10,25,50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
      :globalFilterFields="['species','experiment','tissue','year','institution']" responsiveLayout="scroll"
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
      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
      <Column field="species" header="Species" sortable style="min-width: 14rem">
        <template #body="{data}">
          {{data.species}}
        </template>
        <template #filter="{filterModel}">
          <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
            placeholder="Search by species"/>
        </template>
      </Column>
      <Column field="experiment" header="Experiment" sortable filterMatchMode="contains" style="min-width: 14rem">
        <template #body="{data}">
          {{data.experiment}}
        </template>
        <template #filter="{filterModel}">
          <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search by experiment"/>
        </template>
      </Column>
      <Column field="tissue" header="Tissue" sortable style="min-width: 14rem">
        <template #body="{data}">
          {{data.tissue}}
        </template>
        <template #filter="{filterModel}">
          <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
            placeholder="Search by tissue"/>
        </template>
      </Column>
      <Column field="institution" header="Institution" sortable style="min-width: 14rem">
        <template #body="{data}">
          {{data.institution}}
        </template>
        <template #filter="{filterModel}">
          <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
            placeholder="Search by institution"/>
        </template>
      </Column>
      <Column field="year" header="Year" sortable style="min-width: 6rem">
        <template #body="{data}">
          {{data.year}}
        </template>
        <template #filter="{filterModel}">
          <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
            placeholder="Search by year"/>
        </template>
      </Column>
      <Column headerStyle="width: 4rem; text-align: center" bodyStyle="text-align: center; overflow: visible">
        <template #body>
            <Button type="button" icon="pi pi-cog" @click="edit_dataset"></Button>
        </template>
      </Column>



      </DataTable>


    </div>
  </div>
</template>

<script>
// import firebase from "firebase/app";
import "firebase/functions";
import { getAuth } from "firebase/auth";
import {FilterMatchMode,FilterOperator} from 'primevue/api';

import Toast from 'primevue/toast'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import AutoComplete from "primevue/autocomplete"
import TabMenu from 'primevue/tabmenu'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'


import _ from 'underscore'

import DataService from "@/services/DataService.js"

export default {
  name: "Admin",
  components: {
    DataTable,
    Column,
    InputText,
    Button,

  },
  data() {
    return {
      adminEmail: "",
      functionMsg: null,

      db_metadata: null,
      owned_datasets: null,
      selected_datasets: null,
      filters: {
        'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
        'species': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.STARTS_WITH}]},
        'experiment': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.STARTS_WITH}]},
        // 'representative': {value: null, matchMode: FilterMatchMode.IN},
        // 'date': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
        // 'balance': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.EQUALS}]},
        // 'status': {operator: FilterOperator.OR, constraints: [{value: null, matchMode: FilterMatchMode.EQUALS}]},
        // 'activity': {value: null, matchMode: FilterMatchMode.BETWEEN},
        // 'verified': {value: null, matchMode: FilterMatchMode.EQUALS}
      },
      loading: true,
    };
  },
  mounted() {
    this.get_owned_datasets()


  },
  methods: {
    async get_owned_datasets() {
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

      console.log(this.db_metadata)
      const userId = this.$store.state.profileId
      this.owned_datasets = this.db_metadata.filter(e => e.owner == userId)
      console.log(this.owned_datasets)
      this.loading = false
      
    },
    edit_dataset(evt, d) {
      console.log('edit_dataset')
      console.log(evt)
      console.log(d)

    },
    async addAdmin() {
      const addAdmin = await firebase.functions().httpsCallable("addAdminRole");
      const result = await addAdmin({ email: this.adminEmail });
      this.functionMsg = result.data.message;
    },
  },
}
</script>

<style lang="scss" scoped>
:deep(.p-paginator) {
  .p-paginator-current {
      margin-left: auto;
  }
}

:deep(.p-datatable) {
    .p-datatable-header {
        padding: 1rem;
        text-align: left;
        font-size: 1.5rem;
    }

    .p-paginator {
        padding: 1rem;
    }

    .p-datatable-thead > tr > th {
        text-align: left;
    }

    .p-datatable-tbody > tr > td {
        cursor: auto;
    }

    .p-dropdown-label:not(.p-placeholder) {
        text-transform: uppercase;
    }
}



</style>