<template>
    <div class="surface-card p-4 shadow-2 border-round w-3/4 mx-auto mt-6 lg:w-6 ">
		<Toast />
    <div class="text-center my-5">
        <div class="text-900 text-3xl font-medium mb-3">Data</div>
    </div>



    <h5>File Upload</h5>
    <FileUpload mode="basic" name="demo[]" url="./upload.php" accept="image/*" :maxFileSize="1000000" @upload="onUpload" />

    </div>

</template>

<script>
import Toast from 'primevue/toast';
import FileUpload from 'primevue/fileupload'
export default {
  components: {
    Toast,
    FileUpload, 

  },
  methods: {
    onUpload() {
      this.$toast.add({severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000});
    }
  }

}
</script>

<style>

</style>