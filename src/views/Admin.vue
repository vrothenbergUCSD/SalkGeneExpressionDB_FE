<template>
  <div id="admin" class="w-full p-3 mx-auto mb-20">
    <div id="page-title" class="pb-2 font-semibold text-3xl text-center">
      Administration
    </div>
    <div id="admin-ui" class="rounded-lg bg-white shadow mx-10">
      <div id="owned-groups-datatable" class="p-3" v-if="owned_groups">
        <DataTable :value="owned_groups" :paginator="true" :rows="10"
          dataKey="group_id" :rowHover="true" v-model:selection="selected_groups"
          v-model:filters="filters" filterDisplay="menu" :loading="loading"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" 
          :rowsPerPageOptions="[10,25,50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          :globalFilterFields="['name', 'description', 'admins']" 
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <h5 class="m-0">Permission Groups</h5>
              <span class="p-input-icon-left mr-0">
                  <i class="pi pi-search" />
                  <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
              </span>
            </div>
          </template>
          <template #empty>
              No permission groups found.
          </template>
          <template #loading>
              Loading permission groups. Please wait.
          </template>
          <Column :exportable="false" headerStyle="width: 4rem; text-align: center" 
            bodyStyle="text-align: center; overflow: visible">
            <template #body="slotProps">
              <Button type="button" class="p-button-rounded p-button-sm" icon="pi pi-pencil" 
                @click="editPermissionGroup(slotProps.data)" />
            </template>
          </Column>
          <Column field="name" header="Group Name" sortable style="min-width: 10rem">
            <template #body="{data}">
              {{data.name}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" 
                placeholder="Search by name"/>
            </template>
          </Column>
          <Column field="description" header="Description" filterMatchMode="contains" style="min-width: 12rem">
            <template #body="{data}">
              {{data.description}}
            </template>
            <template #filter="{filterModel}">
              <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search by description"/>
            </template>
          </Column>
          <Column field="admins" header="Admins" style="min-width: 12rem">
            <template #body="{data}">
              {{convertUserIDs(data.admins).join(", ")}}
            </template>
          </Column>
          <Column field="admin-groups" header="Admin Groups" style="min-width: 12rem">
            <template #body="{data}">
              {{convertGroupIDs(data.adminGroups).join(", ")}}
            </template>
          </Column>
          <Column field="editors" header="Editors" style="min-width: 14rem">
            <template #body="{data}">
              {{convertUserIDs(data.editors).join(", ")}}
            </template>
          </Column>
          <Column field="editor-groups" header="Editor Groups" style="min-width: 12rem">
            <template #body="{data}">
              {{convertGroupIDs(data.editorGroups).join(", ")}}
            </template>
          </Column>
          <Column field="readers" header="Readers" style="min-width: 6rem">
            <template #body="{data}">
              {{convertUserIDs(data.readers).join(", ")}}
            </template>
          </Column>
          <Column field="reader-groups" header="Reader Groups" style="min-width: 12rem">
            <template #body="{data}">
              {{convertGroupIDs(data.readerGroups).join(", ")}}
            </template>
          </Column>
          
        </DataTable>

        <Dialog v-model:visible="editPermissionGroupDialog" header="Edit Permission Group" 
          :modal="true" class="p-fluid w-1/2 min-w-[300px]">
          <div class="formgrid grid">
            <div class="field col">
              <label for="name">Group Name</label>
              <InputText id="name" v-model.trim="permissionGroup.name" required="true" 
                autofocus :class="{'p-invalid': editPermissionSubmitted && !permissionGroup.name}" />
              <small class="p-error" v-if="editPermissionSubmitted && !permissionGroup.name">
                Group name is required.</small>
            </div>
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="description">Description</label>
              <InputText id="description" v-model.trim="permissionGroup.description" 
                autofocus/>
              <small class="p-error" v-if="editPermissionSubmitted && permissionGroup.description && permissionGroup.description.length > 100">
                Description too long.</small>
            </div>
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="admins">Admins</label>
              <MultiSelect v-model="selectedAdmins" :options="users"
                optionLabel="name" placeholder="Select Admins" class="multiselect-custom max-w-[400px]"
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
                      <div class="text-sm basis-1/2 text-right truncate">{{slotProps.option.institution}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field col">
              <label for="adminGroups">Admin Groups</label>
              <MultiSelect v-model="selectedAdminGroups" :options="groups"
                optionLabel="name" placeholder="Select Admin Groups" class="multiselect-custom max-w-[400px]"
                :filter="true" display="chip">
                <template #value="slotProps">
                  <div class="p-multiselect-token text-sm" v-for="option of slotProps.value" :key="option.uid">
                    {{option.name}}
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="permission-item w-full max-w-[400px]">
                    <div class="flex flex-row items-center">
                      <div class="text-sm basis-1/3">{{slotProps.option.name}}</div>
                      <div class="text-sm basis-2/3 text-right truncate max-w-[300px]">{{slotProps.option.description}}</div>
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
                optionLabel="name" placeholder="Select Editors" class="multiselect-custom max-w-[400px]"
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
                      <div class="text-sm basis-1/2 text-right truncate">{{slotProps.option.institution}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field col">
              <label for="editorGroups">Editor Groups</label>
              <MultiSelect v-model="selectedEditorGroups" :options="groups"
                optionLabel="name" placeholder="Select Editor Groups" class="multiselect-custom max-w-[400px]"
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
          </div>
          <div class="formgrid grid">
            <div class="field col">
              <label for="admins">Readers</label>
              <MultiSelect v-model="selectedReaders" :options="users"
                optionLabel="name" placeholder="Select Readers" class="multiselect-custom max-w-[400px]"
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
                      <div class="text-sm basis-1/2 text-right truncate">{{slotProps.option.institution}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field col">
              <label for="adminGroups">Reader Groups</label>
              <MultiSelect v-model="selectedReaderGroups" :options="groups"
                optionLabel="name" placeholder="Select Reader Groups" class="multiselect-custom max-w-[400px]"
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
          </div>
          <template #footer>
              <Button label="Cancel" icon="pi pi-times" class="p-button-text" 
                @click="hideEditPermissionGroupDialog" :disabled="editPermissionSubmitted"/>
              <Button label="Save" icon="pi pi-check" class="p-button-text" 
                @click="updatePermissionGroup($event)" :loading="editPermissionSubmitted"/>
          </template>


        </Dialog>

      </div>
      <div id="owned-datasets-datatable" class="p-3">
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
              <div class="text-lg align-middle font-medium">Select gene expression CSV</div>
              <div class="ml-5">
                <FileUpload mode="basic" :class="{ 'p-button-warning': upload_gene_metadata_highlight }"
                  name="upload_gene_expression_data" 
                  :chooseLabel="upload_gene_expression_data_filename" :auto="true" 
                  :customUpload="true" accept=".csv" :maxFileSize="100000000" 
                  @uploader="upload_gene_expression_data" />
              </div>
            </div>

          </div>
          <div class="flex flex-row items-center">
            <div class="basis-2/3">
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
              <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDatasetDialog"/>
              <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveDataset" />
          </template>
        </Dialog>

        <Dialog v-model:visible="permissionGroupDialog" header="Create Permission Group" 
          :modal="true" class="p-fluid w-1/2 min-w-[300px]">
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
              <small class="p-error" v-if="permissionSubmitted && permissionGroup.description && permissionGroup.description.length > 100">
                Description too long.</small>
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
                      <div class="text-sm basis-1/2 text-right truncate">{{slotProps.option.institution}}</div>
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
                      <div class="text-sm basis-2/3 text-right truncate">{{slotProps.option.description}}</div>
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
                      <div class="text-sm basis-1/2 text-right truncate">{{slotProps.option.institution}}</div>
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
                      <div class="text-sm basis-2/3 text-right truncate">{{slotProps.option.description}}</div>
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
                      <div class="text-sm basis-1/2 text-right truncate">{{slotProps.option.institution}}</div>
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
                      <div class="text-sm basis-2/3 text-right truncate">{{slotProps.option.description}}</div>
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </div>
          </div>
          <template #footer>
              <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hidePermissionGroupDialog"/>
              <Button label="Save" icon="pi pi-check" class="p-button-text" @click="savePermissionGroup($event)" />
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
import FileUpload from 'primevue/fileupload'
import Panel from 'primevue/panel'
import ScrollPanel from 'primevue/scrollpanel'

import _ from 'underscore'

import DataService from "@/services/DataService.js"

import { firestore } from "@/firebase/firebaseInit.js"
import { doc, collection, query, where, getDocs, addDoc, setDoc, updateDoc } from "firebase/firestore"

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
    FileUpload,
    Panel,
    ScrollPanel,

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

      upload_gene_expression_data_error: null,
      upload_gene_expression_data_error_log: null,
      upload_gene_expression_data_filename: null,


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

      editPermissionGroupDialog: false,
      editPermissionSubmitted: false,
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
      // console.log('editDataset')
      // console.log(d)
      this.datasetDialog = true
      this.dataset = {...d}
      // console.log('this.dataset')
      // console.log(this.dataset)
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

      // Validate
      if (!this.dataset.species) {
        // Species required
        return
      }

      if (!this.dataset.tissue) {
        // Tissue required
        return
      }

      if (!this.dataset.experiment) {
        // Experiment required 
        return
      }

      if (!this.dataset.year) {
        // Year required
        return
      } else if (this.dataset.year < 1900 || this.dataset.year > 2100) {
        // Year must be non-silly
        return
      }

      if (this.institution && this.institution.length > 100) {
        // Institution must be less than 100 characters
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
        owner: this.dataset.owner,
        sample_metadata_table_name: this.dataset.sample_metadata_table_name,
        species: this.dataset.species,
        tissue: this.dataset.tissue,
        year: this.dataset.year,
      })


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
      this.permissionGroup.admins.forEach((u) => {
        console.log('admin: ', u)
        console.log(u)
      })
      
      
      // Save to Firestore
      const docRef = await addDoc(collection(firestore, 'permission_groups'), {
        name: this.permissionGroup.name,
        admins: this.permissionGroup.admins, 
        adminGroups: this.permissionGroup.adminGroups, 
        datasets: [],
        description: this.permissionGroup.description, 
        editors: this.permissionGroup.editors,
        editorGroups: this.permissionGroup.editorGroups,
        readers: this.permissionGroup.readers,
        readerGroups: this.permissionGroup.readerGroups, 
        owner: this.$store.state.profileId,
      })

      this.permissionSubmitted = false
      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])
      
      this.hidePermissionGroupDialog()
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
    },
    async getOwnedGroups() {
      console.log('getOwnedGroups')
      // TODO: Check if admin group is in permission group
      const q = query(collection(firestore, "permission_groups"), 
        where('admins', 'array-contains', this.$store.state.profileId))
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
      this.selectedAdmins = this.users.filter(user => this.permissionGroup.admins.includes(user.uid))
      this.selectedAdminGroups = this.groups.filter(group => this.permissionGroup.adminGroups.includes(group.group_id))
      this.selectedEditors = this.users.filter(user => this.permissionGroup.editors.includes(user.uid))
      this.selectedEditorGroups = this.groups.filter(group => this.permissionGroup.editorGroups.includes(group.group_id))
      this.selectedReaders = this.users.filter(user => this.permissionGroup.readers.includes(user.uid))
      this.selectedReaderGroups = this.groups.filter(group => this.permissionGroup.readerGroups.includes(group.group_id))
    },
    hideEditPermissionGroupDialog() {
      this.editPermissionGroupDialog = false 
      this.editPermissionSubmitted = false
    },
    async updatePermissionGroup() {
      this.editPermissionSubmitted = true

      if (!this.permissionGroup.name) {
        // Name required
        return
      }

      if (this.permissionGroup.description && this.permissionGroup.description.length > 100) {
        // Description too long
        return 
      }

      console.log('this.permissionGroup')
      console.log(this.permissionGroup)

      console.log('this.selectedReaderGroups')
      console.log(this.selectedReaderGroups)
      console.log('this.selectedEditors')
      console.log(this.selectedEditors)

      this.selectedAdmins.forEach(user => {
        // Add permission group ID if it does not already exist
        user.admin.indexOf()
      })

      const docRef = doc(firestore, "permission_groups", this.permissionGroup.group_id)
      await updateDoc(docRef, {
        name: this.permissionGroup.name,
        group_id: this.permissionGroup.group_id,
        description: this.permissionGroup.description, 
        datasets: this.permissionGroup.datasets,
        admins: this.selectedAdmins.map(user => user.uid), 
        adminGroups: this.selectedAdminGroups.map(group => group.group_id), 
        editors: this.selectedEditors.map(user => user.uid),
        editorGroups: this.selectedEditorGroups.map(group => group.group_id),
        readers: this.selectedReaders.map(user => user.uid),
        readerGroups: this.selectedReaderGroups.map(group => group.group_id), 
      })

      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])
      
      this.hideEditPermissionGroupDialog()

    },
    updateUserPermissions() {

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