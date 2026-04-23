import { AdminUser, UserRole } from "../types";
import { hashPassword } from "../utils/security";
import { pool } from "./connection";

export async function ensureDefaultAdmin(resellerId: number): Promise<void> {
  const email = (process.env.DEFAULT_ADMIN_EMAIL ?? "admin@gasfacil.local").toLowerCase();
  const name = process.env.DEFAULT_ADMIN_NAME ?? "Administrador";
  const password = process.env.DEFAULT_ADMIN_PASSWORD ?? "admin123";

  try {
    const existing = await pool.query<{ id: number }>(
      "SELECT id FROM admin_users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (existing.rows[0]) {
      return;
    }

    const passwordHash = await hashPassword(password);

    await pool.query(
      `INSERT INTO admin_users (reseller_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'owner')`,
      [resellerId, name, email, passwordHash]
    );
  } catch (error) {
    console.error("Erro ao garantir usuario admin padrao:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  try {
    const result = await pool.query<AdminUser>(
      `SELECT id, reseller_id, name, email, password_hash, role, active, created_at
       FROM admin_users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar usuario por email:", error);
    throw error;
  }
}

export async function listUsers(resellerId?: number | null): Promise<AdminUser[]> {
  try {
    const params: Array<number> = [];
    const whereSql =
      typeof resellerId === "number"
        ? (() => {
            params.push(resellerId);
            return `WHERE reseller_id = $${params.length}`;
          })()
        : "";

    const result = await pool.query<AdminUser>(
      `SELECT id, reseller_id, name, email, password_hash, role, active, created_at
       FROM admin_users
       ${whereSql}
       ORDER BY created_at ASC`,
      params
    );

    return result.rows;
  } catch (error) {
    console.error("Erro ao listar usuarios:", error);
    throw error;
  }
}

export async function createUser(input: {
  resellerId: number | null;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<void> {
  try {
    const passwordHash = await hashPassword(input.password);

    await pool.query(
      `INSERT INTO admin_users (reseller_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.resellerId,
        input.name,
        input.email.toLowerCase(),
        passwordHash,
        input.role
      ]
    );
  } catch (error) {
    console.error("Erro ao criar usuario:", error);
    throw error;
  }
}
