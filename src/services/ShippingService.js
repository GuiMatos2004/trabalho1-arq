class ShippingService {
  calculate(order) {
    const totalWeight = order.getTotalWeight();
    if (order.couponCode === "FRETEGRATIS") return 0;

    const rates = {
      sudeste: [20, 4],
      sul: [28, 5],
      "centro-oeste": [35, 6],
      nordeste: [45, 7],
      norte: [60, 9]
    };
    const [base, perWeight] = rates[order.customer.getShippingRegion()] || [50, 8];
    return base + totalWeight * perWeight;
  }
}
module.exports = ShippingService;