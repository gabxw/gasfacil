import { pool } from "./connection";

export async function createMessageLog(input: {
  phone: string;
  direction: "inbound" | "outbound";
  message: string;
  status: string;
  attempt?: number;
  error?: string | null;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO message_logs (phone, direction, message, status, attempt, error)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.phone,
        input.direction,
        input.message,
        input.status,
        input.attempt ?? 1,
        input.error ?? null
      ]
    );
  } catch (error) {
    console.error("Erro ao gravar log de mensagem:", error);
  }
}
