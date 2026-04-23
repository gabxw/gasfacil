import { DeliveryArea, Order, Product } from "../types";
import { formatCurrency } from "../utils/format";

export function buildWelcomeMessage(products: Product[]): string {
  const lines = products.map((product, index) => {
    const stockLabel = product.stock_units > 0 ? `${product.stock_units} em estoque` : "sem estoque";
    return `${index + 1} - ${product.code} - ${formatCurrency(product.price_cents)} - ${stockLabel}`;
  });

  return `Ola! Bem-vindo a GasFacil!
Qual botijao voce precisa?
${lines.join("\n")}
Digite o numero, codigo ou nome do produto.`;
}

export const MESSAGES = {
  invalidProduto:
    "Nao entendi. Digite 1 para P13, 2 para P45 ou 3 para P2.",
  invalidEndereco:
    "Por favor, me passa o endereco completo com rua, numero e bairro.",
  unsupportedArea:
    "Ainda nao localizei seu bairro na area automatica. Envie novamente incluindo o bairro ou digite atendente para validacao manual.",
  invalidPagamento:
    "Digite 1 para PIX, 2 para Dinheiro ou 3 para Cartao.",
  concluded: `Seu pedido ja esta em andamento.
Digite status para acompanhar, cancelar para cancelar o pedido ou novo para abrir outro atendimento.`,
  manualSupport:
    "Pronto. Um atendente humano foi sinalizado para continuar por aqui assim que possivel.",
  noOpenOrder:
    "Nao encontrei pedido em aberto para este numero. Digite novo para iniciar outro pedido."
};

export function produtoSelecionado(product: Product, areaHint: string): string {
  return `Otimo! ${product.name} selecionado.
Agora me passa seu endereco completo com rua, numero e bairro.
Atendemos automaticamente: ${areaHint}.`;
}

export function solicitarPagamento(area: DeliveryArea): string {
  return `Endereco anotado para ${area.neighborhood}.
Taxa de entrega: ${formatCurrency(area.fee_cents)}.
Como voce vai pagar?
1 - PIX
2 - Dinheiro
3 - Cartao na entrega`;
}

export function pedidoConfirmado(order: Order): string {
  return `Pedido #${order.id} confirmado!
Produto: ${order.produto}
Endereco: ${order.endereco}
Pagamento: ${order.pagamento}
Taxa de entrega: ${formatCurrency(order.area_fee_cents)}
Total: ${formatCurrency(order.total_cents)}
Previsao: ate 45 minutos.
Digite status para acompanhar por aqui.`;
}

export function statusMessage(order: Order): string {
  return `Pedido #${order.id}
Status: ${order.status}
Produto: ${order.produto}
Endereco: ${order.endereco}
Total: ${formatCurrency(order.total_cents)}`;
}

export function canceledMessage(orderId: number): string {
  return `Pedido #${orderId} cancelado.
Se quiser fazer um novo pedido, digite novo.`;
}
