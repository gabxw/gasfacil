import { Session } from "../types";
import { pool } from "./connection";

export async function getSession(
  phone: string,
  resellerId: number
): Promise<Session> {
  try {
    const existing = await pool.query<Session>(
      `SELECT phone, reseller_id, state, data, updated_at
       FROM sessions
       WHERE phone = $1`,
      [phone]
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const created = await pool.query<Session>(
      `INSERT INTO sessions (phone, reseller_id, state, data)
       VALUES ($1, $2, 'INICIO', $3::jsonb)
       RETURNING phone, reseller_id, state, data, updated_at`,
      [phone, resellerId, JSON.stringify({})]
    );

    return created.rows[0];
  } catch (error) {
    console.error("Erro ao obter sessao:", error);
    throw error;
  }
}

export async function saveSession(
  phone: string,
  resellerId: number,
  state: string,
  data: object
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO sessions (phone, reseller_id, state, data, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT (phone)
       DO UPDATE SET reseller_id = EXCLUDED.reseller_id,
                     state = EXCLUDED.state,
                     data = EXCLUDED.data,
                     updated_at = NOW()`,
      [phone, resellerId, state, JSON.stringify(data)]
    );
  } catch (error) {
    console.error("Erro ao salvar sessao:", error);
    throw error;
  }
}

export async function resetSession(phone: string, resellerId: number): Promise<void> {
  try {
    await saveSession(phone, resellerId, "INICIO", {});
  } catch (error) {
    console.error("Erro ao resetar sessao:", error);
    throw error;
  }
}
