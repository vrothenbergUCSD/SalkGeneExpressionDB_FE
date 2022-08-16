<template>
  <div class="surface-card p-4 shadow-2 border-round w-11/12 mx-auto mt-6">
    <div class="w-11/12 mx-auto">
      <Toast />
      <div class="text-center my-5">
          <div class="text-900 text-3xl font-medium mb-3">Upload New Dataset</div>
      </div>
      <div id="dataset-details" class="text-xl font-medium mb-3">
        Dataset details
      </div>
      <div class="p-fluid grid">
        <div id="left-panels" class="col-12">
          <div class="p-fluid grid formgrid">
            <div class="field col-7 pr-2">
              <label for="experiment" class="block text-900 font-medium mb-2">Experiment name</label>
              <InputText v-model="experiment" type="text" class="w-full mb-2" :class="{ 'p-invalid': experimentInvalid }" />
              <small id="experiment-help" class="p-error" v-show="experimentInvalid">{{ experimentErrorMsg}}</small>
            </div> 
            <div class="field col-3">
              <label for="year" class="block text-900 font-medium mb-2">Year</label>
              <InputNumber v-model="year" mode="decimal" :useGrouping="false" class="w-full mb-2" :class="{ 'p-invalid': yearInvalid }" />
              <small id="year-help" class="p-error" v-show="yearInvalid">{{ yearErrorMsg}} </small>
            </div>
          </div>

          <div class="p-fluid grid ">
            <div class="field col-7 pr-2">
              <label for="institution" class="block text-900 font-medium mb-2">Institution name</label>
              <InputText v-model="institution" type="text" class="w-full mb-2" :class="{ 'p-invalid': institutionInvalid }" />
              <small id="institution-help" class="p-error" v-show="institutionInvalid">{{ institutionErrorMsg}}</small>
            </div>
            <div class="field col-3">
              <label for="species" class="block text-900 font-medium mb-2">Species</label>
              <InputText v-model="species" type="text" class="w-full mb-2" :class="{ 'p-invalid': speciesInvalid }" />
              <small id="species-help" class="p-error" v-show="speciesInvalid">{{ speciesErrorMsg}}</small>
            </div>
          </div>

          <div class="p-fluid grid">
            <div class="field col-7 pr-2">
              <label for="doi" class="block text-900 font-medium mb-2">DOI</label>
              <InputText v-model="doi" type="text" class="w-full mb-2" :class="{ 'p-invalid': doiInvalid }" />
              <small id="doi-help" class="p-error" v-show="doiInvalid">{{ doiErrorMsg}}</small>
            </div>

            <div class="field col-3">
              <label for="tissue" class="block text-900 font-medium mb-2">Tissue</label>
              <InputText v-model="tissue" type="text" class="w-full mb-2" :class="{ 'p-invalid': tissueInvalid }" />
              <small id="tissue-help" class="p-error" v-show="tissueInvalid">{{ tissueErrorMsg}}</small>
            </div>
          </div>
        </div>
      </div>

        <div class="p-fluid grid">
          <div class="col-10">
          <label for="other" class="block text-900 font-medium mb-2">Other information</label>
          <Textarea v-model="other" rows="5" cols="90" :class="{ 'p-invalid': otherInvalid }"/>
          <small id="other-help" class="p-error" v-show="otherInvalid">{{ otherErrorMsg}}</small>
          </div>
        </div>

       
        <Button label="Save Details" @click="save" class="my-3"/> 
        <div v-show="saveMsg" class="my-3">{{ saveMsg }}</div>

        <div v-show="databaseTablePrefix" class="my-3">
          Database Table Prefix: <span class="font-mono pl-3">{{ databaseTablePrefix }}</span>
        </div>
      


      <div id="gene_metadata">
        <div class="text-xl font-medium mb-3 mt-5">
          Gene Metadata
        </div>
        <div class="mb-3"> 
          The gene metadata table must be a CSV file conforming to the following format. 
        </div>
        
        <div>
            <DataTable :value="gene_metadata" class="p-datatable-sm" responsiveLayout="scroll">
                <Column field="gene_id" header="gene_id <UNIQUE>"></Column>
                <Column field="gene_name" header="gene_name"></Column>
                <Column field="refseq" header="refseq"></Column>
                <Column field="chr" header="chr"></Column>
                <Column field="start" header="start"></Column>
                <Column field="end" header="end"></Column>
                <Column field="strand" header="strand"></Column>
                <Column field="length" header="length"></Column>
                <Column field="description" header="description"></Column>
                <Column field="ensembl_gene_id" header="ensembl_gene_id"></Column>
                <Column field="gene_biotype" header="gene_biotype"></Column>
                <Column field="copies" header="copies"></Column>
                <Column field="annotation_divergence" header="annotation_divergence"></Column>
                <Column field="external_gene_name" header="external_gene_name"></Column>
                <Column field="ensembl_peptide_id" header="ensembl_peptide_id"></Column>
            </DataTable>
        </div>


        <div class="my-3 flex items-center align"> 
          <div>
            Download gene metadata template CSV: 
          </div>
          
          <div>
            <Button label="Template" class="p-button-link" @click="download('gene_metadata_template.csv')"/>
          </div>
        </div>

        <div id="upload_gene_metadata_error_panel" v-show="this.upload_gene_metadata_error" class="my-3">
          <Panel header="Gene Metadata Error Log" class="p-error">
            <ScrollPanel style="width: 100%; height: 200px" class="custom">
              <li v-for="error in this.upload_gene_metadata_error_log">
                {{ error }}
              </li>
            </ScrollPanel>
          </Panel>
        </div>

        <div  class="flex items-center content-center my-1">
          <div class="text-lg align-middle font-medium">Select gene metadata CSV</div>
          <div class="ml-5" >
            <FileUpload :class="{ 'p-button-warning': upload_gene_metadata_highlight }" mode="basic" name="upload_gene_metadata" 
            :chooseLabel="upload_gene_metadata_filename" :auto="true" 
            :customUpload="true" accept=".csv" :maxFileSize="100000000" 
            @uploader="upload_gene_metadata" />
          </div>
        </div>

        

      </div>

      <div id="sample_metadata">
        <div class="text-xl font-medium mb-3 mt-5">
          Sample Metadata
        </div>
        <div class="mb-3"> 
          The sample metadata table must be a CSV file conforming to the following format. 
        </div>
        
        <div>
            <DataTable :value="sample_metadata" class="p-datatable-sm" responsiveLayout="scroll">
                <Column field="sample_name" header="sample_name <UNIQUE>"></Column>
                <Column field="species" header="species"></Column>
                <Column field="time_point" header="time_point"></Column>
                <Column field="group_name" header="group_name"></Column>
                <Column field="age_years" header="age"></Column>
                <Column field="gender" header="gender"></Column>
                <Column field="tissue" header="tissue"></Column>
                <Column field="number_of_replicates" header="number_of_replicates"></Column>
                <Column field="data_type" header="data_type"></Column>
            </DataTable>
        </div>


        <div class="my-3 flex items-center align"> 
          <div>
            Download sample metadata template CSV: 
          </div>
          
          <div>
            <Button label="Template" class="p-button-link" @click="download('sample_metadata_template.csv')"/>
          </div>
          
        </div>

        <div id="upload_sample_metadata_error_panel" v-show="this.upload_sample_metadata_error" class="my-3">
          <Panel header="Sample Metadata Error Log" class="custom">
            <ScrollPanel style="width: 100%; height: 200px" class="custom">
              <li v-for="error in this.upload_sample_metadata_error_log">
                {{ error }}
              </li>
            </ScrollPanel>
          </Panel>
        </div>

        <!-- <div>
          <div class="text-lg font-medium mb-3">Upload sample metadata CSV </div>
          <FileUpload mode="basic" name="upload_sample_metadata" :chooseLabel="upload_sample_metadata_filename" :auto="true" :customUpload="true" accept=".csv" :maxFileSize="100000000" @uploader="upload_sample_metadata" />
        </div> -->

        <div class="flex items-center content-center my-1">
          <div class="text-lg align-middle font-medium">Select sample metadata CSV</div>
          <div class="ml-5">
            <FileUpload :class="{ 'p-button-warning': upload_sample_metadata_highlight }" 
            mode="basic" name="upload_sample_metadata" 
            :chooseLabel="upload_sample_metadata_filename" :auto="true" 
            :customUpload="true" accept=".csv" :maxFileSize="100000000" 
            @uploader="upload_sample_metadata" />

          </div>
        </div>

      </div>

    

      <div id="gene_expression_data">
        <div class="text-xl font-medium mb-3 mt-5">
          Gene Expression Data
        </div>
        <div class="mb-3"> 
          The gene expression table must be a CSV file conforming to the following format. 
        </div>
        
        <div>
            <DataTable :value="gene_expression_data" autoLayout class="p-datatable-sm" responsiveLayout="scroll">
                <Column field="gene_id" header="gene_id <UNIQUE>"></Column>
                <Column field="sample_name" header="sample_name <UNIQUE>"></Column>
                <Column field="gene_expression" header="gene_expression"></Column>
            </DataTable>
        </div>


        <div class="my-3 flex items-center align"> 
          <div>
            Download gene expression data template CSV: 
          </div>
          
          <div>
            <Button label="Template" class="p-button-link" @click="download('geneexpression_data_template.csv')"/>
          </div>
          
        </div>

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

      <div class="mx-auto my-5">
        <div class="text-center my-5">
          <div class="text-900 text-2xl font-medium mb-3">Finalize and upload dataset</div>
        </div>
        <div class="my-3 p-error" v-show="uploadMsg">
          {{ uploadMsg }}
        </div>
        <div id="upload_files_error_panel" v-show="this.upload_files_error" class="my-3">
          <Panel header="Upload Files Error Log" class="custom">
            <ScrollPanel style="width: 100%; height: 200px" class="custom">
              <li v-for="error in this.upload_files_error_log">
                {{ error }}
              </li>
            </ScrollPanel>
          </Panel>
        </div>
        
        <div class="mx-auto flex items-center justify-center">
          <Button label="Upload Files" icon="pi pi-cloud" class="p-button-lg mx-auto"  @click="upload_files" v-show="!this.uploading"/>
        </div>
        <div class="mx-auto my-3 w-1/3" v-show="this.uploading">
          <ProgressBar :value="this.upload_progress"/>
        </div>
        <!-- <span v-show="uploadMsg">{{ uploadMsg }} </span> -->
      </div>

    </div>

  </div>
</template>

<script>
import Toast from 'primevue/toast'
import FileUpload from 'primevue/fileupload'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Panel from 'primevue/panel'
import ScrollPanel from 'primevue/scrollpanel'
import Divider from 'primevue/divider'
import ProgressBar from 'primevue/progressbar'

import { storage, firestore } from "@/firebase/firebaseInit.js"
import { ref, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { doc, collection, getDoc, addDoc, setDoc } from "firebase/firestore"

import DataService from "@/services/DataService.js"

export default {
  components: {
    Toast,
    FileUpload, 
    InputText,
    InputNumber,
    DataTable,
    Column, 
    Button,
    Textarea,
    Panel,
    ScrollPanel,
    Divider,
    ProgressBar,

  },
  data() {
    return {
      experiment: null,
      experimentInvalid: null,
      experimentErrorMsg: null,

      species: null,
      speciesInvalid: null, 
      speciesErrorMsg: null,

      year: null, 
      yearInvalid: null,
      yearErrorMsg: null, 

      tissue: null,
      tissueInvalid: null, 
      tissueErrorMsg: null,  

      institution: null, 
      institutionInvalid: null,
      institutionErrorMsg: null, 

      other: null, 
      otherInvalid: null,
      otherErrorMsg: null,

      doi: null, 
      doiInvalid: null,
      doiErrorMsg: null,

      saveMsg: null,
      databaseTablePrefix: null, 

      gene_metadata: [
        {
          'gene_id': '<REQUIRED>', 
        'gene_name': '<REQUIRED>', 
        'refseq' : '<REQUIRED>', 
        'chr' : '<REQUIRED>',
        'start' : '<REQUIRED>',
        'end' : '<REQUIRED>',
        'strand' : '<REQUIRED>',
        'length' : '<REQUIRED>',
        'description' : '<REQUIRED>',
        'ensembl_gene_id' : '<REQUIRED>',
        'gene_biotype' : '<REQUIRED>',
        'copies' : '<OPTIONAL>',
        'annotation_divergence' : '<OPTIONAL>',
        'external_gene_name' : '<OPTIONAL>',
        'ensembl_peptide_id' : '<OPTIONAL>'},
        {
          'gene_id': '<String>', 
        'gene_name': '<String>', 
        'refseq' : '<String>', 
        'chr' : '<String>',
        'start' : '<Integer>',
        'end' : '<Integer>',
        'strand' : '<Char(+/-)>',
        'length' : '<Float>',
        'description' : '<String>',
        'ensembl_gene_id' : '<String>',
        'gene_biotype' : '<String>',
        'copies' : '<Integer>',
        'annotation_divergence' : '<String>',
        'external_gene_name' : '<String>',
        'ensembl_peptide_id' : '<String>'},
      ],
      sample_metadata: [
        {'sample_name': '<REQUIRED>', 
        'species': '<REQUIRED>', 
        'time_point' : '<REQUIRED>', 
        'group_name' : '<REQUIRED>',
        'age' : '<REQUIRED>',
        'gender' : '<REQUIRED>',
        'tissue' : '<REQUIRED>',
        'number_of_replicates' : '<REQUIRED>',
        'data_type' : '<REQUIRED>',
        },
        {'sample_name': '<String>', 
        'species': '<String>', 
        'time_point' : '<String>', 
        'group_name' : '<String>',
        'age' : '<Float>',
        'gender' : '<String>',
        'tissue' : '<String>',
        'number_of_replicates' : '<Integer>',
        'data_type' : '<String>',
        },
      ],
      gene_expression_data: [
        {
          'gene_id' : '<REQUIRED>',
          'sample_name' : '<REQUIRED>',
          'gene_expression' : '<REQUIRED>',
        },
        {
          'gene_id' : '<String>',
          'sample_name' : '<String>',
          'gene_expression' : '<Float>',
        }

      ],

      upload_gene_metadata_error: null,
      upload_gene_metadata_error_log: null,
      upload_gene_metadata_filename: 'Select', 
      upload_gene_metadata_file: null,
      upload_gene_metadata_highlight: null,

      upload_sample_metadata_error: null,
      upload_sample_metadata_error_log: null,
      upload_sample_metadata_filename: 'Select', 
      upload_sample_metadata_file: null,
      upload_sample_metadata_highlight: null,

      upload_gene_expression_data_error: null,
      upload_gene_expression_data_error_log: null,
      upload_gene_expression_data_filename: 'Select', 
      upload_gene_expression_data_file: null,
      upload_gene_expression_data_highlight: null, 

      uploadMsg: null,
      upload_files_error: null, 
      upload_files_error_log: null, 
      upload_progress: 0,
      uploading:null,

    }
  },
  methods: {
    startProgress() {
      this.interval = setInterval(() => {
        let newValue = this.upload_progress + 5;
        if (newValue >= 99) {
            newValue = 99;
        }
        this.upload_progress = newValue;
      }, 1000);
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
    upload_gene_metadata(e) {
      console.log('upload_gene_metadata')
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
        }
      }
    },
    upload_sample_metadata(e) {
      console.log('upload_sample_metadata')
      const files = e.files
      const file = files[0]
      const col_names = ['sample_name',	'species',	'time_point',	'group_name',
      	'age_years',	'gender',	'tissue',	'number_of_replicates',	'data_type']
      const col_types = ['string', 'string', 'string', 'string', 'float', 
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
        } else {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed Type Validation', life: 5000});
          this.upload_sample_metadata_filename = 'Select'
          this.upload_sample_metadata_file = null
        }
      }

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
    download(file) {
      // console.log('download', file)
      const fileRef = ref(storage, file)
      // console.log(fileRef)
      // const url = `gs://rbio-p-datasharing.appspot.com/${file}`;
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
      formData.append('files', this.upload_gene_metadata_file)
      formData.append('files', this.upload_sample_metadata_file)
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
        permittedUsers: [],
        gene_metadata_table_name: `${gene_metadata_table_name}_${this.$store.state.profileId}`,
        sample_metadata_table_name: `${sample_metadata_table_name}_${this.$store.state.profileId}`,
        gene_expression_data_table_name: `${gene_expression_data_table_name}_${this.$store.state.profileId}`,
      }

      // formData.append('body', metadata)
      for (const [key, value] of Object.entries(metadata)) {
        formData.append(key, value)
      }

      formData.append('gene_metadata_filename', this.upload_gene_metadata_filename)
      formData.append('sample_metadata_filename', this.upload_sample_metadata_filename)
      formData.append('gene_expression_data_filename', this.upload_gene_expression_data_filename)

      let api_result = await DataService.postDataset(formData)
      const time_elapsed = (Date.now() - start) / 1000
      console.log(`post_dataset: Time elapsed: ${time_elapsed}s`)
      this.uploading=false
      this.endProgress()
      return api_result
    },
    
    async upload_files() {
      console.log('upload_files')
      this.upload_files_error = false
      this.upload_gene_metadata_highlight = false
      this.upload_sample_metadata_highlight = false
      this.upload_gene_expression_data_highlight = false
      this.upload_files_error_log = []

      this.save()
      if (!this.saveMsg) {
        // Failed validation
        this.upload_files_error = true
        this.upload_files_error_log.push('ERROR: Failed validation of dataset details.')

        const element = document.getElementById("dataset-details");
        element.scrollIntoView({behavior:"smooth"})
        console.log('Failed validation')
        return 
      }

      if (!this.upload_gene_metadata_file) {
        this.upload_files_error = true
        this.upload_gene_metadata_highlight = true
        this.upload_files_error_log.push('ERROR: Missing gene metadata file.')
        const element = document.getElementById("gene_metadata");
        element.scrollIntoView({behavior:"smooth"})
        console.log('ERROR: Missing gene metadata file.')
      }

      if (!this.upload_sample_metadata_file) {
        this.upload_files_error = true
        this.upload_sample_metadata_highlight = true
        this.upload_files_error_log.push('ERROR: Missing sample metadata file.')
        const element = document.getElementById("sample_metadata");
        element.scrollIntoView({behavior:"smooth"})
        console.log('ERROR: Missing sample metadata file.')
      }

      if (!this.upload_gene_expression_data_file) {
        this.upload_files_error = true
        this.upload_gene_expression_data_highlight = true
        this.upload_files_error_log.push('ERROR: Missing gene expression data file.')
        const element = document.getElementById("gene_expression_data");
        element.scrollIntoView({behavior:"smooth"})
        console.log('ERROR: Missing gene expression data file.') 
      }

      if (this.upload_files_error) return

      const gene_metadata_table_name = `${this.databaseTablePrefix}_gene_metadata`
      const sample_metadata_table_name = `${this.databaseTablePrefix}_sample_metadata`
      const gene_expression_data_table_name = `${this.databaseTablePrefix}_gene_expression_data`

      const auth = getAuth()
      const datasetsCollectionRef = collection(firestore, 'datasets')

      const newDocRef = doc(firestore, 'datasets', this.databaseTablePrefix)
      // console.log('newDocRef')
      // console.log(newDocRef)

      const docSnap = await getDoc(newDocRef);

      if (docSnap.exists()) {
        console.log('ERROR: Dataset already exists.')
        this.upload_files_error = true 
        this.upload_files_error_log.push(`ERROR: Dataset ${this.databaseTablePrefix} already exists in database.
        \nIf you are the owner of the dataset you can modify its tables here: [NOT IMPLEMENTED]`)
      } else {
        await setDoc(newDocRef, {
          owner: this.$store.state.profileId,
          experiment: this.experiment || 'TestExp', 
          institution: this.institution || 'Inst', 
          species: this.species || 'Human', 
          tissue: this.tissue || 'Brain', 
          year: this.year || '2022', 
          doi : this.doi || 'https://doi.org/10.1016/S0092-8674(02)00722-5',
          otherInformation: this.other,
          permittedUsers: [],
          gene_metadata_table_name: gene_metadata_table_name,
          sample_metadata_table_name: sample_metadata_table_name,
          gene_expression_data_table_name: gene_expression_data_table_name,
        }).catch((err) => {
          console.log('Fail after await setDoc')
          console.log(err)
        })
        console.log('Success!')

        let api_result = await this.post_dataset()
        console.log('api_result')
        console.log(api_result)
        if (api_result.status != 200) {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'HTTP Error', life: 10000});
          this.upload_files_error = true
          this.upload_files_error_log.push(`ERROR: ${api_result.statusText}`)
        } else {
          this.$toast.add({severity: 'success', summary: 'Success', detail: 'Dataset Uploaded', life: 10000});
        }

        for (let i = 0; i < api_result.data.errorLog.length; i++) {
          if (api_result.data.errorLog[i].length > 0) {
            this.upload_files_error_log.concat(api_result.data.errorLog[i]) 
          }
        } 

        if (this.upload_files_error_log.length > 0) {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Error Uploading', life: 10000});
        }
      }
    }
  }

}
</script>

<style lang="scss" scoped>
.p-panel-header {
  background-color:#EF4444 !important;
  color: white !important;
}
.custom .p-scrollpanel-wrapper {
    border-right: 9px solid #f4f4f4;
}

.custom .p-scrollpanel-bar {
    background-color: #1976d2 !important;
    opacity: 0.5;
    transition: background-color .3s;
}

.custom .p-scrollpanel-bar:hover {
    background-color: #135ba1;
}

</style>