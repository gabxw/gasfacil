import { pool } from "./connection";
import { DeliveryArea } from "../types";
import { normalizeText } from "../utils/parser";

export async function seedAreasForReseller(resellerId: number): Promise<void> {
  try {
    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM delivery_areas WHERE reseller_id = $1",
      [resellerId]
    );

    if (Number(countResult.rows[0]?.count ?? 0) > 0) {
      return;
    }

    const areas = [
      { neighborhood: "Centro", feeCents: 0, etaMinutes: 35 },
      { neighborhood: "Savassi", feeCents: 500, etaMinutes: 40 },
      { neighborhood: "Lourdes", feeCents: 500, etaMinutes: 40 },
      { neighborhood: "Funcionarios", feeCents: 700, etaMinutes: 45 }
    ];

    for (const area of areas) {
      await pool.query(
        `INSERT INTO delivery_areas (reseller_id, neighborhood, fee_cents, eta_minutes)
         VALUES ($1, $2, $3, $4)`,
        [resellerId, area.neighborhood, area.feeCents, area.etaMinutes]
      );
    }
  } catch (error) {
    console.error("Erro ao popular areas padrao:", error);
    throw error;
  }
}

export async function listAreas(resellerId: number): Promise<DeliveryArea[]> {
  try {
    const result = await pool.query<DeliveryArea>(
      `SELECT id, reseller_id, neighborhood, fee_cents, eta_minutes, active, created_at, updated_at
       FROM delivery_areas
       WHERE reseller_id = $1
       ORDER BY neighborhood ASC`,
      [resellerId]
    );

    return result.rows;
  } catch (error) {
    console.error("Erro ao listar areas:", error);
    throw error;
  }
}

export async function findAreaForAddress(
  resellerId: number,
  address: string
): Promise<DeliveryArea | null> {
  try {
    const areas = await listAreas(resellerId);
    const normalizedAddress = normalizeText(address);

    const match = areas
      .filter((area) => area.active)
      .sort((a, b) => b.neighborhood.length - a.neighborhood.length)
      .find((area) => normalizedAddress.includes(normalizeText(area.neighborhood)));

    return match ?? null;
  } catch (error) {
    console.error("Erro ao identificar area de entrega:", error);
    throw error;
  }
}

export async function createArea(
  resellerId: number,
  neighborhood: string,
  feeCents: number,
  etaMinutes: number
): Promise<DeliveryArea> {
  try {
    const result = await pool.query<DeliveryArea>(
      `INSERT INTO delivery_areas (reseller_id, neighborhood, fee_cents, eta_minutes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reseller_id, neighborhood, fee_cents, eta_minutes, active, created_at, updated_at`,
      [resellerId, neighborhood, feeCents, etaMinutes]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Erro ao criar area:", error);
    throw error;
  }
}

export async function updateArea(
  id: number,
  input: { feeCents: number; etaMinutes: number; active: boolean }
): Promise<void> {
  try {
    await pool.query(
      `UPDATE delivery_areas
       SET fee_cents = $1,
           eta_minutes = $2,
           active = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [input.feeCents, input.etaMinutes, input.active, id]
    );
  } catch (error) {
    console.error("Erro ao atualizar area:", error);
    throw error;
  }
}
