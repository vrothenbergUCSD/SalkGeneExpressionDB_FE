<template>
  <div class="w-full">
    <Dropdown v-model="selected" :options="this.rows" optionLabel="name" :placeholder="this.placeholder" @change="joo" class="w-10 text-left" />
  </div>
</template>

<script>
import Dropdown from 'primevue/dropdown';

export default {
  name: "Selection",
  props: {
    placeholder: String,
    rows: Array,
  },
  components: {
    Dropdown,
  },
  data() {
    return {
      selected: null,
      //rows: null,
      //placeholder: null,
    }
  },
  created() {
    //console.log("created")
    //console.log(this.rows)
    //this.rows = rows
    //this.placeholder = this.placeholder
	},
  mounted() {
  },
  methods: {
    joo() {
      console.log("joo")
    }

  }

}
</script>