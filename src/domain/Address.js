class Address {
  constructor(street, number, city, state, zipCode, region) {
    this.street = street;
    this.number = number;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.region = region;
  }

  getShippingRegion() {
    return this.region;
  }

  getCityAndState() {
    return `${this.city}/${this.state}`;
  }

  toJSON() {
    return {
      street: this.street, number: this.number, city: this.city,
      state: this.state, zipCode: this.zipCode, region: this.region
    };
  }
}
module.exports = Address;