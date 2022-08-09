<template>
  <div class="w-11/12 mx-auto py-6">
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6">
      <div class="flex">
        <div class="flex-1 min-w0 align-middle my-auto">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
        </div>
        
        <!-- <p class="mt-1 max-w-2xl text-sm text-gray-500">Personal details and application.</p> -->
        <div class="mt-5 flex lg:mt-0 lg:ml-4 sm:block">
          <Button class="p-button-sm mx-2 p-button-success z-0" @click="update" v-show="editMode" label="Confirm"/>
          <Button class="p-button-sm mx-2 z-0" @click="toggleEdit" label="Edit"/>
        </div>

      </div>

    </div>
    <div class="border-t border-gray-200">
      <dl>
        <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <div>
            <dt class="text-sm font-medium text-gray-500 my-auto">First name</dt>
            <small id="firstName-help" class="p-error" v-show="firstNameInvalid">
              First name required
            </small>
          </div>
          <InputText v-model="firstName" class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2" 
            :disabled="!editMode" :class="{ 'p-invalid': firstNameInvalid }"/>
        </div>
        <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <div>
            <dt class="text-sm font-medium text-gray-500">Last name</dt>
            <small id="lastName-help" class="p-error" v-show="lastNameInvalid">
              Last name required
            </small>
          </div>
          <InputText v-model="lastName" class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2" 
            :disabled="!editMode" :class="{ 'p-invalid': lastNameInvalid }"/>
        </div>
        <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <div>
            <dt class="text-sm font-medium text-gray-500">Institution</dt>
            <small id="institution-help" class="p-error" v-show="institutionInvalid">Institution name too long</small>
          </div>
          <InputText v-model="institution" class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2" 
            :disabled="!editMode" :class="{ 'p-invalid': institutionInvalid }"/>
        </div>
        <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <div>
            <dt class="text-sm font-medium text-gray-500">Email address</dt>
          </div>
          <!-- <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ email }}</dd> -->
          <InputText v-model="email" class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2" 
            disabled/>

        </div>
        <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Admin</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ admin }}</dd>
        </div>
        <!-- <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">About</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim incididunt cillum culpa consequat. Excepteur qui ipsum aliquip consequat sint. Sit id mollit nulla mollit nostrud in ea officia proident. Irure nostrud pariatur mollit ad adipisicing reprehenderit deserunt qui eu.</dd>
        </div> -->
        <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Datasets</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            <ul role="list" class="border border-gray-200 rounded-md divide-y divide-gray-200">
              <li class="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div class="w-0 flex-1 flex items-center">
                  <PaperClipIcon class="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                  <span class="ml-2 flex-1 w-0 truncate"> Mouse_TRF_2019_Heart.csv </span>
                </div>
                <div class="ml-4 flex-shrink-0">
                  <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500"> Download </a>
                </div>
              </li>
              <li class="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div class="w-0 flex-1 flex items-center">
                  <PaperClipIcon class="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                  <span class="ml-2 flex-1 w-0 truncate"> Human_ALF_2020_Blood.pdf </span>
                </div>
                <div class="ml-4 flex-shrink-0">
                  <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500"> Download </a>
                </div>
              </li>
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  </div>
  </div>
  
</template>

<script>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext'
import { PaperClipIcon } from '@heroicons/vue/solid'

PaperClipIcon

export default {
  name: "Profile",
  components : {
    Dialog,
    Button,
    InputText,
    PaperClipIcon,
  },
  data() {
    return {
      modalMessage: "Changes were saved!",
      display: false,

      editMode: false,

      // firstName: null, 
      firstNameInvalid: null, 
      // lastName: null, 
      lastNameInvalid: null, 
      // email: null,
      emailInvalid: null,
      // institution: null,
      institutionInvalid: null,

    }
  },
  computed: {
    firstName: {
      get() {
        return this.$store.state.profileFirstName
      },
      set(payload) {
        this.$store.commit("changeFirstName", payload)
      }
    },
    lastName: {
      get() {
        return this.$store.state.profileLastName
      },
      set(payload) {
        this.$store.commit("changeLastName", payload)
      }
    },
    institution: {
      get() {
        return this.$store.state.profileInstitution
      },
      set(payload) {
        this.$store.commit("changeInstitution", payload)
      }
    },
    email() {
      return this.$store.state.profileEmail
    },
    admin() {
      return this.$store.state.profileAdmin ? 'Yes' : 'No'
    }
  },
  methods: {
    toggleEdit() {
      this.editMode = !this.editMode
    },
    async update() {
      // Validate firstName
      if (!this.firstName) {
        console.log('ERROR: Invalid first name')
        this.firstNameInvalid = true
        return 
      }
      this.firstNameInvalid = false

      // Validate lastName
      if (!this.lastName) {
        console.log('ERROR: Invalid last name')
        this.lastNameInvalid = true 
        return
      }
      this.lastNameInvalid = false

      // Validate institution
      if (this.institution.length > 100) {
        console.log('ERROR: Institution name too long')
        this.institutionInvalid = true 
        return 
      }
      this.institutionInvalid = false

      console.log('Validation passed')
      this.editMode = false

      await this.$store.dispatch('updateUserSettings')

    }
  }

}
</script>

<style  scoped>
:deep(.p-disabled) { 
  fill:black;

}
</style>