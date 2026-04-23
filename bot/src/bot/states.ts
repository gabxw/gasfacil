import { findAreaForAddress, listAreas } from "../db/areas";
import { createOrder, getLatestOpenOrderByPhone, updateOrderStatus } from "../db/orders";
import { getActiveProducts } from "../db/products";
import { DeliveryArea, Order, Product } from "../types";
import { parsePagamento, matchProductInput } from "../utils/parser";
import {
  buildWelcomeMessage,
  canceledMessage,
  MESSAGES,
  pedidoConfirmado,
  produtoSelecionado,
  solicitarPagamento,
  statusMessage
} from "./messages";

export const STATES = {
  INICIO: "INICIO",
  AGUARDANDO_PRODUTO: "AGUARDANDO_PRODUTO",
  AGUARDANDO_ENDERECO: "AGUARDANDO_ENDERECO",
  AGUARDANDO_PAGAMENTO: "AGUARDANDO_PAGAMENTO",
  CONCLUIDO: "CONCLUIDO"
} as const;

export interface SessionData {
  productId?: number;
  productCode?: string;
  produto?: string;
  subtotalCents?: number;
  endereco?: string;
  areaId?: number;
  areaName?: string;
  areaFeeCents?: number;
  etaMinutes?: number;
  orderId?: number;
}

export interface StateResult {
  reply: string;
  nextState: string;
  data: SessionData;
}

function canCancelOrder(status: string): boolean {
  return status === "novo" || status === "confirmado" || status === "preparando";
}

export async function runStateMachine(input: {
  resellerId: number;
  phone: string;
  currentState: string;
  text: string;
  sessionData: Record<string, unknown>;
}): Promise<StateResult> {
  const data: SessionData = {
    productId:
      typeof input.sessionData.productId === "number"
        ? input.sessionData.productId
        : undefined,
    productCode:
      typeof input.sessionData.productCode === "string"
        ? input.sessionData.productCode
        : undefined,
    produto:
      typeof input.sessionData.produto === "string"
        ? input.sessionData.produto
        : undefined,
    subtotalCents:
      typeof input.sessionData.subtotalCents === "number"
        ? input.sessionData.subtotalCents
        : undefined,
    endereco:
      typeof input.sessionData.endereco === "string"
        ? input.sessionData.endereco
        : undefined,
    areaId:
      typeof input.sessionData.areaId === "number"
        ? input.sessionData.areaId
        : undefined,
    areaName:
      typeof input.sessionData.areaName === "string"
        ? input.sessionData.areaName
        : undefined,
    areaFeeCents:
      typeof input.sessionData.areaFeeCents === "number"
        ? input.sessionData.areaFeeCents
        : undefined,
    etaMinutes:
      typeof input.sessionData.etaMinutes === "number"
        ? input.sessionData.etaMinutes
        : undefined,
    orderId:
      typeof input.sessionData.orderId === "number"
        ? input.sessionData.orderId
        : undefined
  };

  const rawText = input.text.trim();
  const lowerText = rawText.toLowerCase();

  try {
    if (lowerText === "atendente" || lowerText === "humano") {
      return {
        reply: MESSAGES.manualSupport,
        nextState: input.currentState,
        data
      };
    }

    if (input.currentState === STATES.CONCLUIDO && lowerText === "novo") {
      const products = await getActiveProducts(input.resellerId);

      return {
        reply: buildWelcomeMessage(products),
        nextState: STATES.AGUARDANDO_PRODUTO,
        data: {}
      };
    }

    if (input.currentState === STATES.CONCLUIDO && lowerText === "status") {
      const order = await getLatestOpenOrderByPhone(input.resellerId, input.phone);

      if (!order) {
        return {
          reply: MESSAGES.noOpenOrder,
          nextState: STATES.CONCLUIDO,
          data
        };
      }

      return {
        reply: statusMessage(order),
        nextState: STATES.CONCLUIDO,
        data: {
          ...data,
          orderId: order.id
        }
      };
    }

    if (input.currentState === STATES.CONCLUIDO && lowerText === "cancelar") {
      const order = await getLatestOpenOrderByPhone(input.resellerId, input.phone);

      if (!order) {
        return {
          reply: MESSAGES.noOpenOrder,
          nextState: STATES.CONCLUIDO,
          data
        };
      }

      if (!canCancelOrder(order.status)) {
        return {
          reply: `O pedido #${order.id} ja esta em fase final e nao pode mais ser cancelado automaticamente.`,
          nextState: STATES.CONCLUIDO,
          data
        };
      }

      await updateOrderStatus({
        orderId: order.id,
        status: "cancelado",
        note: "Cancelado pelo cliente via WhatsApp.",
        actorType: "customer",
        actorName: input.phone
      });

      return {
        reply: canceledMessage(order.id),
        nextState: STATES.CONCLUIDO,
        data: {
          ...data,
          orderId: order.id
        }
      };
    }

    switch (input.currentState) {
      case STATES.INICIO: {
        const products = await getActiveProducts(input.resellerId);

        return {
          reply: buildWelcomeMessage(products),
          nextState: STATES.AGUARDANDO_PRODUTO,
          data
        };
      }

      case STATES.AGUARDANDO_PRODUTO: {
        const products = await getActiveProducts(input.resellerId);
        const product = matchProductInput(rawText, products);

        if (!product) {
          return {
            reply: MESSAGES.invalidProduto,
            nextState: STATES.AGUARDANDO_PRODUTO,
            data
          };
        }

        const areas = await listAreas(input.resellerId);
        const areaHint = areas.filter((area) => area.active).map((area) => area.neighborhood).join(", ");

        return {
          reply: produtoSelecionado(product, areaHint || "consulte nosso atendimento"),
          nextState: STATES.AGUARDANDO_ENDERECO,
          data: {
            productId: product.id,
            productCode: product.code,
            produto: product.name,
            subtotalCents: product.price_cents
          }
        };
      }

      case STATES.AGUARDANDO_ENDERECO: {
        if (rawText.length <= 10) {
          return {
            reply: MESSAGES.invalidEndereco,
            nextState: STATES.AGUARDANDO_ENDERECO,
            data
          };
        }

        const area = await findAreaForAddress(input.resellerId, rawText);

        if (!area) {
          return {
            reply: MESSAGES.unsupportedArea,
            nextState: STATES.AGUARDANDO_ENDERECO,
            data
          };
        }

        return {
          reply: solicitarPagamento(area),
          nextState: STATES.AGUARDANDO_PAGAMENTO,
          data: {
            ...data,
            endereco: rawText,
            areaId: area.id,
            areaName: area.neighborhood,
            areaFeeCents: area.fee_cents,
            etaMinutes: area.eta_minutes
          }
        };
      }

      case STATES.AGUARDANDO_PAGAMENTO: {
        const pagamento = parsePagamento(rawText);

        if (!pagamento) {
          return {
            reply: MESSAGES.invalidPagamento,
            nextState: STATES.AGUARDANDO_PAGAMENTO,
            data
          };
        }

        if (
          !data.productCode ||
          !data.produto ||
          !data.endereco ||
          !data.areaName ||
          typeof data.subtotalCents !== "number" ||
          typeof data.areaFeeCents !== "number"
        ) {
          const products = await getActiveProducts(input.resellerId);

          return {
            reply: buildWelcomeMessage(products),
            nextState: STATES.AGUARDANDO_PRODUTO,
            data: {}
          };
        }

        const orderId = await createOrder({
          resellerId: input.resellerId,
          phone: input.phone,
          productCode: data.productCode,
          produto: data.produto,
          endereco: data.endereco,
          areaName: data.areaName,
          areaFeeCents: data.areaFeeCents,
          pagamento,
          subtotalCents: data.subtotalCents,
          totalCents: data.subtotalCents + data.areaFeeCents
        });

        const order: Order = {
          id: orderId,
          reseller_id: input.resellerId,
          phone: input.phone,
          product_code: data.productCode,
          produto: data.produto,
          endereco: data.endereco,
          area_name: data.areaName,
          area_fee_cents: data.areaFeeCents,
          pagamento,
          subtotal_cents: data.subtotalCents,
          total_cents: data.subtotalCents + data.areaFeeCents,
          status: "novo",
          notes: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        return {
          reply: pedidoConfirmado(order),
          nextState: STATES.CONCLUIDO,
          data: {
            orderId
          }
        };
      }

      case STATES.CONCLUIDO:
        return {
          reply: MESSAGES.concluded,
          nextState: STATES.CONCLUIDO,
          data
        };

      default: {
        const products = await getActiveProducts(input.resellerId);

        return {
          reply: buildWelcomeMessage(products),
          nextState: STATES.AGUARDANDO_PRODUTO,
          data: {}
        };
      }
    }
  } catch (error) {
    console.error("Erro na maquina de estados:", error);
    throw error;
  }
}
