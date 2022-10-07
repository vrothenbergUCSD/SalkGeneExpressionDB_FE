<template>
  <div>
    <div class="font-semibold">Filtered Dataset</div>
    <DataTable :value="dataset" :scrollable="true"
      scrollDirection="both" class="p-datatable-sm" :paginator="true" :rows="10"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      :rowsPerPageOptions="[10,20,50]" currentPageReportTemplate="Showing {first} to {last} of {totalRecords}">
      <Column field="gene_id" header="Gene ID" style="width: 10rem"></Column>
      <Column field="gene_expression" header="Gene Expression" style="width: 7rem">
        <template #body="slotProps">
          {{Math.round(slotProps.data.gene_expression * 1000)/1000}}
        </template>
      </Column>
      <Column field="data_type" header="Data Type" style="width: 8rem"></Column>
      <Column field="sample_name" header="Sample Name" style="width: 10rem"></Column>
      <Column field="time_point" header="Time Point (ZT)" style="width: 7rem"></Column>
      <Column field="condition" header="Condition" style="width: 7rem"></Column>
      <Column field="species" header="Species" style="width: 8rem"></Column>
      <Column field="tissue" header="Tissue" style="width: 8rem"></Column>
      <Column field="age_months" header="Age (months)" style="width: 8rem"></Column>
      <Column field="gender" header="Gender" style="width: 6rem"></Column>
      <Column field="replicate" header="Replicate" style="width: 8rem"></Column>
      <Column field="number_of_replicates" header="Number of Replicates" style="width: 8rem"></Column>
      <Column field="experiment" header="Experiment" style="width: 8rem"></Column>
      <Column field="institution" header="Institution" style="width: 8rem"></Column>
      <Column field="year" header="Year" style="width: 4rem"></Column>
      <template #paginatorstart>
              <Button type="button" icon="pi pi-refresh" class="p-button-text" />
          </template>

    </DataTable>
  </div>
</template>

<script>
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
export default {
  name: "Table",
  components: {
    DataTable,
    Column,
  },
  props: {
    dataset: Array,
  }


}
</script>

<style>

</style>