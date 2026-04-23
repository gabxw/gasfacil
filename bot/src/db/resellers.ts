import { pool } from "./connection";
import { Reseller } from "../types";

export async function getDefaultReseller(): Promise<Reseller> {
  const slug = process.env.DEFAULT_RESELLER_SLUG ?? "matriz";
  const fallbackName = process.env.DEFAULT_RESELLER_NAME ?? "GasFacil Matriz";
  const fallbackPhone = process.env.DEFAULT_RESELLER_PHONE ?? "5531999999999";

  try {
    const result = await pool.query<Reseller>(
      `SELECT id, name, slug, whatsapp_phone, active, created_at
       FROM resellers
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }

    const created = await pool.query<Reseller>(
      `INSERT INTO resellers (name, slug, whatsapp_phone)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, whatsapp_phone, active, created_at`,
      [fallbackName, slug, fallbackPhone]
    );

    return created.rows[0];
  } catch (error) {
    console.error("Erro ao obter revendedor padrao:", error);
    throw error;
  }
}

export async function listResellers(): Promise<Reseller[]> {
  try {
    const result = await pool.query<Reseller>(
      `SELECT id, name, slug, whatsapp_phone, active, created_at
       FROM resellers
       ORDER BY created_at ASC`
    );

    return result.rows;
  } catch (error) {
    console.error("Erro ao listar revendedores:", error);
    throw error;
  }
}

export async function createReseller(
  name: string,
  slug: string,
  whatsappPhone: string
): Promise<Reseller> {
  try {
    const result = await pool.query<Reseller>(
      `INSERT INTO resellers (name, slug, whatsapp_phone)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, whatsapp_phone, active, created_at`,
      [name, slug, whatsappPhone]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Erro ao criar revendedor:", error);
    throw error;
  }
}
