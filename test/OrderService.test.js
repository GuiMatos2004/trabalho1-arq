const test = require("node:test");
const assert = require("node:assert/strict");
const Address = require("../src/domain/Address");
const Customer = require("../src/domain/Customer");
const Order = require("../src/domain/Order");
const OrderItem = require("../src/domain/OrderItem");
const Product = require("../src/domain/Product");
const ProductRepository = require("../src/repositories/ProductRepository");
const OrderRepository = require("../src/repositories/OrderRepository");
const OrderService = require("../src/services/OrderService");

function setup(method = "pix", coupon = null, type = "regular") {
  const products = [new Product("p1", "Produto", "geral", 100, 1, 10)];
  const productRepository = new ProductRepository(products);
  const orderRepository = new OrderRepository();
  const customer = new Customer("c1", "Teste", "teste@example.com", "11999999999", type,
    new Address("Rua A", "1", "São Paulo", "SP", "00000-000", "sudeste"));
  const order = new Order("o1", customer, [new OrderItem(products[0], 2)], coupon, method, 2);
  const notificationService = { sendOrderConfirmation() { this.called = true; } };
  const logger = { info() {}, warn() {}, error() {} };
  const output = { log() {} };
  const service = new OrderService({ productRepository, orderRepository, notificationService, logger, output });
  return { service, order, productRepository, orderRepository, notificationService };
}

test("processa pedido PIX, aplica desconto e atualiza estoque", () => {
  const ctx = setup("pix", null, "regular");
  const result = ctx.service.process(ctx.order);
  assert.equal(result.status, "confirmed");
  assert.equal(result.subtotal, 200);
  assert.equal(result.discount, 6);
  assert.equal(result.freight, 28);
  assert.equal(result.total, 222);
  assert.equal(ctx.productRepository.findById("p1").stock, 8);
  assert.equal(ctx.orderRepository.findAll().length, 1);
  assert.equal(ctx.notificationService.called, true);
});

test("aplica cupom de frete grátis", () => {
  const ctx = setup("boleto", "FRETEGRATIS");
  const result = ctx.service.process(ctx.order);
  assert.equal(result.freight, 0);
  assert.equal(result.status, "waiting_payment");
  assert.equal(ctx.notificationService.called, undefined);
});

test("rejeita pedido sem itens", () => {
  const ctx = setup();
  ctx.order.items = [];
  assert.throws(() => ctx.service.process(ctx.order), /Pedido sem itens/);
});

test("rejeita e-mail inválido", () => {
  const ctx = setup();
  ctx.order.customer.email = "invalido";
  assert.throws(() => ctx.service.process(ctx.order), /E-mail do cliente invalido/);
});

test("rejeita estoque insuficiente sem alterar estoque", () => {
  const ctx = setup();
  ctx.order.items[0].quantity = 99;
  assert.throws(() => ctx.service.process(ctx.order), /Estoque insuficiente/);
  assert.equal(ctx.productRepository.findById("p1").stock, 10);
});

test("rejeita forma de pagamento inválida", () => {
  const ctx = setup("cripto");
  assert.throws(() => ctx.service.process(ctx.order), /Forma de pagamento invalida/);
});
