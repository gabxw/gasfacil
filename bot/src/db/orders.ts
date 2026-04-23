import { pool } from "./connection";
import { DashboardStats, Order, OrderStatus } from "../types";
import { addOrderEvent } from "./orderEvents";

export async function createOrder(input: {
  resellerId: number;
  phone: string;
  productCode: string;
  produto: string;
  endereco: string;
  areaName: string;
  areaFeeCents: number;
  pagamento: string;
  subtotalCents: number;
  totalCents: number;
}): Promise<number> {
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO orders
        (reseller_id, phone, product_code, produto, endereco, area_name, area_fee_cents,
         pagamento, subtotal_cents, total_cents, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'novo')
       RETURNING id`,
      [
        input.resellerId,
        input.phone,
        input.productCode,
        input.produto,
        input.endereco,
        input.areaName,
        input.areaFeeCents,
        input.pagamento,
        input.subtotalCents,
        input.totalCents
      ]
    );

    const orderId = result.rows[0].id;

    await addOrderEvent({
      orderId,
      status: "novo",
      note: "Pedido criado automaticamente pelo bot.",
      actorType: "bot",
      actorName: "GasFacil Bot"
    });

    return orderId;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
}

export async function getOrders(input?: {
  resellerId?: number | null;
  status?: string | null;
}): Promise<Order[]> {
  try {
    const values: Array<number | string> = [];
    const whereClauses: string[] = [];

    if (typeof input?.resellerId === "number") {
      values.push(input.resellerId);
      whereClauses.push(`o.reseller_id = $${values.length}`);
    }

    if (input?.status) {
      values.push(input.status);
      whereClauses.push(`o.status = $${values.length}`);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result = await pool.query<Order>(
      `SELECT o.id, o.reseller_id, o.phone, o.product_code, o.produto, o.endereco, o.area_name,
              o.area_fee_cents, o.pagamento, o.subtotal_cents, o.total_cents, o.status, o.notes,
              o.created_at, o.updated_at, r.name AS reseller_name
       FROM orders o
       INNER JOIN resellers r ON r.id = o.reseller_id
       ${whereSql}
       ORDER BY o.created_at DESC`,
      values
    );

    return result.rows;
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    throw error;
  }
}

export async function getOrderById(id: number): Promise<Order | null> {
  try {
    const result = await pool.query<Order>(
      `SELECT id, reseller_id, phone, product_code, produto, endereco, area_name, area_fee_cents,
              pagamento, subtotal_cents, total_cents, status, notes, created_at, updated_at
       FROM orders
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    throw error;
  }
}

export async function getLatestOpenOrderByPhone(
  resellerId: number,
  phone: string
): Promise<Order | null> {
  try {
    const result = await pool.query<Order>(
      `SELECT id, reseller_id, phone, product_code, produto, endereco, area_name, area_fee_cents,
              pagamento, subtotal_cents, total_cents, status, notes, created_at, updated_at
       FROM orders
       WHERE reseller_id = $1
         AND phone = $2
         AND status NOT IN ('entregue', 'cancelado')
       ORDER BY created_at DESC
       LIMIT 1`,
      [resellerId, phone]
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar ultimo pedido em aberto:", error);
    throw error;
  }
}

export async function updateOrderStatus(input: {
  orderId: number;
  status: OrderStatus;
  note?: string | null;
  actorType: string;
  actorName?: string | null;
}): Promise<Order | null> {
  try {
    const result = await pool.query<Order>(
      `UPDATE orders
       SET status = $1,
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, reseller_id, phone, product_code, produto, endereco, area_name, area_fee_cents,
                 pagamento, subtotal_cents, total_cents, status, notes, created_at, updated_at`,
      [input.status, input.note ?? null, input.orderId]
    );

    const order = result.rows[0] ?? null;

    if (!order) {
      return null;
    }

    await addOrderEvent({
      orderId: input.orderId,
      status: input.status,
      note: input.note ?? null,
      actorType: input.actorType,
      actorName: input.actorName ?? null
    });

    return order;
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    throw error;
  }
}

export async function getDashboardStats(
  resellerId?: number | null
): Promise<DashboardStats> {
  try {
    const values: number[] = [];
    const whereSql =
      typeof resellerId === "number"
        ? (() => {
            values.push(resellerId);
            return `WHERE reseller_id = $${values.length}`;
          })()
        : "";

    const totalOrdersResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders ${whereSql}`,
      values
    );

    const pendingResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders
       ${whereSql ? `${whereSql} AND` : "WHERE"} status IN ('novo', 'confirmado', 'preparando')`,
      values
    );

    const inRouteResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders
       ${whereSql ? `${whereSql} AND` : "WHERE"} status = 'em_rota'`,
      values
    );

    const deliveredTodayResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders
       ${whereSql ? `${whereSql} AND` : "WHERE"} status = 'entregue'
         AND DATE(updated_at) = CURRENT_DATE`,
      values
    );

    const revenueTodayResult = await pool.query<{ total: string | null }>(
      `SELECT COALESCE(SUM(total_cents), 0)::text AS total
       FROM orders
       ${whereSql ? `${whereSql} AND` : "WHERE"} status = 'entregue'
         AND DATE(updated_at) = CURRENT_DATE`,
      values
    );

    return {
      totalOrders: Number(totalOrdersResult.rows[0]?.count ?? 0),
      pendingOrders: Number(pendingResult.rows[0]?.count ?? 0),
      inRouteOrders: Number(inRouteResult.rows[0]?.count ?? 0),
      deliveredToday: Number(deliveredTodayResult.rows[0]?.count ?? 0),
      revenueTodayCents: Number(revenueTodayResult.rows[0]?.total ?? 0)
    };
  } catch (error) {
    console.error("Erro ao montar metricas do dashboard:", error);
    throw error;
  }
}
