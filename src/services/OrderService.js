const ProductRepository = require("../repositories/ProductRepository");
const OrderRepository = require("../repositories/OrderRepository");
const NotificationService = require("./NotificationService");
const Logger = require("../utils/Logger");
const DiscountService = require("./DiscountService");
const ShippingService = require("./ShippingService");
const PaymentService = require("./PaymentService");

class OrderService {
  constructor({
    productRepository = new ProductRepository(),
    orderRepository = new OrderRepository(),
    notificationService = new NotificationService(),
    logger = new Logger(),
    discountService = new DiscountService(),
    shippingService = new ShippingService(),
    paymentService = new PaymentService(),
    output = console
  } = {}) {
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
    this.notificationService = notificationService;
    this.logger = logger;
    this.discountService = discountService;
    this.shippingService = shippingService;
    this.paymentService = paymentService;
    this.output = output;
  }

  validate(order) {
    if (!order.customer) throw new Error("Cliente obrigatorio.");
    if (!order.customer.isValidEmail()) throw new Error("E-mail do cliente invalido.");
    if (!order.items || order.items.length === 0) throw new Error("Pedido sem itens.");

    for (const item of order.items) {
      if (!item.product) throw new Error("Item sem produto.");
      if (item.quantity <= 0) throw new Error("Quantidade invalida.");
      const product = this.productRepository.findById(item.product.id);
      if (!product) throw new Error(`Produto ${item.product.id} nao encontrado.`);
      if (product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
  }

  process(order) {
    this.logger.info(`Iniciando processamento do pedido ${order.id}.`);
    this.validate(order);

    const subtotal = order.getSubtotal();
    const discount = this.discountService.calculate(order, subtotal);
    const freight = this.shippingService.calculate(order);
    const payment = this.paymentService.process(order.paymentMethod, order.installments);
    const paymentFee = this.paymentService.calculateFee(order.paymentMethod, order.installments, subtotal);
    const total = Number((subtotal - discount + freight + paymentFee).toFixed(2));

    if (total <= 0) throw new Error("Total do pedido invalido.");

    for (const item of order.items) {
      this.productRepository.updateStock(item.product.id, item.quantity);
    }

    order.status = payment.status === "approved" ? "confirmed" : "waiting_payment";
    const orderSummary = {
      id: order.id,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      city: order.customer.address.city,
      state: order.customer.address.state,
      items: order.items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        subtotal: item.getSubtotal()
      })),
      subtotal,
      discount: Number(discount.toFixed(2)),
      freight: Number(freight.toFixed(2)),
      paymentFee: Number(paymentFee.toFixed(2)),
      total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt
    };

    this.orderRepository.save(orderSummary);
    if (order.status === "confirmed") {
      this.notificationService.sendOrderConfirmation(order.customer, order.id, total);
    } else {
      this.logger.warn(`Pedido ${order.id} aguardando pagamento.`);
    }

    this.printSummary(order, orderSummary);
    return orderSummary;
  }

  printSummary(order, summary) {
    this.output.log("Resumo do pedido");
    this.output.log(`Cliente: ${order.customer.name}`);
    this.output.log(`Cidade: ${order.customer.getCityAndState()}`);
    this.output.log(`Itens: ${order.getTotalItems()}`);
    this.output.log(`Subtotal: R$ ${summary.subtotal.toFixed(2)}`);
    this.output.log(`Desconto: R$ ${summary.discount.toFixed(2)}`);
    this.output.log(`Frete: R$ ${summary.freight.toFixed(2)}`);
    this.output.log(`Taxas: R$ ${summary.paymentFee.toFixed(2)}`);
    this.output.log(`Total: R$ ${summary.total.toFixed(2)}`);
  }
}
module.exports = OrderService;