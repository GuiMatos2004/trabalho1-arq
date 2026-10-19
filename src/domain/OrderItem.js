class OrderItem {
  constructor(product, quantity) {
    this.product = product;
    this.quantity = quantity;
  }

  getSubtotal() {
    return this.product.price * this.quantity;
  }

  getTotalWeight() {
    return this.product.weight * this.quantity;
  }
}
module.exports = OrderItem;