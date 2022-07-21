export default class CountryService {

  async getCountries() {
    console.log("getCountries")

    return fetch('data/countries.json').then(res => res.json())
        .then(d => d.data);
  }
}