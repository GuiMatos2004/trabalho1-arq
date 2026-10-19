class NotificationService {
  sendOrderConfirmation(customer, orderId, total) {
    console.log(
      `Pedido ${orderId} confirmado para ${customer.email}. Total: R$ ${total.toFixed(2)}`
    );
  }
}
module.exports = NotificationService;