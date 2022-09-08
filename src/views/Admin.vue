<template>
  <div id="admin" class="w-full p-3 mx-auto mb-20">
    <div id="page-title" class="pb-2 font-semibold text-3xl text-center">
      Administration
    </div>
    <div id="admin-ui" class="rounded-lg bg-white shadow mx-10">
      <div class="p-3">
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
          <Column field="species" header="Species" sortable style="min-width: 10rem">
            <template #body="{data}">
              {{data.species}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by species"/>
            </template>
          </Column>
          <Column field="experiment" header="Experiment" sortable filterMatchMode="contains" style="min-width: 12rem">
            <template #body="{data}">
              {{data.experiment}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search by experiment"/>
            </template>
          </Column>
          <Column field="tissue" header="Tissue" sortable style="min-width: 12rem">
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
          <Column :exportable="false" headerStyle="width: 4rem; text-align: center" 
            bodyStyle="text-align: center; overflow: visible">
            <template #body="slotProps">
              <Button type="button" class="p-button-rounded" icon="pi pi-pencil" 
                @click="editDataset(slotProps.data)" />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="datasetDialogVisible" header="Dataset Details" 
          :modal="true" class="p-fluid w-2/3">
          <div class="formgrid grid">
            <div class="field col">
              <label for="species">Species</label>
              <InputText id="species" v-model.trim="dataset.species" required="true" 
                autofocus :class="{'p-invalid': submitted && !dataset.species}" />
              <small class="p-error" v-if="submitted && !dataset.species">
                Species is required.</small>
            </div>
            <div class="field col">
              <label for="tissue">Tissue</label>
              <InputText id="tissue" v-model.trim="dataset.tissue" required="true" 
                autofocus :class="{'p-invalid': submitted && !dataset.tissue}" />
              <small class="p-error" v-if="submitted && !dataset.tissue">
                Tissue is required.</small>
            </div>
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="experiment">Experiment</label>
              <InputText id="experiment" v-model.trim="dataset.experiment" required="true" 
                autofocus :class="{'p-invalid': submitted && !dataset.experiment}" />
              <small class="p-error" v-if="submitted && !dataset.experiment">
                Experiment is required.</small>
            </div>
            <div class="field col">
              <label for="year">Year</label>
              <InputNumber id="year" v-model="dataset.year" integeronly :useGrouping="false"/>
              <small class="p-error" 
                v-if="submitted && dataset.year && (dataset.year < 1900 || dataset.year > 2100)">
                Year is invalid.</small>
            </div>
          </div>
          <div class="field">
            <label for="institution">Institution</label>
            <InputText id="institution" v-model.trim="dataset.institution" required="true" 
              autofocus :class="{'p-invalid': submitted && dataset.institution.length > 100 }" />
            <small class="p-error" v-if="submitted && dataset.institution.length > 100">
              Institution must be less than 100 characters.</small>
          </div>
          <div class="flex flex-row items-center">
            <div class="basis-2/3">
              <label for="permissionGroups">Permission Groups</label>
              <MultiSelect v-model="selectedPermissionGroups" :options="permissionGroups"
                optionLabel="name" placeholder="Select Permission Groups" class="multiselect-custom"
                :filter="true" display="chip">
                <!-- <template #value="slotProps">
                  <div class="permission-item permission-item-value" v-for="option of slotProps.value" :key="option.name">
                    <div>{{option.name}}</div>
                  </div>
                  <template v-if="!slotProps.value || slotProps.value.length === 0">
                      Select Permission Groups
                  </template>
                </template> -->
                <template #option="slotProps">
                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="font-semibold pl-2 basis-3/12">{{slotProps.option.name}}</div> 
                      <div class="text-sm basis-7/12">{{slotProps.option.desc}}</div>
                      <div class="text-sm basis-1/12 text-right" 
                        :class="{ 'text-green-300': slotProps.option.read, 'text-red-300' :!slotProps.option.read }">Read</div>
                      <div class="text-sm basis-1/12 text-right" 
                        :class="{ 'text-green-300': slotProps.option.edit, 'text-red-300': !slotProps.option.edit }">Edit</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="basis-1/3 ml-3 mt-auto">
              <Button label="Create Group" @click="createPermissionGroup"/>
            </div>
          </div>
          <div class="field">
            <label for="otherInformation">Other Information</label>
            <Textarea id="otherInformation" v-model="dataset.otherInformation" required="false" rows="3" cols="20" />
          </div>
          <template #footer>
              <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog"/>
              <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveDataset" />
          </template>
        </Dialog>

        <Dialog v-model:visible="permissionGroupDialog" header="Create Permission Group" 
          :modal="true" class="p-fluid w-1/2">
          <div class="formgrid grid">
            <div class="field col">
              <label for="name">Group Name</label>
              <InputText id="name" v-model.trim="permissionGroup.name" required="true" 
                autofocus :class="{'p-invalid': permissionSubmitted && !permissionGroup.name}" />
              <small class="p-error" v-if="permissionSubmitted && !permissionGroup.name">
                Group name is required.</small>
            </div>
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="description">Description</label>
              <InputText id="description" v-model.trim="permissionGroup.description" 
                autofocus/>
            </div>
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="admins">Admins</label>
              <MultiSelect v-model="selectedAdmins" :options="users"
                optionLabel="name" placeholder="Select Admins" class="multiselect-custom"
                :filter="true" display="chip">
                <template #value="slotProps">
                  <div class="p-multiselect-token text-sm" v-for="option of slotProps.value" :key="option.uid">
                    {{option.firstName}}
                  </div>
                </template>
                <template #option="slotProps">

                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="text-sm basis-1/2">{{slotProps.option.firstName}} {{slotProps.option.lastName}}</div>
                      <div class="text-sm basis-1/2 text-right">{{slotProps.option.institution}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field col">
              <label for="adminGroups">Admin Groups</label>
              <MultiSelect v-model="selectedAdminGroups" :options="groups"
                optionLabel="name" placeholder="Select Admin Groups" class="multiselect-custom"
                :filter="true" display="chip">
                <template #value="slotProps">
                  <div class="p-multiselect-token text-sm" v-for="option of slotProps.value" :key="option.uid">
                    {{option.name}}
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="text-sm basis-1/3">{{slotProps.option.name}}</div>
                      <div class="text-sm basis-2/3 text-right">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="editors">Editors</label>
              <MultiSelect v-model="selectedEditors" :options="users"
                optionLabel="name" placeholder="Select Editors" class="multiselect-custom"
                :filter="true" display="chip">
                <template #value="slotProps">
                  <div class="p-multiselect-token text-sm" v-for="option of slotProps.value" :key="option.uid">
                    {{option.firstName}}
                  </div>
                </template>
                <template #option="slotProps">

                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="text-sm basis-1/2">{{slotProps.option.firstName}} {{slotProps.option.lastName}}</div>
                      <div class="text-sm basis-1/2 text-right">{{slotProps.option.institution}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field col">
              <label for="editorGroups">Editor Groups</label>
              <MultiSelect v-model="selectedEditorGroups" :options="groups"
                optionLabel="name" placeholder="Select Editor Groups" class="multiselect-custom"
                :filter="true" display="chip">
                <template #value="slotProps">
                  <div class="p-multiselect-token text-sm" v-for="option of slotProps.value" :key="option.uid">
                    {{option.name}}
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="text-sm basis-1/3">{{slotProps.option.name}}</div>
                      <div class="text-sm basis-2/3 text-right">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="admins">Readers</label>
              <MultiSelect v-model="selectedReaders" :options="users"
                optionLabel="name" placeholder="Select Readers" class="multiselect-custom"
                :filter="true" display="chip">
                <template #value="slotProps">
                  <div class="p-multiselect-token text-sm" v-for="option of slotProps.value" :key="option.uid">
                    {{option.firstName}}
                  </div>
                </template>
                <template #option="slotProps">

                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="text-sm basis-1/2">{{slotProps.option.firstName}} {{slotProps.option.lastName}}</div>
                      <div class="text-sm basis-1/2 text-right">{{slotProps.option.institution}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field col">
              <label for="adminGroups">Reader Groups</label>
              <MultiSelect v-model="selectedReaderGroups" :options="groups"
                optionLabel="name" placeholder="Select Reader Groups" class="multiselect-custom"
                :filter="true" display="chip">
                <template #value="slotProps">
                  <div class="p-multiselect-token text-sm" v-for="option of slotProps.value" :key="option.uid">
                    {{option.name}}
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="text-sm basis-1/3">{{slotProps.option.name}}</div>
                      <div class="text-sm basis-2/3 text-right">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
          </div>

        </Dialog>
      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode, FilterOperator } from 'primevue/api'

import Toast from 'primevue/toast'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'
import InputSwitch from 'primevue/inputswitch'

import _ from 'underscore'

import DataService from "@/services/DataService.js"

import { firestore } from "@/firebase/firebaseInit.js"
import { doc, collection, query, where, getDocs, addDoc, setDoc } from "firebase/firestore"

export default {
  name: "Admin",
  components: {
    DataTable,
    Column,
    InputText,
    Button,
    Textarea,
    InputNumber,
    Dialog,
    MultiSelect,
    InputSwitch,

  },
  data() {
    return {
      adminEmail: "",
      functionMsg: null,

      db_metadata: null,
      owned_datasets: null,
      selected_datasets: null,
      dataset: {},

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
      submitted: false,
      datasetDialog: false,

      permissionGroups: [
        {
          'name': 'Public',
          'description': 'Freely available to all users.',
          'admins': [],
          'adminGroups': [],
          'editors': [],
          'editorGroups': [],
          'readers': [],
          'readerGroups': [],
        },
        {
          'name': 'Salk',
          'description': 'Only available to Salk users.',
          'admins': [],
          'adminGroups': [],
          'editors': [],
          'editorGroups': [],
          'readers': [],
          'readerGroups': [],
        },
        {
          'name': 'Admin',
          'description': 'Full read and edit permissions.',
          'admins': [],
          'adminGroups': [],
          'editors': [],
          'editorGroups': [],
          'readers': [],
          'readerGroups': [],
        }
      ],
      selectedPermissionGroups: null,

      permissionGroupDialog: false,
      permissionGroup: {},
      permissionSubmitted: false,

      users: [],
      selectedAdmins: [],
      selectedEditors: [],
      selectedReaders: [],
      groups: [],
      selectedAdminGroups: [],
      selectedEditorGroups: [],
      selectedReaderGroups: [],
    }
  },
  computed: {
    datasetDialogVisible() {
      return this.datasetDialog && !this.permissionGroupDialog
    },
  },
  mounted() {
    this.getOwnedDatasets()
  },
  methods: {
    async load_metadata() {
      this.db_metadata = await DataService.getDatasetsMetadata().then(e => e.data)
    },
    async getOwnedDatasets() {
      console.log('getOwnedDatasets')
      const start = Date.now()
      await Promise.all([
        this.load_metadata(),
        this.getUsers(),
        this.getGroups(),
      ])
      // this.db_metadata = await DataService.getDatasetsMetadata().then(e => e.data)
      // Parse gender and condition fields, convert integer fields
      this.db_metadata.forEach(e => {
        const genderStr = e.gender.replaceAll(/[']+/g, '"')
        e.gender = JSON.parse(genderStr)
        const conditionStr = e.condition.replaceAll(/[']+/g, '"')
        e.condition = JSON.parse(conditionStr)
        e.year = parseInt(e.year)
      
      })
      const userId = this.$store.state.profileId
      this.owned_datasets = this.db_metadata.filter(e => e.owner == userId)
      this.loading = false
    },
    editDataset(d) {
      // console.log('editDataset')
      // console.log(d)
      this.datasetDialog = true
      this.dataset = {...d}
      // console.log('this.dataset')
      // console.log(this.dataset)
    },
    hideDialog() {
      this.datasetDialog = false
      this.submitted = false
    },
    saveDataset() {
      this.submitted = true
      if (this.dataset.species.trim()) {
        this.datasetDialog = false;
        this.dataset = {};
      }
    },
    async createPermissionGroup() {
      this.permissionGroup = {
        'name': null,
        'description': null,
        'admins': [],
        'adminGroups': [],
        'editors': [],
        'editorGroups': [],
        'readers': [],
        'readerGroups': [],
        'datasets': [],
      }
      this.permissionGroupDialog = true
      
    },
    hidePermissionGroupDialog() {
      this.permissionGroupDialog = false

    },
    async addAdmin() {
      const addAdmin = await firebase.functions().httpsCallable("addAdminRole");
      const result = await addAdmin({ email: this.adminEmail });
      this.functionMsg = result.data.message;
    },
    async getUsers() {
      console.log('getUsers')
      const q = query(collection(firestore, "users"))
      const querySnapshot = await getDocs(q);
      this.users = []
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        this.users.push({ 
          uid : doc.id,
          ...doc.data()
        })
      });
    },
    async getGroups() {
      console.log('getGroups')
      const q = query(collection(firestore, "permission_groups"))
      const querySnapshot = await getDocs(q);
      this.groups = []
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        this.groups.push({ 
          group_id : doc.id,
          ...doc.data()
        })
      });
    }
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

:deep(.multiselect-custom) {
  .p-multiselect-label:not(.p-placeholder) {
    padding-top: .25rem;
    padding-bottom: .25rem;
  }

  .permission-item-value {
    padding: .25rem .5rem;
    border-radius: 3px;
    display: inline-flex;
    margin-right: .5rem;
    background-color: lightblue;
    color: white;
  }
}



</style>