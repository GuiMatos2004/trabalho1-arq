class PaymentService {
  process(method, installments) {
    if (method === "pix") return { status: "approved", fee: 0 };
    if (method === "credit_card") {
      return { status: "approved", fee: installments > 1 ? null : 0 };
    }
    if (method === "boleto") return { status: "waiting_payment", fee: 0 };
    throw new Error("Forma de pagamento invalida.");
  }

  calculateFee(method, installments, subtotal) {
    if (method === "credit_card" && installments > 1) return subtotal * 0.025;
    return 0;
  }
}
module.exports = PaymentService;