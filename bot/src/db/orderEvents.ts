import { pool } from "./connection";
import { OrderEvent } from "../types";

export async function addOrderEvent(input: {
  orderId: number;
  status: string;
  note?: string | null;
  actorType: string;
  actorName?: string | null;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO order_events (order_id, status, note, actor_type, actor_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.orderId,
        input.status,
        input.note ?? null,
        input.actorType,
        input.actorName ?? null
      ]
    );
  } catch (error) {
    console.error("Erro ao registrar evento do pedido:", error);
    throw error;
  }
}

export async function listOrderEvents(orderId: number): Promise<OrderEvent[]> {
  try {
    const result = await pool.query<OrderEvent>(
      `SELECT id, order_id, status, note, actor_type, actor_name, created_at
       FROM order_events
       WHERE order_id = $1
       ORDER BY created_at DESC`,
      [orderId]
    );

    return result.rows;
  } catch (error) {
    console.error("Erro ao listar eventos do pedido:", error);
    throw error;
  }
}
