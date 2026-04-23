import { pool } from "./connection";
import { Product } from "../types";

export async function seedProductsForReseller(resellerId: number): Promise<void> {
  try {
    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM products WHERE reseller_id = $1",
      [resellerId]
    );

    if (Number(countResult.rows[0]?.count ?? 0) > 0) {
      return;
    }

    const defaultProducts = [
      {
        code: "P13",
        name: "Botijao P13 (13kg)",
        description: "O botijao residencial mais popular do Brasil",
        aliases: JSON.stringify(["1", "p13", "13", "13kg", "treze"]),
        price: 12000,
        stock: 80,
        featured: true
      },
      {
        code: "P45",
        name: "Botijao P45 (45kg)",
        description: "Ideal para restaurantes, padarias e comercios",
        aliases: JSON.stringify(["2", "p45", "45", "45kg"]),
        price: 38000,
        stock: 18,
        featured: false
      },
      {
        code: "P2",
        name: "Botijao P2 (2kg)",
        description: "Pratico e portatil para camping e churrasqueiras",
        aliases: JSON.stringify(["3", "p2", "2kg", "dois"]),
        price: 4500,
        stock: 25,
        featured: false
      }
    ];

    for (const product of defaultProducts) {
      await pool.query(
        `INSERT INTO products
          (reseller_id, code, name, description, aliases, price_cents, stock_units, featured)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
        [
          resellerId,
          product.code,
          product.name,
          product.description,
          product.aliases,
          product.price,
          product.stock,
          product.featured
        ]
      );
    }
  } catch (error) {
    console.error("Erro ao popular produtos padrao:", error);
    throw error;
  }
}

export async function listProducts(resellerId: number): Promise<Product[]> {
  try {
    const result = await pool.query<Product>(
      `SELECT id, reseller_id, code, name, description, aliases, price_cents, stock_units,
              active, featured, created_at, updated_at
       FROM products
       WHERE reseller_id = $1
       ORDER BY featured DESC, price_cents ASC`,
      [resellerId]
    );

    return result.rows;
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    throw error;
  }
}

export async function getActiveProducts(resellerId: number): Promise<Product[]> {
  try {
    const result = await pool.query<Product>(
      `SELECT id, reseller_id, code, name, description, aliases, price_cents, stock_units,
              active, featured, created_at, updated_at
       FROM products
       WHERE reseller_id = $1 AND active = TRUE
       ORDER BY featured DESC, price_cents ASC`,
      [resellerId]
    );

    return result.rows;
  } catch (error) {
    console.error("Erro ao listar produtos ativos:", error);
    throw error;
  }
}

export async function getProductByCode(
  resellerId: number,
  code: string
): Promise<Product | null> {
  try {
    const result = await pool.query<Product>(
      `SELECT id, reseller_id, code, name, description, aliases, price_cents, stock_units,
              active, featured, created_at, updated_at
       FROM products
       WHERE reseller_id = $1 AND code = $2
       LIMIT 1`,
      [resellerId, code]
    );

    return result.rows[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar produto por codigo:", error);
    throw error;
  }
}

export async function updateProduct(
  id: number,
  input: {
    priceCents: number;
    stockUnits: number;
    active: boolean;
    description?: string;
  }
): Promise<void> {
  try {
    await pool.query(
      `UPDATE products
       SET price_cents = $1,
           stock_units = $2,
           active = $3,
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $5`,
      [input.priceCents, input.stockUnits, input.active, input.description ?? null, id]
    );
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    throw error;
  }
}
