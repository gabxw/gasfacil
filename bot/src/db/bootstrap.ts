import { seedAreasForReseller } from "./areas";
import { seedProductsForReseller } from "./products";
import { getDefaultReseller } from "./resellers";
import { ensureDefaultAdmin } from "./users";

export async function bootstrapData(): Promise<void> {
  try {
    const reseller = await getDefaultReseller();

    await seedProductsForReseller(reseller.id);
    await seedAreasForReseller(reseller.id);
    await ensureDefaultAdmin(reseller.id);
  } catch (error) {
    console.error("Erro ao preparar dados iniciais:", error);
    throw error;
  }
}
