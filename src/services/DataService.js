import http from "../http-common";
// import axios from "axios";
// const searchFromApi = async (query) => {
//   return axios.get("/api/search", {
//     params: query,
//   })
// }


class DataService {

  // GET Requests 
  async getAllSampleMetadata() {
    return http.get("sample_metadata/data");
  }
  async getExpressionData(hi = 1000, lo = 500, limit = 100) {
    //http://127.0.0.1:8000/expression_data_by_gene_expression/?hi=30000&lo=20000&limit=5
    return http.get(`gene_expression/range?hi=${hi}&lo=${lo}&limit=${limit}`)
  }
  async getExpressionDataByGeneId(gene_id, table) {
    //http://127.0.0.1:8000/expression_data/gene_name/0610009B22Rik,Agrn
    return http.get(`gene_expression/gene_id?gene_id=${gene_id}&table=${table}`)
  }
  async getExpressionDataByGenes(genes, table) {
    //http://127.0.0.1:8000/expression_data/gene_name/0610009B22Rik,Agrn
    return http.get(`gene_expression/gene_names?gene_names=${genes}&table=${table}`)
  }
  async getExpressionDataByGenesFS(genes, table) {
    //http://127.0.0.1:8000/expression_data/gene_name/0610009B22Rik,Agrn
    return http.get(`gene_expression/gene_names_fs?gene_names=${genes}&table=${table}`)
  }
  async getExpressionDataByGenesGendersConditions(genes, genders, conditions, table) {
    let url = `gene_expression/gene_names_genders_conditions?gene_names=${genes}`
    if (genders.length)
      url += `&genders=${genders}`
    if (conditions.length)
      url += `&conditions=${conditions}`
    url += `&table=${table}`
    return http.get(url)
  }

  

  async getGenes(table = "Mouse_TRF_2018_Liver_gene_metadata") {
    return http.get(`gene_metadata/all_names?table=${table}`)
  }
  async getGenesFS(table = "Mouse_TRF_2018_Liver_gene_metadata") {
    return http.get(`gene_metadata/all_names_fs?table=${table}`)
  }
  async getGeneMetadata(genes, table) {
    ///gene_metadata/gene_name
    return http.get(`gene_metadata/gene_name?gene_name=${genes}&table=${table}`)
  }
  async getGeneMetadataFS(genes, table) {
    ///gene_metadata/gene_name
    return http.get(`gene_metadata/gene_name_fs?gene_name=${genes}&table=${table}`)
  }
  async getSampleMetadata(table) {
    return http.get(`sample_metadata/data?table=${table}`)
  }
  async getSampleMetadataFS(table) {
    return http.get(`sample_metadata/data_fs?table=${table}`)
  }
  async getSampleMetadataGendersConditions(genders, conditions, table) {
    let url = `sample_metadata/data?table=${table}`
    if (genders.length)
      url += `&genders=${genders}`
    if (conditions.length)
      url += `&conditions=${conditions}`
    return http.get(url)
  }
  // Defunct
  // async getDatabaseMetadata() {
  //   return http.get('database_metadata/data')
  // }
  
  // TODO: Pass formData for authentication
  async getDatasetsMetadata(formData) {
    return http.post('datasets_metadata/data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // TODO: Make sure gene list is updated based on new datasets (low priority?)
  async getGeneList() {
    return http.get('datasets_metadata/genes')
  }

  // POST Requests
  async postSampleMetadata(formData) {
    return http.post('upload/sample_metadata', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  async postSampleMetadata(formData) {
    return http.post('upload/sample_metadata', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  async postGeneExpressionData(formData) {
    return http.post('upload/gene_expression_data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  async postDatasetMetadata(formData) {
    return http.post('upload/dataset_metadata', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  async postDataset(formData) {
    return http.post('upload/dataset', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  async testAuth(formData) {
    return http.post('ping', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  }
  async getFile(url) {
    return http.get(url)
  }

}

export default new DataService();