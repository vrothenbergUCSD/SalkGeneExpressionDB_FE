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

        <div>
          <div class="text-lg font-medium mb-3">Upload gene metadata CSV </div>
          <FileUpload mode="basic" name="demo[]" url="./upload.php" accept=".csv" :maxFileSize="1000000" @upload="onUpload" />
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
                <Column field="age" header="age"></Column>
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

        <div>
          <div class="text-lg font-medium mb-3">Upload sample metadata CSV </div>
          <FileUpload mode="basic" name="demo[]" url="./upload.php" accept=".csv" :maxFileSize="1000000" @upload="onUpload" />
        </div>

      </div>

      <div id="expression_data">
        <div class="text-xl font-medium mb-3 mt-5">
          Gene Expression Data
        </div>
        <div class="mb-3"> 
          The gene expression table must be a CSV file conforming to the following format. 
        </div>
        
        <div>
            <DataTable :value="expression_data" autoLayout class="p-datatable-sm" responsiveLayout="scroll">
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

        <div>
          <div class="text-lg font-medium mb-3">Upload sample metadata CSV </div>
          <FileUpload mode="basic" name="demo[]" url="./upload.php" accept=".csv" :maxFileSize="1000000" @upload="onUpload" />
        </div>

      </div>

      <div class="mx-auto my-5">
        <div>
          
        </div>
        <span v-show="uploadMsg">{{ uploadMsg }} </span>
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


export default {
  components: {
    Toast,
    FileUpload, 
    InputText,
    InputNumber,
    DataTable,
    Column, 
    Button,
    Textarea

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
        'length' : '<Integer>',
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
        'age' : '<Integer>',
        'gender' : '<String>',
        'tissue' : '<String>',
        'number_of_replicates' : '<Integer>',
        'data_type' : '<String>',
        },
      ],
      expression_data: [
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



    }
  },
  methods: {
    onUpload() {
      this.$toast.add({severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000});
    },
    download(file) {
      const url = `/files/${file}`;
      window.location.href = url;
    },
    save() {
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

      this.saveMsg = "Dataset details successfully saved."
      this.databaseTablePrefix = `${this.experiment}_${this.species}_${this.tissue}_${this.year}`
    





    },
  }

}
</script>

<style>

</style>