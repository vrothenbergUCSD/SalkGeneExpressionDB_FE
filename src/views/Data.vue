<template>
  <div class="surface-card p-4 shadow-2 border-round w-11/12 mx-auto mt-6">
    <div class="w-11/12 mx-auto">
      <Toast />
      <div class="text-center my-5">
          <div class="text-900 text-3xl font-medium mb-3">Upload New Dataset</div>
      </div>
      <div class="text-xl font-medium mb-3">
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
              <small id="year-help" class="p-error" v-show="yearInvalid">{{ yearErrorMsg}}</small>
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

        <!-- <div>
          <div class="text-lg font-medium mb-3">Upload gene metadata CSV </div>
          <FileUpload mode="basic" name="upload_gene_metadata" :chooseLabel="upload_gene_metadata_filename" :auto="true" :customUpload="true" accept=".csv" :maxFileSize="100000000" @uploader="upload_gene_metadata" />
        </div> -->

        <div class="flex items-center content-center my-1">
          <div class="text-lg align-middle font-medium">Select gene metadata CSV</div>
          <div class="ml-5">
            <FileUpload mode="basic" name="upload_gene_metadata" 
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
            <FileUpload mode="basic" name="upload_sample_metadata" 
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
          <Panel header="Gene Metadata Error Log" class="p-error">
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
            <FileUpload mode="basic" name="upload_gene_expression_data" 
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
        <div class="my-3 p-error">
          {{ uploadMsg }}
        </div>
        
        <div class="mx-auto flex items-center justify-center">
          <Button label="Upload Files" icon="pi pi-cloud" class="p-button-lg mx-auto"  @click="uploadFiles"/>
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
import Textarea from 'primevue/textarea';
import Panel from 'primevue/panel';
import ScrollPanel from 'primevue/scrollpanel';
import Divider from 'primevue/divider'

import { storage, firestore } from "@/firebase/firebaseInit.js"
import { ref, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { doc, collection, getDoc, addDoc, setDoc } from "firebase/firestore"

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

      uploadMsg: null,

      upload_gene_metadata_error: null,
      upload_gene_metadata_error_log: null,
      upload_gene_metadata_filename: 'Select', 
      upload_gene_metadata_file: null,

      upload_sample_metadata_error: null,
      upload_sample_metadata_error_log: null,
      upload_sample_metadata_filename: 'Select', 
      upload_sample_metadata_file: null,

      upload_gene_expression_data_error: null,
      upload_gene_expression_data_error_log: null,
      upload_gene_expression_data_filename: 'Select', 
      upload_gene_expression_data_file: null,

    }
  },
  methods: {
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
      console.log(e)
      const files = e.files
      const file = files[0]
      console.log(file)
      console.log(typeof(file))
      const col_names = ['gene_id',	'gene_name',	'refseq',	'chr',	'start',	'end',
      	'strand',	'length',	'copies',	'annotation_divergence',	'ensembl_gene_id',
        'description',	'external_gene_name',	'gene_biotype',	'ensembl_peptide_id']
      const col_types = ['string', 'string', 'string', 'string', 'integer', 
        'integer', 'char(+/-)', 'float', 'string', 'string', 'string', 'optional',
        'optional', 'optional', 'optional']

      // const strand_chars = ['+', '-']

      let error_log = []
      const gene_ids = {}

      // Loads entire file into memory? 
      let reader = new FileReader() 
      reader.readAsText(file)
      reader.onload = (evt) => {
        console.log('reader.onload')
        let csv = evt.target.result
        error_log = this.validateCSV(csv, col_names, col_types)

        this.upload_gene_metadata_error_log = error_log
        this.upload_gene_metadata_error = error_log.length
        
        console.log('reader.onload finished')
        if (!this.upload_gene_metadata_error) {
          this.$toast.add({severity: 'success', summary: 'Success', detail: 'File Validated', life: 5000});
          this.upload_gene_metadata_filename = file.name
          this.upload_gene_metadata_file = file
        } else {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed Type Validation', life: 5000});
          this.upload_gene_metadata_filename = 'Select'
          this.upload_gene_metadata_file = null
        }
      }
    },
    upload_sample_metadata(e) {
      console.log('upload_sample_metadata')
      console.log(e)
      const files = e.files
      const file = files[0]
      console.log(file)
      console.log(typeof(file))
      const col_names = ['sample_name',	'species',	'time_point',	'group_name',
      	'age',	'gender',	'tissue',	'number_of_replicates',	'data_type']
      const col_types = ['string', 'string', 'string', 'string', 'float', 
        'string', 'string', 'integer', 'string']

      let error_log = []
      const sample_names = {}

      // Loads entire file into memory? 
      let reader = new FileReader() 
      reader.readAsText(file)
      reader.onload = (evt) => {
        console.log('reader.onload')
        let csv = evt.target.result
        error_log = this.validateCSV(csv, col_names, col_types)

        this.upload_sample_metadata_error_log = error_log
        this.upload_sample_metadata_error = error_log.length
        
        
        if (!this.upload_sample_metadata_error) {
          this.$toast.add({severity: 'success', summary: 'Success', detail: 'File Validated', life: 5000});
          this.upload_sample_metadata_filename = file.name
          this.upload_sample_metadata_file = file
        } else {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed Type Validation', life: 5000});
          this.upload_sample_metadata_filename = 'Select'
          this.upload_sample_metadata_file = null
        }
        console.log('reader.onload finished')
      }

    },
    upload_gene_expression_data(e) {
      console.log('upload_gene_expression_data')
      console.log(e)
      const files = e.files
      const file = files[0]
      console.log(file)
      console.log(typeof(file))
      const col_names = ['gene_id', 'sample_name', 'gene_expression']
      const col_types = ['string', 'string', 'float']

      let error_log = []
      const sample_names = {}

      // Loads entire file into memory? 
      let reader = new FileReader() 
      reader.readAsText(file)
      reader.onload = (evt) => {
        console.log('reader.onload')
        let csv = evt.target.result
        error_log = this.validateCSV(csv, col_names, col_types)

        this.upload_gene_expression_data_error_log = error_log
        this.upload_gene_expression_data_error = error_log.length
        
        
        if (!this.upload_gene_expression_data_error) {
          this.$toast.add({severity: 'success', summary: 'Success', detail: 'File Validated', life: 5000});
          this.upload_gene_expression_data_filename = file.name
          this.upload_gene_expression_data_file = file
        } else {
          this.$toast.add({severity: 'error', summary: 'Error', detail: 'Failed Type Validation', life: 5000});
          this.upload_gene_expression_data_filename = 'Select'
          this.upload_gene_expression_data_file = null
        }
        console.log('reader.onload finished')
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

      // Validate experiment 
      if (!this.experiment) {
        console.log('ERROR: Invalid experiment name')
        this.experimentInvalid = true
        this.experimentErrorMsg = "Experiment name required."
        return 
      }
      this.experimentInvalid = false

      // Validate year
      this.year = Number.parseInt(this.year)
      if (!this.year) {
        console.log('ERROR: Year required.')
        this.yearInvalid = true
        this.yearErrorMsg = "Year required."
        return 
      } else if (this.year > 2050 || this.year < 1850) {
        console.log('ERROR: Year must be reasonable.')
        this.yearInvalid = true 
        this.yearErrorMsg = "Year must be non-silly."
        return
      }
      this.yearInvalid = false

      // Validate institution
      if (this.institution && this.institution.length > 100) {
        console.log('ERROR: Institution name too long')
        this.institutionInvalid = true 
        this.institutionErrorMsg = "Institution name too long, must be less than 100 characters."
        return
      }
      this.institutionInvalid = false

      // Validate species
      if (!this.species) {
        console.log('ERROR: Invalid species name')
        this.speciesInvalid = true
        this.speciesErrorMsg = "Species name required."
        return 
      }
      this.speciesInvalid = false

      RegExp.escape = function(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      };

      // Validate doi 
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
        return
      } else {
        console.log('DOI found: ', found + ' in ' + this.doi)
      }
      this.doiInvalid = false

      // Validate tissue
      if (!this.tissue) {
        console.log('ERROR: Invalid tissue')
        this.tissueInvalid = true
        this.tissueErrorMsg = "Tissue required."
        return 
      }
      this.tissueInvalid = false

      // Validate other details 
      if (this.other && this.other.length > 10000) {
        console.log('ERROR: Other details too long.')
        this.otherInvalid = true 
        this.otherErrorMsg = "Other information section too long, must be less than 10,000 characters."
        return 
      }
      this.otherInvalid = false

      this.saveMsg = "Dataset details saved."
      this.databaseTablePrefix = `${this.experiment}_${this.species}_${this.tissue}_${this.year}`

    },
    async uploadFiles() {
      console.log('uploadFiles')
      this.save()
      if (!this.saveMsg) {
        // Failed validation
        console.log('Failed validation')
        // return 
      }
      this.databaseTablePrefix = 'TestExperiment_Human_Brain_2022'

      const gene_metadata_table_name = `${this.databaseTablePrefix}_gene_metadata`
      const sample_metadata_table_name = `${this.databaseTablePrefix}_sample_metadata`
      const gene_expression_data_table_name = `${this.databaseTablePrefix}_gene_expression_data`

      const auth = getAuth()
      const datasetsCollectionRef = collection(firestore, 'datasets')
      // console.log('datasetsCollectionRef')
      // console.log(datasetsCollectionRef)

      const newDocRef = doc(firestore, 'datasets', this.databaseTablePrefix)
      console.log('newDocRef')
      console.log(newDocRef)

      const docSnap = await getDoc(newDocRef);

      if (docSnap.exists()) {
        console.log('ERROR: Dataset already exists.')
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

      }

    }
  }

}
</script>

<style>
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