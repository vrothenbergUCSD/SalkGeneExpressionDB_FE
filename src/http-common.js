import axios from "axios";
export default axios.create({
  //http://127.0.0.1:8000/samples_metadata_by_time_point/ZT0?skip=0&limit=100
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-type": "application/json",
    'Access-Control-Allow-Origin': '*',
  }
});

