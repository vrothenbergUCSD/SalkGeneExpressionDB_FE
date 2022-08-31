<template>
  <div id="time-selection">

    <div class="font-semibold pb-2">Time Points (ZT)</div>
    <div class="time-points"></div>
  
    <SelectButton class="p-time-selection" v-model="time_points_selected" 
      :options="time_points" optionLabel="name" 
      multiple @change="updateTimePointsSelected"/>

  </div>
</template>

<script>
import SelectButton from 'primevue/selectbutton';

export default {
  name: 'TimeSelection',
  components: {
    SelectButton,
  },
  props: {
    // time_points: null, 
  },
  data() {
    return {
      time_points: null,
      time_points_selected: null,
    }
  },
  mounted() {
    this.time_points = [
      {name: '0', value: 0},
      {name: '2', value: 2},
      {name: '4', value: 4},
      {name: '6', value: 6},
      {name: '8', value: 8},
      {name: '10', value: 10},
      {name: '12', value: 12},
      {name: '14', value: 14},
      {name: '16', value: 16},
      {name: '18', value: 18},
      {name: '20', value: 20},
      {name: '22', value: 22},
    ]
    this.time_points_selected = this.time_points

  },
  methods: {
    updateTimePointsSelected(evt) {
      // console.log('TimeSelection.vue > updateTimePointsSelected')
      // console.log(evt)
      // console.log(evt.value)
      this.$emit("updateTimePointsSelected", this.time_points_selected)
    }
  }
}
</script>

<style lang="scss" scoped>

// [class^="p-"] {
//   font-size: 50% !important;
// }
:deep(.p-button) {
  font-size: 0.85rem !important;
  padding-left: 0.75rem !important;
  padding-right: 0.75rem !important;
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
}
// :deep(.p-component) {
//   font-size: 1.0rem !important;
// }

</style>