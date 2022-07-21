import http from "../http-common";
// import axios from "axios";
// const searchFromApi = async (query) => {
//   return axios.get("/api/search", {
//     params: query,
//   })
// }


class DataService {
  async getAllSampleMetadata() {
    return http.get("/sample_metadata/");
  }
  async getExpressionData(hi=1000, lo=500, limit=100) {
    //http://127.0.0.1:8000/expression_data_by_gene_expression/?hi=30000&lo=20000&limit=5
    return http.get(`/expression_data/range?hi=${hi}&lo=${lo}&limit=${limit}`)
  }
  async getExpressionDataByGenes(genes) {
    //http://127.0.0.1:8000/expression_data/gene_name/0610009B22Rik,Agrn
    return http.get(`/gene_expression/gene_name?gene_name=${genes}`)
  }
  async getGenes(limit=20000) {
    return http.get(`/gene_metadata/data?limit=${limit}`)
  }
  // getAllSampleMetadata = async () => {
  //   return axios.get("/samples_metadata");
  // }
  /*
  get(id) {
    return http.get(`/tutorials/${id}`);
  }
  create(data) {
    return http.post("/tutorials", data);
  }
  update(id, data) {
    return http.put(`/tutorials/${id}`, data);
  }
  delete(id) {
    return http.delete(`/tutorials/${id}`);
  }
  deleteAll() {
    return http.delete(`/tutorials`);
  }
  findByTitle(title) {
    return http.get(`/tutorials?title=${title}`);
  }
  */
}
export default new DataService();