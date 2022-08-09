<template>
  <div class="surface-card p-4 shadow-2 border-round w-11/12 mx-auto mt-6">
    <div class="w-11/12 mx-auto">
      <div class="text-center my-5">
        <div class="text-900 text-3xl font-medium mb-3">Settings</div>
      </div>
      <div class="text-xl font-medium mb-3">
        Configuration settings
      </div>
      <div>
        <SelectButton v-model="selectedTestOption" :options="testOptions" optionLabel="name" />

      </div>


    </div>
    
  </div>
  
</template>

<script>
import SelectButton from "primevue/selectbutton"
export default {
  name: "Settings",
  components: {
    SelectButton

  },
  data() {
    return {
      selectedTestOption: null, 
      testOptions: [
        { name:'First', rank: 1 },
        { name:'Second', rank: 2 },
        { name:'Third', rank: 3 },
      ]
    }
  }

}
</script>

<style>

</style>