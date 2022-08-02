<template>
  <div class="p-5 font-semibold text-3xl text-center">Temporal Gene Expression</div>
  <div class="flex flex-wrap p-5 mx-auto w-11/12">
    <div class="w-1/3 px-2 border">
      <div class="font-semibold my-2">Species</div>
      <DataTable :value="speciesFiltered" v-model:selection="speciesSelected" class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" :loading="loading" @row-select="speciesRowChange" @row-unselect="speciesRowChange">
      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="name" header=""></Column>
      <Column field="count" header="#">
        <template #body="slotProps">
          {{getCount('species', slotProps.data.name)}}
        </template>
      </Column>
      <Column field="freq" header="Freq">
        <template #body="slotProps">
          {{getFreq('species', slotProps.data.name)}}
        </template>
      </Column>
      </DataTable>
    </div>
    <div class="w-1/3 px-2 border" >
      <div class="font-semibold my-2">Experiment</div>
      <DataTable :value="experimentsFiltered" v-model:selection="experimentsSelected" class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" :loading="loading" @row-select="experimentsRowChange" @row-unselect="experimentsRowChange">
      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="name" header=""></Column>
      <Column field="count" header="#">
        <template #body="slotProps">
          {{getCount('experiment', slotProps.data.name)}}
        </template>
      </Column>
      <Column field="freq" header="Freq">
        <template #body="slotProps">
          {{getFreq('experiment', slotProps.data.name)}}
        </template>
      </Column>

      </DataTable>
      
    </div>
    <div class="w-1/3 px-2 border">
      <div class="font-semibold my-2">Tissue</div>
      <DataTable :value="tissuesFiltered" v-model:selection="tissuesSelected" class="p-datatable-sm" stripedRows :scrollable="true" scrollHeight="200px" :loading="loading" @row-select="tissuesRowChange" @row-unselect="tissuesRowChange">
      <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
      <Column field="name" header=""></Column>
      <Column field="count" header="#">
        <template #body="slotProps">
          {{getCount('tissue', slotProps.data.name)}}
        </template>
      </Column>
      <Column field="freq" header="Freq">
        <template #body="slotProps">
          {{getFreq('tissue', slotProps.data.name)}}
        </template>
      </Column>
      </DataTable>
      
    </div>
  </div>
  <div class="mx-auto w-3/4">
    <div class="font-semibold m-2">Genes</div>
    <span class="p-fluid">
      <AutoComplete :multiple="true" v-model="this.genesSelected" :suggestions="this.genesFiltered" @complete="searchGenes($event)" @item-select="updatePlot" @item-unselect="updatePlot" field="name" />
    </span>

  </div>


  <div>
    <div class="card w-3/4 mx-auto mt-2">
      <!-- <div class="font-semibold text-center mt-3">Chart Types</div> -->
      <TabMenu :model="items"/>
      <router-view :genes="this.genesSelected"/>
    </div>
  </div>

  <!-- <div class="mx-auto w-full">
    <LinePlot :genes="this.genesSelected"/>
  </div> -->

</template>

<script>
// import Dropdown from "primevue/dropdown"
import AutoComplete from "primevue/autocomplete"
import TabMenu from 'primevue/tabmenu'
import Button from 'primevue/button'
// import MultiSelect from 'primevue/multiselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import Selection from "@/components/Selection.vue"
import Prime from "@/components/Prime.vue"
import LinePlot from "@/components/svg/LinePlot.vue"
import BarPlot from "@/components/svg/BarPlot.vue"
// import MarginTranslation from "@/components/svg/MarginTranslation.vue"

import DataService from "@/services/DataService.js"
// import {FilterService,FilterMatchMode} from 'primevue/api';

export default {
  name: "Main",
  components: {
    // Dropdown,
    AutoComplete,
    TabMenu,
    Button,
    // MultiSelect,
    DataTable,
    Column,

    Selection,
    Prime,
    
    LinePlot,
    BarPlot,
    // MarginTranslation,
  },
  DataService: null,
  data() {
    return {
      items: [
        {
          label: 'Bar',
          icon: 'pi pi-fw pi-chart-bar',
          to: '/main/bar'
        },
        {
          label: 'Line',
          icon: 'pi pi-fw pi-chart-line',
          to: '/main/line',
        }
      ],
      loading: true,

      db_metadata: null,

      filtered_metadata: null,
      lookup_table: null,

      columns: null,
      categories: ['species', 'experiment', 'tissue'],

      species: [], //["Mouse", "Human", "Baboon"],
      speciesFiltered: [], // [{name: Mouse}, {name:Human}]
      speciesSelected: [],

      experiments: [], //["Mouse_TRF_2018", "Mouse_TRF_2019", "Baboon_TRF_2020", "Human_ABC_2020"],
      experimentsFiltered: [],
      experimentsSelected: [],

      tissues: [], //["Liver", "Muscle", "Adipose", "Heart", "Neuron", "Something", "Another", "Some more", "Over"],
      tissuesFiltered: [],     
      tissuesSelected: [],

      genes: [],
      genesFiltered: [],
      genesSelected: ['Alb', 'Fga','Trf'],

    }
  },
  created() {
    console.log('Main created')

    this.columns = [
      {field:'name', header:''},
      {field:'count', header:'#'},
      {field:'freq', header:'Freq'}
    ]

    this.species = this.buildList(this.species)
    this.speciesFiltered = this.species
    
    this.experiments = this.buildList(this.experiments)
    this.experimentsFiltered = this.experiments

    this.tissues = this.buildList(this.tissues)
    this.tissuesFiltered = this.tissues

    this.genesSelected = this.buildList(this.genesSelected)

    this.$router.push('/main/bar')
  },
  async mounted() {
    // Populate array with all genes
    console.log('Main mounted, await genes: ')
    const start = Date.now()
    this.db_metadata = await DataService.getDatabaseMetadata()
      .then((e) => {
        console.log('return from getDatabaseMetadata');
        console.log(Date.now() - start);
        console.log(e)
        return e
        })
    
    this.genes = await DataService.getGenes().then((e) => {
      console.log('After await getGenes')
      console.log(Date.now() - start)
      console.log(e)
      return e
    })
    
    this.db_metadata = this.db_metadata.data
    this.loading = false
    console.log(this.db_metadata)

    // Initialize lookup table
    this.lookup_table = this.initializeLookupTable(this.db_metadata)
    console.log('this.lookup_table')
    console.log(this.lookup_table)

    this.genes = this.genes.data.map((d) => ({name: d.gene_name}))

    const metadata = this.db_metadata
    this.filtered_metadata = this.db_metadata

    // this.species = this.countMetadata(this.db_metadata, 'species')
    this.species = this.buildList([...new Set(metadata.map(item => item.species))])
    this.speciesFiltered = this.species

    console.log(this.speciesFiltered)

    // this.experiments = this.countMetadata(this.db_metadata, 'experiment')
    this.experiments = this.buildList([...new Set(metadata.map(item => item.experiment))])
    this.experimentsFiltered = this.experiments

    // this.tissues = this.countMetadata(this.db_metadata, 'tissue')
    this.tissues = this.buildList([...new Set(metadata.map(item => item.tissue))])
    this.tissuesFiltered = this.tissues

    // const expUniq = [...new Set(metadata.map(item => item.experiment))]
    // this.experiments = this.buildList(expUniq)
    // this.experimentsFiltered = this.experiments

    // const tissuesUniq = [...new Set(metadata.map(item => item.tissue))]
    // this.tissues = this.buildList(tissuesUniq)
    // this.tissuesFiltered = this.tissues

    console.log('Main mount finished')
    console.log('Time elapsed')
    console.log(Date.now() - start)
  },
  methods: {
    initializeLookupTable(metadata) {
      console.log('initializeLookupTable')
      const table = {}
      this.categories.forEach((cat) => {
        // species, experiments, tissues
        table[cat] = {}
        const uniqVal = [...new Set(metadata.map(item => item[cat]))]
        let sum = 0
        uniqVal.forEach((val) => {
          // Mouse, TRF_2020, Liver, etc. 
          table[cat][val] = {}
          table[cat][val].count = metadata
            .reduce((acc, cur) => cur[cat] === val ? ++acc : acc, 0)
          sum += table[cat][val].count
        })
        uniqVal.forEach((val) => {
          table[cat][val].freq = table[cat][val].count / sum
        })
      })
      return table

    },
    updateLookupTable(metadata, origin) {
      console.log('updateLookupTable')
      this.categories.forEach((cat) => {
        // species, experiments, tissues
        if (cat == origin) return
        const uniqVal = [...new Set(metadata.map(item => item[cat]))]
        let sum = 0
        uniqVal.forEach((val) => {
          // Mouse, TRF_2020, Liver, etc. 
          this.lookup_table[cat][val] = {}
          this.lookup_table[cat][val].count = metadata
            .reduce((acc, cur) => cur[cat] === val ? ++acc : acc, 0)
          sum += this.lookup_table[cat][val].count
        })
        uniqVal.forEach((val) => {
          this.lookup_table[cat][val].freq = this.lookup_table[cat][val].count / sum
        })
      })

    },
    // countMetadata(metadata, attr) {
    //   // console.log('countMetadata: ' + attr)
    //   let arrObj = uniq.map(e => ({
    //     name: e, 
    //     count: metadata.reduce((acc, cur) => cur[attr] === e ? ++acc : acc, 0),
    //     freq: 0}))
    //   arrObj.forEach(e => e.freq = (e.count * 100 / metadata.length).toFixed(2) + '%')
    //   console.log(arrObj)
    //   // this.species = arrObj
    //   return arrObj
    //   // this.speciesFiltered = this.species
    // },
    getCount(cat, value) {
      // cat = 'species' 
      // value = 'Human'
      if (Object.keys(this.lookup_table[cat]).includes(value))
        return this.lookup_table[cat][value].count
      return null
    },
    getFreq(cat, value) {
      if (Object.keys(this.lookup_table[cat]).includes(value))
        return (this.lookup_table[cat][value].freq * 100).toFixed(2) + '%'
      return null
    },
    updatePlot() {
      console.log('updatePlot')
      console.log(this.genesSelected)
    },
    buildList(list) {
      return list.map(object => {
        return {'name' : object}
    })},
    // filterList(list, s) {
    //   // console.log('filterList')
    //   list.forEach(object => {
    //     object.visible = (object.name.toLowerCase().includes(s.toLowerCase()));
    //   })
    // },
    speciesRowChange(e) {
      // console.log('================')
      // console.log('speciesRowChange')
      // console.log('================')
      // console.log('this.speciesSelected')
      // console.log(this.speciesSelected)
      const result = this.filterResults()
      // console.log('result')
      // console.log(result)
      this.updateLookupTable(result, 'species')
      // console.log('lookup_table')
      // console.log(this.lookup_table)
      //
      this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
      if (!this.speciesSelected.length)
        this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])

    },
    // speciesChange(e) {
    //   console.log('speciesChange')
    //   const result = this.filterResults()
    //   //
    //   this.lookup_table = this.updateLookupTable(result)
    //   //
    //   this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
    //   this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
    //   if (!e.value.length)
    //     this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])

    // },
    experimentsRowChange(e) {
      // console.log('================')
      // console.log('experimentsRowChange')
      // console.log('================')
      // console.log(e)
      // console.log(this.experimentsSelected)
      const result = this.filterResults()

      // console.log('result')
      // console.log(result)

      this.updateLookupTable(result, 'experiment')

      this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
      this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])

      if (!this.experimentsSelected.length) {
        console.log('No experiments selected')
        // this.experimentsFiltered = this.countMetadata(result, 'experiment')
        this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      }

    },
    // experimentsChange(e) {
    //   console.log('experimentsChange')
    //   const result = this.filterResults()
    //   this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
    //   this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
    //   if (!e.value.length)
    //     this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])

    // },
    tissuesRowChange(e) {
      // console.log('================')
      // console.log('tissuesRowChange')
      // console.log('================')
      // console.log(e)
      // console.log(this.tissuesSelected)
      const result = this.filterResults()
      // console.log('result')
      // console.log(result)
      //let origin = this.tissuesSelected.length ? 'tissue' : ''
      this.updateLookupTable(result, 'tissue')
      
      this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
      this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
      
      // this.speciesFiltered = this.countMetadata(result, 'species')
      // console.log('this.speciesFiltered')
      // console.log(this.speciesFiltered)
      // this.experimentsFiltered = this.countMetadata(result, 'experiment')
      if (!this.tissuesSelected.length) {
        // console.log('No tissue selected')
        // this.tissuesFiltered = this.countMetadata(result, 'tissue')
        this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])
      }
        

    },
    // tissuesChange(e) {
    //   console.log('tissuesChange')
    //   const result = this.filterResults()
    //   this.speciesFiltered = this.buildList([...new Set(result.map(item => item.species))])
    //   this.experimentsFiltered = this.buildList([...new Set(result.map(item => item.experiment))])
    //   if (!e.value.length)
    //     this.tissuesFiltered = this.buildList([...new Set(result.map(item => item.tissue))])

    // },
    filterResults() {
      // Inputs are arrays of strings
      // If array is empty then no filter is performed
      const speciesSelectedNames = this.speciesSelected.map(el => el.name)
      const experimentsSelectedNames = this.experimentsSelected.map(el => el.name)
      const tissuesSelectedNames = this.tissuesSelected.map(el => el.name)

      let result = this.db_metadata

      if (speciesSelectedNames.length)
        result = result.filter(
          ({ species }) => speciesSelectedNames.some(
            (s) => species.toLowerCase().includes(s.toLowerCase())))

      if (experimentsSelectedNames.length) 
        result = result.filter(
          ({ experiment }) => experimentsSelectedNames.some(
            (s) => experiment.toLowerCase().includes(s.toLowerCase())))

      if (tissuesSelectedNames.length)
        result = result.filter(
          ({ tissue }) => tissuesSelectedNames.some(
            (s) => tissue.toLowerCase().includes(s.toLowerCase())))

      return result
    },
    searchGenes(event) {
      //console.log('searchGenes')
      //console.log(event.query)
      //console.log(this.genes)
      setTimeout(() => {
        if (!event.query.trim().length) {
            this.genesFiltered = [...this.genes];
        }
        else {
            this.genesFiltered = this.genes.filter((gene) => {
                return gene.name.toLowerCase().startsWith(event.query.toLowerCase());
            });
            //console.log(this.genesFiltered)
        }
      }, 250);
    },
  },


}
</script>

<style>

</style>