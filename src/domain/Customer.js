class Customer {
  constructor(id, name, email, phone, type, address) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.type = type;
    this.address = address;
  }

  isValidEmail() {
    return Boolean(this.email && this.email.includes("@"));
  }

  getCityAndState() {
    return this.address.getCityAndState();
  }

  getShippingRegion() {
    return this.address.getShippingRegion();
  }
}
module.exports = Customer;