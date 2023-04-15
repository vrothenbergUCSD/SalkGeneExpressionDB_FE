<template>
  <div id="owned-groups" class="p-3" v-if="owned_groups">
    <DataTable :value="owned_groups" :paginator="true" :rows="10"
      dataKey="group_id" :rowHover="true"
      v-model:filters="filters" filterDisplay="menu" :loading="loading"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" 
      :rowsPerPageOptions="[10,25,50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
      :globalFilterFields="['name', 'description', 'admin_users']" 
      responsiveLayout="scroll"
    >
      <template #header>
        <div class="flex justify-content-between align-items-center">
          <h5 class="m-0">Permission Groups</h5>
          <div class="flex flex-row">
            <div class="mx-3">
              <Button label="Create Group" icon="pi pi-plus-circle" class="" 
              @click="createPermissionGroupDialog"/>
            </div>
            <div class="p-input-icon-left mr-0">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
            </div>
          </div>
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
          {{ description(data.description) }}
        </template>
        <template #filter="{filterModel}">
          <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search by description"/>
        </template>
      </Column>
      <Column field="admin_users" header="Admins" style="min-width: 12rem">
        <template #body="{data}">
          {{convertUserIDs(data.admin_users).join(", ")}}
        </template>
      </Column>
      <!-- <Column field="admin-groups" header="Admin Groups" style="min-width: 12rem">
        <template #body="{data}">
          {{convertGroupIDs(data.admin_groups).join(", ")}}
        </template>
      </Column> -->
      <Column field="editor_users" header="Editors" style="min-width: 14rem">
        <template #body="{data}">
          {{convertUserIDs(data.editor_users).join(", ")}}
        </template>
      </Column>
      <!-- <Column field="editor-groups" header="Editor Groups" style="min-width: 12rem">
        <template #body="{data}">
          {{convertGroupIDs(data.editor_groups).join(", ")}}
        </template>
      </Column> -->
      <Column field="reader_users" header="Readers" style="min-width: 6rem">
        <template #body="{data}">
          {{convertUserIDs(data.reader_users).join(", ")}}
        </template>
      </Column>
      <!-- <Column field="reader-groups" header="Reader Groups" style="min-width: 12rem">
        <template #body="{data}">
          {{convertGroupIDs(data.reader_groups).join(", ")}}
        </template>
      </Column> -->
      
    </DataTable>

    <Dialog header="Create Permission Group" v-model:visible="permissionGroupDialog"  
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
          <label for="admin_users">Admins</label>
          <MultiSelect v-model="selected_admin_users" :options="users"
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
      </div>
      <div class="formgrid grid">
        <div class="field col">
          <label for="editor_users">Editors</label>
          <MultiSelect v-model="selected_editor_users" :options="users"
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
      </div>
      <div class="formgrid grid">
        <div class="field col">
          <label for="reader_users">Readers</label>
          <MultiSelect v-model="selected_reader_users" :options="users"
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
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="hidePermissionGroupDialog"/>
        <Button label="Save" icon="pi pi-check" class="" @click="addPermissionGroup" />
      </template>
    </Dialog>

    <Dialog header="Edit Permission Group" v-model:visible="editPermissionGroupDialog"  
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
          <div class="font-semibold">Add Users</div>
        </div>
        <!-- <div class="field col">
          <div class="font-semibold">Inherit from Groups</div>
        </div> -->
      </div>
      <div class="formgrid grid">
        <div class="field col">
          <label for="admin_users">Admins</label>
          <MultiSelect v-model="selected_admin_users" :options="users"
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
        <!-- <div class="field col">
          <label for="admin_groups">Admin Groups</label>
          <MultiSelect v-model="selected_admin_groups" :options="groups"
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
        </div> -->
      </div>
      <div class="formgrid grid">
        <div class="field col">
          <label for="editor_users">Editors</label>
          <MultiSelect v-model="selected_editor_users" :options="users"
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
        <!-- <div class="field col">
          <label for="editor_groups">Editor Groups</label>
          <MultiSelect v-model="selected_editor_groups" :options="groups"
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
        </div> -->
      </div>
      <div class="formgrid grid">
        <div class="field col">
          <label for="reader_users">Readers</label>
          <MultiSelect v-model="selected_reader_users" :options="users"
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
        <!-- <div class="field col">
          <label for="admin_groups">Reader Groups</label>
          <MultiSelect v-model="selected_reader_groups" :options="groups"
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
        </div> -->
      </div>
      <template #footer>
        <div class="flex flex-row items-center justify-between">
          <div class="ml-0">
            <Button label="Delete" icon="pi pi-trash" class="p-button-danger" 
              @click="showDeletePermissionGroupDialog" :disabled="editPermissionSubmitted"/>
          </div>
          <div class="right mr-0">
            <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" 
              @click="hideEditPermissionGroupDialog" :disabled="editPermissionSubmitted"/>
            <Button label="Save" icon="pi pi-check" 
              @click="updatePermissionGroup($event)" :loading="editPermissionSubmitted"/>
          </div>
        </div>
      </template>
    </Dialog>

    <Dialog header="Delete Group" v-model:visible="deletePermissionGroupDialog" :style="{width: '350px'}" :modal="true">
        <div class="confirmation-content">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span>Are you sure you want to delete this permission group?</span>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" @click="hideDeletePermissionGroupDialog" 
              :disabled="deletePermissionGroupSubmitted" class="p-button-text" autofocus/>
            <Button label="Delete" icon="pi pi-check" @click="deletePermissionGroup" 
              :disabled="deletePermissionGroupSubmitted" class="p-button-danger" />
        </template>
    </Dialog>




  </div>
</template>

<script>
import { FilterMatchMode } from 'primevue/api'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'

import _ from 'underscore'

import { firestore } from "@/firebase/firebaseInit.js"
import { doc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore"

export default {
  name: "Datasets",
  components: {
    Column, 
    MultiSelect, 
    DataTable, 
    Button, 
    Dialog,
    InputText,
    
  },
  props: {


  },
  computed: {
  },
  data() {
    return {
      loading: true, 
      owned_groups: null, 
      selected_groups: null, 

      filters: {
        'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
      },

      permissionGroup: {},
      permissionGroupDialog: false, 
      permissionSubmitted: false, 
      editPermissionGroupDialog: false, 
      editPermissionSubmitted: false, 
      deletePermissionGroupDialog: false,
      deletePermissionGroupSubmitted: false, 

      users: [],
      selected_admin_users: [],
      selected_editor_users: [],
      selected_reader_users: [],

      groups: [],
      selected_admin_groups: [],
      selected_editor_groups: [],
      selected_reader_groups: [],
    }
  },
  async mounted() {
    await Promise.all([
      this.getUsers(),
      this.getGroups(),
      this.getOwnedGroups(),
    ])
    this.loading = false
  },
  methods: {
    description(d) {
      if (d === null) return ""
      return d.length < 50 ? d : d.substring(0,50) + "..."
    },
    hidePermissionGroupDialog() {
      this.permissionGroupDialog = false
      this.permissionSubmitted = false
    },
    createPermissionGroupDialog() {
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
    async addPermissionGroup() {
      console.log('addPermissionGroup')
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
        // admin_groups: this.selected_admin_groups.map(group => group.group_id), 
        editor_users: this.selected_editor_users.map(user => user.uid),
        // editor_groups: this.selected_editor_groups.map(group => group.group_id),
        reader_users: this.selected_reader_users.map(user => user.uid),
        // reader_groups: this.selected_reader_groups.map(group => group.group_id), 
      })

      this.permissionSubmitted = false
      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])

      this.selected_admin_users = []
      // this.selected_admin_groups = []
      this.selected_editor_users = []
      // this.selected_editor_groups = []
      this.selected_reader_users = []
      // this.selected_reader_groups = []

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
      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])
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
        // console.log(doc.id, " => ", doc.data());
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
      // this.selected_admin_groups = this.groups.filter(group => this.permissionGroup.admin_groups.includes(group.group_id))
      this.selected_editor_users = this.users.filter(user => this.permissionGroup.editor_users.includes(user.uid))
      // this.selected_editor_groups = this.groups.filter(group => this.permissionGroup.editor_groups.includes(group.group_id))
      this.selected_reader_users = this.users.filter(user => this.permissionGroup.reader_users.includes(user.uid))
      // this.selected_reader_groups = this.groups.filter(group => this.permissionGroup.reader_groups.includes(group.group_id))
    },
    hideEditPermissionGroupDialog() {
      this.editPermissionGroupDialog = false 
      this.editPermissionSubmitted = false
    },
    async updatePermissionGroup() {
      console.log('updatePermissionGroup')
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

      // Use Firestore Functions instead

      // const group_id = this.permissionGroup.group_id
      // const old_admin_users = this.users.filter(user => this.permissionGroup.admin_users.includes(user.uid))
      // const old_admin_groups = this.groups.filter(group => this.permissionGroup.admin_groups.includes(group.group_id))
      // const old_editor_users = this.users.filter(user => this.permissionGroup.editor_users.includes(user.uid))
      // const old_editor_groups = this.groups.filter(group => this.permissionGroup.editor_groups.includes(group.group_id))
      // const old_reader_users = this.users.filter(user => this.permissionGroup.reader_users.includes(user.uid))
      // const old_reader_groups = this.groups.filter(group => this.permissionGroup.reader_groups.includes(group.group_id))

      
      // await Promise.all([
      //   this.updateUsers(this.selected_admin_users, old_admin_users,  'admin', group_id),
      //   this.updateUsers(this.selected_editor_users, old_editor_users, 'editor', group_id),
      //   this.updateUsers(this.selected_reader_users, old_reader_users, 'reader', group_id),
      //   this.updateGroups(this.selected_admin_groups, old_admin_groups, 'admin', group_id),
      //   this.updateGroups(this.selected_editor_groups, old_editor_groups, 'editor', group_id),
      //   this.updateGroups(this.selected_reader_groups, old_reader_groups, 'reader', group_id),
      // ])

      const docRef = doc(firestore, "permission_groups", this.permissionGroup.group_id)
      await updateDoc(docRef, {
        name: this.permissionGroup.name,
        group_id: this.permissionGroup.group_id,
        description: this.permissionGroup.description, 
        datasets: this.permissionGroup.datasets,
        admin_users: this.selected_admin_users.map(user => user.uid), 
        // admin_groups: this.selected_admin_groups.map(group => group.group_id), 
        editor_users: this.selected_editor_users.map(user => user.uid),
        // editor_groups: this.selected_editor_groups.map(group => group.group_id),
        reader_users: this.selected_reader_users.map(user => user.uid),
        // reader_groups: this.selected_reader_groups.map(group => group.group_id), 
      })

      await Promise.all([
        this.getGroups(),
        this.getOwnedGroups(),
      ])
      
      this.hideEditPermissionGroupDialog()
    },
    
    async updateUsers(selected_users, old_users, user_type, group_id) {
      console.log('updateUsers', user_type)
      const users_to_add = _.difference(selected_users, old_users)
      console.log('users_to_add')
      console.log(users_to_add)
      const users_to_remove = _.difference(old_users, selected_users)
      console.log('users_to_remove')
      console.log(users_to_remove)
      await Promise.all(users_to_remove.map(async (user) => {
        this.updateUserPermissions(user, user_type, group_id, false)
      }))
      await Promise.all(users_to_add.map(async (user) => {
        this.updateUserPermissions(user, user_type, group_id, true)
      }))
    },

    async updateUserPermissions(user, user_type, group_id, add) {
      console.log('updateUserPermissions', user, user_type, group_id)
      let user_type_arr = []
      if (user.hasOwnProperty(user_type)) {
        // Array exists
        user_type_arr = user[user_type]
      }
      if (add && user_type_arr.indexOf(group_id) === -1) {
        // Add permission group ID if not exists
        user_type_arr.push(group_id)
      } else {
        // Remove permission group ID
        user_type_arr = user_type_arr.filter(gid => gid != group_id)
      }
      const docRef = doc(firestore, "users", user.uid)
      const update_obj = {}
      update_obj[user_type] = user_type_arr
      await updateDoc(docRef, update_obj)
    },
    async updateGroups(selected_groups, old_groups, user_type, group_id) {
      console.log('updateGroups')
      const groups_to_add = _.difference(selected_groups, old_groups)
      const groups_to_remove = _.difference(old_groups, selected_groups)
      // Cascade update roles of all users in inherited permission groups 
      await Promise.all(groups_to_remove.map(async (group) => {
        const group_user_ids = group[`${user_type}_users`]
        // console.log('group_user_ids')
        // console.log(group_user_ids)
        const users_to_remove = this.users.filter(user => group_user_ids.includes(user.uid))
        // console.log('group_users')
        // console.log(group_users)
        await Promise.all(users_to_remove.map(async (user) => {
          this.updateUserPermissions(user, user_type, group_id, false)
        }))
      }))
      await Promise.all(groups_to_add.map(async (group) => {
        const group_user_ids = group[`${user_type}_users`]
        // console.log('group_user_ids')
        // console.log(group_user_ids)
        const users_to_add = this.users.filter(user => group_user_ids.includes(user.uid))
        // console.log('group_users')
        // console.log(group_users)
        await Promise.all(users_to_add.map(async (user) => {
          this.updateUserPermissions(user, user_type, group_id, true)
        }))
      }))
      
    },
  }

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