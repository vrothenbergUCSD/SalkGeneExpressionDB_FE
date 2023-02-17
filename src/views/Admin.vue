<template>
  <div id="admin" class="w-full p-3 mx-auto mb-20">
    <div id="page-title" class="pb-2 font-semibold text-3xl text-center">
      Administration
    </div>
    <Toast />
    <div id="admin-ui" class="rounded-lg bg-white shadow mx-10">
      <PermissionGroups/>
      <div id="owned-datasets" class="p-3">
        <DataTable :value="owned_datasets" :paginator="true" :rows="10"
          dataKey="sample_metadata_table_name" :rowHover="true" v-model:selection="selected_datasets"
          v-model:filters="filters" filterDisplay="menu" :loading="loading"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" 
          :rowsPerPageOptions="[10,25,50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          :globalFilterFields="['species','experiment','tissue','year','institution']" 
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
          <Column :exportable="false" headerStyle="width: 3rem; text-align: center" 
            bodyStyle="text-align: center; overflow: visible">
            <template #body="slotProps">
              <Button type="button" class="p-button-rounded p-button-sm" icon="pi pi-pencil" 
                @click="editDataset(slotProps.data)" />
            </template>
          </Column>
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
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by experiment"/>
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
          
        </DataTable>

        <Dialog v-model:visible="datasetDialogVisible" header="Dataset Details" 
          :modal="true" class="p-fluid w-2/3 min-w-[510px]">
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

          <div id="gene_expression" class="field">
            <div id="upload_gene_expression_data_error_panel" v-show="this.upload_gene_expression_data_error" class="my-3">
              <Panel header="Gene Expression Data Error Log" class="p-error">
                <ScrollPanel style="width: 100%; height: 200px" class="custom">
                  <li v-for="error in this.upload_gene_expression_data_error_log">
                    {{ error }}
                  </li>
                </ScrollPanel>
              </Panel>
            </div>

            <div class="flex items-center content-center my-1">
              <div class="text-lg font-medium w-1/3">Select gene expression CSV</div>
              <div class="ml-5">
                <FileUpload mode="basic" :class="{ 'p-button-warning': this.upload_gene_expression_data_highlight }"
                  name="upload_gene_expression_data" 
                  :chooseLabel="upload_gene_expression_data_filename" :auto="true" 
                  :customUpload="true" accept=".csv" :maxFileSize="100000000" 
                  @uploader="upload_gene_expression_data" />
              </div>
            </div>
          </div>

          <div id="gene_metadata" class="field">
            <div id="upload_gene_metadata_error_panel" v-show="this.upload_gene_metadata_error" class="my-3">
              <Panel header="Gene Metadata Error Log" class="p-error">
                <ScrollPanel style="width: 100%; height: 200px" class="custom">
                  <li v-for="error in this.upload_gene_metadata_error_log">
                    {{ error }}
                  </li>
                </ScrollPanel>
              </Panel>
            </div>

            <div class="flex items-center content-center my-1">
              <div class="text-lg font-medium w-1/3">Select gene metadata CSV</div>
              <div class="ml-5">
                <FileUpload mode="basic" :class="{ 'p-button-warning': this.upload_gene_metadata_highlight }"
                  name="upload_gene_metadata" 
                  :chooseLabel="upload_gene_metadata_filename" :auto="true" 
                  :customUpload="true" accept=".csv" :maxFileSize="100000000" 
                  @uploader="upload_gene_metadata" />
              </div>
            </div>
          </div>

          <div id="sample_metadata" class="field">
            <div id="upload_sample_metadata_error_panel" v-show="this.upload_sample_metadata_error" class="my-3">
              <Panel header="Sample Metadata Error Log" class="p-error">
                <ScrollPanel style="width: 100%; height: 200px" class="custom">
                  <li v-for="error in this.upload_sample_metadata_error_log">
                    {{ error }}
                  </li>
                </ScrollPanel>
              </Panel>
            </div>

            <div class="flex items-center content-center my-1">
              <div class="text-lg font-medium w-1/3">Select sample metadata CSV</div>
              <div class="ml-5">
                <FileUpload mode="basic" :class="{ 'p-button-warning': upload_sample_metadata_highlight }"
                  name="upload_gene_expression_data" 
                  :chooseLabel="upload_sample_metadata_filename" :auto="true" 
                  :customUpload="true" accept=".csv" :maxFileSize="100000000" 
                  @uploader="upload_sample_metadata" />
              </div>
            </div>

          </div>


          <div id="permissions-info" class="py-1">
            <div class="font-semibold">
              Permissions
            </div>
            <div class="text-sm">
              <p>Grant specific permissions to corresponding users from a permission group.</p>
              <p>Only the admin users for a group selected as an admin group will have administrative permissions.</p>
              <p>The reader users will not have additional permissions.</p>
            </div>
          </div>
          <div class="flex flex-row items-center">
            <div class="basis-1/3 pr-1">
              <label for="admin_groups">Admin Groups</label>
              <MultiSelect v-model="selected_admin_groups" :options="groups"
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
                      <div class="text-sm basis-2/3 text-right truncate">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="basis-1/3 px-1">
              <label for="editor_groups">Editor Groups</label>
              <MultiSelect v-model="selected_editor_groups" :options="groups"
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
                      <div class="text-sm basis-2/3 text-right truncate">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="basis-1/3 pl-1">
              <label for="reader_groups">Reader Groups</label>
              <MultiSelect v-model="selected_reader_groups" :options="groups"
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
                      <div class="text-sm basis-2/3 text-right truncate">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <!-- <div class="basis-2/3">
              <label for="permissionGroups">Permission Groups</label>
              <MultiSelect v-model="selectedPermissionGroups" :options="groups"
                optionLabel="name" placeholder="Select Permission Groups" class="multiselect-custom"
                :filter="true" display="chip">
                <template #option="slotProps">
                  <div class="permission-item w-full">
                    <div class="flex flex-row items-center">
                      <div class="font-semibold pl-2 basis-4/12 min-w[30px]">{{slotProps.option.name}}</div> 
                      <div class="text-sm basis-6/12 text-right truncate">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div> -->
          
          </div>
          <div class="field">
            <label for="otherInformation">Other Information</label>
            <Textarea id="otherInformation" v-model="dataset.otherInformation" required="false" rows="3" cols="20" />
          </div>
          <template #footer>
              <Button label="Cancel" icon="pi pi-times" class="p-button-text" 
                @click="hideDatasetDialog" :disabled="submitted"/>
              <Button label="Save" icon="pi pi-check" class="p-button-text" 
                @click="saveDataset" :loading="submitted" />
          </template>
        </Dialog>

      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode, FilterOperator } from 'primevue/api'

import Toast from 'primevue/toast'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'
import InputSwitch from 'primevue/inputswitch'
import FileUpload from 'primevue/fileupload'
import Panel from 'primevue/panel'
import ScrollPanel from 'primevue/scrollpanel'

import _ from 'underscore'

import DataService from "@/services/DataService.js"

import { storage, firestore } from "@/firebase/firebaseInit.js"
import { doc, collection, query, where, getDocs, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import PermissionGroups from '@/components/admin/PermissionGroups.vue'

export default {
  name: "Admin",
  components: {
    Toast,
    DataTable,
    Column,
    InputText,
    Button,
    Textarea,
    InputNumber,
    Dialog,
    MultiSelect,
    InputSwitch,
    FileUpload,
    Panel,
    ScrollPanel,
    PermissionGroups
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
        'species': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        'experiment': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        'tissue': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]}, 
        'institution': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        'year': {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]}, 
      },
      loading: true,
      owned_groups: null,
      selected_groups: null,

      submitted: false,
      datasetDialog: false,
      selectedPermissionGroups: null,

      permissionGroupDialog: false,
      permissionGroup: {},
      permissionSubmitted: false,

      users: [],
      selected_admin_users: [],
      selected_editor_users: [],
      selected_reader_users: [],
      groups: [],
      selected_admin_groups: [],
      selected_editor_groups: [],
      selected_reader_groups: [],

      editPermissionGroupDialog: false,
      editPermissionSubmitted: false,

      upload_gene_metadata_error: null,
      upload_gene_metadata_error_log: [],
      upload_gene_metadata_filename: 'Select', 
      upload_gene_metadata_file: null,
      upload_gene_metadata_highlight: null,

      upload_sample_metadata_error: null,
      upload_sample_metadata_error_log: [],
      upload_sample_metadata_filename: 'Select', 
      upload_sample_metadata_file: null,
      upload_sample_metadata_highlight: null,

      upload_gene_expression_data_error: null,
      upload_gene_expression_data_error_log: [],
      upload_gene_expression_data_filename: 'Select', 
      upload_gene_expression_data_file: null,
      upload_gene_expression_data_highlight: null, 

      uploadMsg: null,
      upload_files_error: null, 
      upload_files_error_log: null, 
      upload_progress: 0,
      uploading:null,

      conditions_json: null,
      genders_json: null,

      deletePermissionGroupDialog: false,
      deletePermissionGroupSubmitted: false,

    }
  },
  computed: {
    datasetDialogVisible: {
      get() {
        return this.datasetDialog && !this.permissionGroupDialog
      },
      set(newValue) {
        this.datasetDialog = newValue
      }
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
        this.getOwnedGroups(),
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
      this.datasetDialog = true
      this.dataset = {...d}
    },
    hideDatasetDialog() {
      this.datasetDialog = false
      this.submitted = false
    },
    async saveDataset() {
      this.submitted = true
      if (this.dataset.species.trim()) {
        this.datasetDialog = false;
        this.dataset = {};
      }

      let validation_error = false

      // Validate
      if (!this.dataset.species) {
        // Species required
        validation_error = true
      }

      if (!this.dataset.tissue) {
        // Tissue required
        validation_error = true
      }

      if (!this.dataset.experiment) {
        // Experiment required 
        validation_error = true
      }

      if (!this.dataset.year) {
        // Year required
        validation_error = true
      } else if (this.dataset.year < 1900 || this.dataset.year > 2100) {
        // Year must be non-silly
        validation_error = true
      }

      if (this.institution && this.institution.length > 100) {
        // Institution must be less than 100 characters
        validation_error = true
      }

      if (validation_error) {
        this.submitted = false
        return
      }


      const docRef = doc(firestore, "datasets", this.dataset.id)
      await updateDoc(docRef, {
        doi: this.dataset.doi,
        experiment: this.dataset.experiment, 
        gene_expression_data_table_name: this.dataset.gene_expression_data_table_name,
        gene_metadata_table_name: this.dataset.gene_metadata_table_name, 
        institution: this.dataset.institution, 
        otherInformation: this.dataset.otherInformation,
        sample_metadata_table_name: this.dataset.sample_metadata_table_name,
        species: this.dataset.species,
        tissue: this.dataset.tissue,
        year: this.dataset.year,
        reader_groups: this.selected_reader_groups.map(group => group.group_id), 
        editor_groups: this.selected_editor_groups.map(group => group.group_id), 
        admin_groups: this.selected_admin_groups.map(group => group.group_id),
      })

      let api_result = await this.post_dataset()

      console.log('api_result')
      console.log(api_result)
      if (api_result.status != 200) {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'HTTP Error', life: 10000});
        this.upload_files_error = true
        this.upload_files_error_log.push(`ERROR: ${api_result.statusText}`)
      } else {
        this.$toast.add({severity: 'success', summary: 'Success', detail: 'Dataset Uploaded', life: 10000});
        console.log('BigQuery: Successfully uploaded dataset tables.')
      }

      for (let i = 0; i < api_result.data.errorLog.length; i++) {
        if (api_result.data.errorLog[i].length > 0) {
          this.upload_files_error_log.concat(api_result.data.errorLog[i]) 
        }
      } 

      if (this.upload_files_error_log.length > 0) {
        this.$toast.add({severity: 'error', summary: 'Error', detail: 'Error Uploading', life: 10000});
      }

      this.permissionSubmitted = false
      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])
      
      this.hideDatasetDialog()
    },
    async createPermissionGroup() {
      this.permissionGroup = {
        'name': null,
        'description': null,
        'admin_users': [],
        'admin_groups': [],
        'editor_users': [],
        'editor_groups': [],
        'reader_users': [],
        'reader_groups': [],
        'datasets': [],
      }
      this.selected_admin_users = this.users
        .filter(user => user.uid == this.$store.state.profileId)
      this.permissionGroupDialog = true      
    },
    hidePermissionGroupDialog() {
      this.permissionGroupDialog = false
    },
    async savePermissionGroup(event) {
      console.log('savePermissionGroup')
      this.permissionSubmitted = true 
      if (!this.permissionGroup.name) {
        // Name required
        return
      }

      if (this.permissionGroup.description && this.permissionGroup.description.length > 100) {
        // Description too long
        return 
      }

      // Update user information, set roles 
      this.permissionGroup.admin_users.forEach((u) => {
        console.log('admin: ', u)
        console.log(u)
      })
      
      // Save to Firestore
      const docRef = await addDoc(collection(firestore, 'permission_groups'), {
        name: this.permissionGroup.name,
        datasets: [],
        description: this.permissionGroup.description, 
        owner: this.$store.state.profileId,
        admin_users: this.selected_admin_users.map(user => user.uid), 
        admin_groups: this.selected_admin_groups.map(group => group.group_id), 
        editor_users: this.selected_editor_users.map(user => user.uid),
        editor_groups: this.selected_editor_groups.map(group => group.group_id),
        reader_users: this.selected_reader_users.map(user => user.uid),
        reader_groups: this.selected_reader_groups.map(group => group.group_id), 
      })

      this.permissionSubmitted = false
      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])
      
      this.hidePermissionGroupDialog()
    },
    showDeletePermissionGroupDialog() {
      this.deletePermissionGroupDialog = true
    },
    hideDeletePermissionGroupDialog() {
      this.deletePermissionGroupDialog = false
      this.deletePermissionGroupSubmitted = false
    },
    async deletePermissionGroup() {
      this.deletePermissionGroupSubmitted = true
      console.log('deletePermissionGroup')
      const docRef = doc(firestore, "permission_groups", this.permissionGroup.group_id)
      await deleteDoc(docRef)
      
      this.hideDeletePermissionGroupDialog()
      this.hideEditPermissionGroupDialog()
    },
    async getUsers() {
      console.log('getUsers')
      const q = query(collection(firestore, "users"))
      const querySnapshot = await getDocs(q);
      this.users = []
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
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
        // console.log(doc.id, " => ", doc.data());
        this.groups.push({ 
          group_id : doc.id,
          ...doc.data()
        })
      });
    },
    async getOwnedGroups() {
      console.log('getOwnedGroups')
      // TODO: Check if admin group is in permission group
      const q = query(collection(firestore, "permission_groups"), 
        where('admin_users', 'array-contains', this.$store.state.profileId))
      const querySnapshot = await getDocs(q);
      this.owned_groups = []
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        this.owned_groups.push({ 
          group_id : doc.id,
          ...doc.data()
        })
      });
    },
    convertUserIDs(arr) {
      if (!arr) return []
      const filtered_users = this.users.filter(user => arr.includes(user.uid))
        .map(user => `${user.firstName}`)
      return filtered_users
    },
    convertGroupIDs(arr) {
      if (!arr) return []
      const filtered_groups = this.groups.filter(group => arr.includes(group.group_id))
        .map(group => group.name)
      return filtered_groups
    },
    editPermissionGroup(d) {
      console.log('editPermissionGroup')
      this.editPermissionGroupDialog = true 
      this.permissionGroup = {...d}
      console.log('this.permissionGroup')
      console.log(this.permissionGroup)
      // TODO: Possible performance issues when filtering and users array is large, O(n*m)
      this.selected_admin_users = this.users.filter(user => this.permissionGroup.admin_users.includes(user.uid))
      this.selected_admin_groups = this.groups.filter(group => this.permissionGroup.admin_groups.includes(group.group_id))
      this.selected_editor_users = this.users.filter(user => this.permissionGroup.editor_users.includes(user.uid))
      this.selected_editor_groups = this.groups.filter(group => this.permissionGroup.editor_groups.includes(group.group_id))
      this.selected_reader_users = this.users.filter(user => this.permissionGroup.reader_users.includes(user.uid))
      this.selected_reader_groups = this.groups.filter(group => this.permissionGroup.reader_groups.includes(group.group_id))
    },
    hideEditPermissionGroupDialog() {
      this.editPermissionGroupDialog = false 
      this.editPermissionSubmitted = false
    },
    async updatePermissionGroup() {
      this.editPermissionSubmitted = true
      // TODO: Validation error
      let validation_error = false

      if (!this.permissionGroup.name) {
        // Name required
        validation_error = true
      } else if (this.permissionGroup.name.length > 100) {
        // Name too long
        validation_error = true
      }

      if (this.permissionGroup.description && this.permissionGroup.description.length > 100) {
        // Description too long
        validation_error = true
      }

      if (validation_error) {
        this.editPermissionSubmitted = false
        return
      }

      console.log('this.permissionGroup')
      console.log(this.permissionGroup)

      const group_id = this.permissionGroup.group_id

      // await Promise.all([
      //   this.updateUsers(this.selected_admin_users, 'admin', group_id),
      //   this.updateUsers(this.selected_editor_users, 'editor', group_id),
      //   this.updateUsers(this.selected_reader_users, 'reader', group_id),
      //   this.updateGroups(this.selected_admin_groups, 'admin', group_id),
      //   this.updateGroups(this.selected_editor_groups, 'editor', group_id),
      //   this.updateGroups(this.selected_reader_groups, 'reader', group_id),
      // ])

      const docRef = doc(firestore, "permission_groups", this.permissionGroup.group_id)
      await updateDoc(docRef, {
        name: this.permissionGroup.name,
        group_id: this.permissionGroup.group_id,
        description: this.permissionGroup.description, 
        datasets: this.permissionGroup.datasets,
        admin_users: this.selected_admin_users.map(user => user.uid), 
        admin_groups: this.selected_admin_groups.map(group => group.group_id), 
        editor_users: this.selected_editor_users.map(user => user.uid),
        editor_groups: this.selected_editor_groups.map(group => group.group_id),
        reader_users: this.selected_reader_users.map(user => user.uid),
        reader_groups: this.selected_reader_groups.map(group => group.group_id), 
      })

      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])
      
      this.hideEditPermissionGroupDialog()

    },
    async updateUsers(selected_users, user_type, group_id) {
      await Promise.all(selected_users.map(async (user) => {
        this.updateUserPermissions(user, user_type, group_id)
      }))
    },
    async updateUserPermissions(user, user_type, group_id) {
      // Add permission group ID if it does not already exist
      if (user && user_type in user && user[user_type].indexOf(group_id) === -1) {
        console.log('Updating permission', user.name, user_type, group_id)
        user[user_type].push(group_id)
        const docRef = doc(firestore, "users", user.uid)
        const update_obj = {}
        update_obj[user_type] = user[user_type]
        await updateDoc(docRef, update_obj)
      }
    },
    async updateGroups(selected_groups, user_type, group_id) {
      console.log('updateGroups')
      // Cascade update roles of all users in inherited permission groups 
      await Promise.all(selected_groups.map(async (group) => {
        this.updateUsers(group[`${user_type}_users`], user_type, group_id)
      }))
    },
    description(d) {
      return d.length < 50 ? d : d.substring(0,50) + "..."
    },

    // Data.vue methods
    startProgress() {
      // 30 second progress bar
      this.interval = setInterval(() => {
        let newValue = this.upload_progress + 5;
        if (newValue >= 99) {
            newValue = 99;
        }
        this.upload_progress = newValue;
      }, 1500);
    },
    endProgress() {
      this.upload_progress = 0
      clearInterval(this.interval);
      this.interval = null;
    },
    isItInteger(str) {
      return /^\-?[0-9]+$/.test(str);
    },
    isItFloat(str) {
      return /^\-?[0-9]+(\.[0-9]+)?$/.test(str);
    },
    validateCSV(csv, col_names, col_types) {
      let rows = csv.split('\n')
      let error_log = []
      let error_msg = null
      const strand_chars = ['+', '-']
      // console.log(col_names)

      let headers = rows[0].split(',')
      for (var i = 0; i < col_names.length; i++) {
        if (!headers[i]) {
          if (col_types[i].valueOf() !== 'optional') {
            error_msg = `Header Error on column ${i+1}, missing ${col_names[i]}`
            error_log.push(error_msg)
            console.log(error_msg)
          }
        } else {
          if (headers[i].valueOf().trim() != col_names[i].valueOf().trim()) {
            error_msg = `Header Error on column ${i+1}, expected ${col_names[i]} got ${headers[i]}`
            error_log.push(error_msg)
            console.log(error_msg)
          }
        }
        
      }

      // Check last line 
      let last = rows[rows.length-1].split(',')
      let sum_len = 0
      for (var j = 0; j < last.length; j++) {
        sum_len += last[j].length
      }
      if (sum_len == 0) rows.pop()

      // Iterate line by line
      for (var i = 1; i < rows.length; i++) {
        let cols = rows[i].split(',')
        // if (i % 100 == 0) console.log(i)
        
        // Column by column
        for (var j = 0; j < col_types.length; j++) {
          let value = cols[j]
          if (col_types[j] != 'optional' && (!value || !value.length)) {
            // Fail
            error_msg = `Null Error on line ${i} column ${col_names[j]}, value: ${value}`
            error_log.push(error_msg)
            console.log(error_msg)            
            continue
          }
          if (col_types[j] == 'integer') {
            if (!this.isItInteger(value.trim())) {
              // Fail
              error_msg = `Integer Type Error on line ${i} column ${col_names[j]}, value: ${value}`
              error_log.push(error_msg)
              console.log(error_msg)
              continue 
            }
          } else if (col_types[j] == 'float') {
            if (!this.isItFloat(value.trim())) {
              // Fail
              error_msg = `Float Type Error on line ${i} column ${col_names[j]}, value: ${value}`
              error_log.push(error_msg)
              console.log(error_msg)
              continue 
            }          
          } else if (col_types[j] == 'char(+/-)') {
            if (!strand_chars.some((arrVal) => value === arrVal)) {
              // Fail
              error_msg = `Char(+/-) Type Error on line ${i} column ${col_names[j]}, value: ${value}`
              error_log.push(error_msg)
              console.log(error_msg)
              continue
            }              
          }
        }
      }
      return error_log
    },
    upload_gene_expression_data(e) {
      // console.log('upload_gene_expression_data')
      const files = e.files
      const file = files[0]
      const col_names = ['gene_id', 'sample_name', 'gene_expression']
      const col_types = ['string', 'string', 'float']

      let error_log = []
      const sample_names = {}

      // Loads entire file into memory? 
      let reader = new FileReader() 
      reader.readAsText(file)
      reader.onload = (evt) => {
        let csv = evt.target.result
        error_log = this.validateCSV(csv, col_names, col_types)


        this.upload_gene_expression_data_error_log = error_log
        this.upload_gene_expression_data_error = error_log.length
        
        if (!this.upload_gene_expression_data_error) {
          this.$toast.add({severity: 'success', summary: 'Success', detail: 'File Validated', life: 5000});
          this.upload_gene_expression_data_filename = file.name
          this.upload_gene_expression_data_file = file
          this.upload_gene_expression_data_highlight = false
        } else {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed Type Validation', life: 5000});
          this.upload_gene_expression_data_filename = 'Select'
          this.upload_gene_expression_data_file = null
        }
      }

    },
    upload_gene_metadata(e) {
      // console.log('upload_gene_metadata')
      // Upload file contents to memory, does not post to database yet
      const files = e.files
      const file = files[0]
      const col_names = ['gene_id',	'gene_name',	'refseq',	'chr',	'start',	'end',
      	'strand',	'length',	'description', 'ensembl_gene_id','gene_biotype','copies',
        'annotation_divergence', 'external_gene_name', 'ensembl_peptide_id']
      const col_types = ['string', 'string', 'string', 'string', 'integer', 
        'integer', 'char(+/-)', 'float', 'string', 'string', 'string', 'optional',
        'optional', 'optional', 'optional']


      let error_log = []
      const gene_ids = {}

      // Loads entire file into memory? 
      let reader = new FileReader() 
      reader.readAsText(file)
      reader.onload = (evt) => {
        let csv = evt.target.result
        error_log = this.validateCSV(csv, col_names, col_types)

        this.upload_gene_metadata_error_log = error_log
        this.upload_gene_metadata_error = error_log.length
        
        if (!this.upload_gene_metadata_error) {
          this.$toast.add({severity: 'success', summary: 'Success', detail: 'File Validated', life: 5000});
          this.upload_gene_metadata_filename = file.name
          this.upload_gene_metadata_file = file
          this.upload_gene_metadata_highlight = false
        } else {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed Type Validation', life: 5000});
          this.upload_gene_metadata_filename = 'Select'
          this.upload_gene_metadata_file = null
          console.log('upload_gene_metadata: ERROR')
        }
      }
    },
    upload_sample_metadata(e) {
      // console.log('upload_sample_metadata')
      const files = e.files
      const file = files[0]
      const col_names = ['sample_name',	'species',	'time_point',	'group_name',
      	'age_months',	'gender',	'tissue',	'number_of_replicates',	'data_type']
      const col_types = ['string', 'string', 'string', 'string', 'integer', 
        'string', 'string', 'integer', 'string']

      let error_log = []
      const sample_names = {}

      // Loads entire file into memory? 
      let reader = new FileReader() 
      reader.readAsText(file)
      reader.onload = (evt) => {
        // console.log('reader.onload')
        let csv = evt.target.result
        error_log = this.validateCSV(csv, col_names, col_types)

        this.upload_sample_metadata_error_log = error_log
        this.upload_sample_metadata_error = error_log.length
        
        if (!this.upload_sample_metadata_error) {
          this.$toast.add({severity: 'success', summary: 'Success', detail: 'File Validated', life: 5000});
          this.upload_sample_metadata_filename = file.name
          this.upload_sample_metadata_file = file
          this.upload_sample_metadata_highlight = false
          // TODO: Not yet tested
          this.sample_counts(csv)
        } else {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed Type Validation', life: 5000});
          this.upload_sample_metadata_filename = 'Select'
          this.upload_sample_metadata_file = null
        }
      }
    },
    sample_counts(csv) {
      console.log('sample_counts')
      console.log(csv)

      let rows = csv.split('\n')
      let conditions = {}
      let genders = {}

      // Iterate line by line
      for (var i = 1; i < rows.length; i++) {
        let cols = rows[i].split(',')
        let cond = cols[3]
        conditions[cond] = conditions[cond] + 1 || 1
        let gender = cols[5]
        genders[gender] = genders[gender] + 1 || 1
      }
      this.conditions_json = JSON.stringify(Object.keys(conditions).map(e => {
        return {
          'condition' : e,
          'count' : conditions[e]}
      }))
      this.genders_json = JSON.stringify(Object.keys(genders).map(e => {
        return {
          'gender' : e,
          'count' : genders[e]}
      }))
    },
    download(file) {
      // console.log('download', file)
      const fileRef = ref(storage, file)
      getDownloadURL(fileRef).then((url) => {
        window.location.href = url;
      }).catch((error) => {
        console.log('Error on download: ', error.code)
      })
    },
    save() {
      this.saveMsg = null
      this.databaseTablePrefix = null
      let errors = false

      // Validate experiment 
      if (!this.experiment) {
        console.log('ERROR: Invalid experiment name')
        this.experimentInvalid = true
        this.experimentErrorMsg = "Experiment name required."
        errors = true 
      } else {
        this.experimentInvalid = false
      }
      
      // Validate year
      this.year = Number.parseInt(this.year)
      if (!this.year) {
        console.log('ERROR: Year required.')
        this.yearInvalid = true
        this.yearErrorMsg = "Year required."
        errors = true 
      } else if (this.year > 2050 || this.year < 1850) {
        console.log('ERROR: Year must be reasonable.')
        this.yearInvalid = true 
        this.yearErrorMsg = "Year must be non-silly."
        errors = true
      } else {
        this.yearInvalid = false
      }
      
      // Validate institution
      if (this.institution && this.institution.length > 100) {
        console.log('ERROR: Institution name too long')
        this.institutionInvalid = true 
        this.institutionErrorMsg = "Institution name too long, must be less than 100 characters."
        errors = true
      } else {
        this.institutionInvalid = false
      }
      
      // Validate species
      if (!this.species) {
        console.log('ERROR: Invalid species name')
        this.speciesInvalid = true
        this.speciesErrorMsg = "Species name required."
        errors = true 
      } else {
        this.speciesInvalid = false
      }
      
      // Validate doi 
      if (this.doi) {
        RegExp.escape = function(string) {
          return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        };
        const pat = '\\b(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?!["&\'])\\S)+)\\b'
        const re = new RegExp(pat)
        console.log('this.doi', this.doi)
        console.log('re:', re)
        var found = re.exec(this.doi);
        console.log(found)
        if (!found) {
          console.log('ERROR: Invalid DOI format.')
          this.doiInvalid = true 
          this.doiErrorMsg = "Invalid DOI format."
          errors = true
        } else {
          // console.log('DOI found: ', found + ' in ' + this.doi)
        }
      } else {
        this.doiInvalid = false
      }
      
      // Validate tissue
      if (!this.tissue) {
        console.log('ERROR: Invalid tissue')
        this.tissueInvalid = true
        this.tissueErrorMsg = "Tissue required."
        errors = true 
      } else {
        this.tissue = this.tissue.replace(/ /g,"_")
        this.tissueInvalid = false
      }
      
      // Validate other details 
      if (this.other && this.other.length > 10000) {
        console.log('ERROR: Other details too long.')
        this.otherInvalid = true 
        this.otherErrorMsg = "Other information section too long, must be less than 10,000 characters."
        errors = true 
      } else {
        this.otherInvalid = false
      }
      
      if (errors) return

      this.saveMsg = "Dataset details saved."
      this.databaseTablePrefix = `${this.experiment}_${this.year}_${this.species}_${this.tissue}`
    },
    async post_dataset() {
      console.log('post_dataset: Posting dataset to BigQuery')
      this.uploading = true
      this.startProgress()
      const start = Date.now()
      let formData = new FormData() 
      if (this.upload_gene_metadata_file)
        formData.append('files', this.upload_gene_metadata_file)
      if (this.upload_sample_metadata_file)
        formData.append('files', this.upload_sample_metadata_file)
      if (this.upload_gene_expression_data_file)
        formData.append('files', this.upload_gene_expression_data_file)

      const gene_metadata_table_name = `${this.databaseTablePrefix}_gene_metadata`
      const sample_metadata_table_name = `${this.databaseTablePrefix}_sample_metadata`
      const gene_expression_data_table_name = `${this.databaseTablePrefix}_gene_expression_data`

      let metadata = {
        owner: this.$store.state.profileId,
        experiment: this.experiment, 
        institution: this.institution, 
        species: this.species, 
        tissue: this.tissue, 
        year: this.year, 
        doi : this.doi,
        otherInformation: this.other || '',

        gene_metadata_table_name: `${gene_metadata_table_name}_${this.$store.state.profileId}`,
        sample_metadata_table_name: `${sample_metadata_table_name}_${this.$store.state.profileId}`,
        gene_expression_data_table_name: `${gene_expression_data_table_name}_${this.$store.state.profileId}`,
        gender: this.genders_json,
        condition: this.conditions_json,
      }

      // formData.append('body', metadata)
      for (const [key, value] of Object.entries(metadata)) {
        formData.append(key, value)
      }

      formData.append('gene_metadata_filename', this.upload_gene_metadata_filename)
      formData.append('sample_metadata_filename', this.upload_sample_metadata_filename)
      formData.append('gene_expression_data_filename', this.upload_gene_expression_data_filename)

      // let api_result = await DataService.postDataset(formData)
      const time_elapsed = (Date.now() - start) / 1000
      console.log(`post_dataset: Time elapsed: ${time_elapsed}s`)
      this.uploading = false
      this.endProgress()
      return api_result
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