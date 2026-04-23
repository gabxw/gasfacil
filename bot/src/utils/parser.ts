import { Product } from "../types";

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseProduto(text: string): string | null {
  const normalized = normalizeText(text);

  if (
    normalized === "1" ||
    normalized === "p13" ||
    normalized === "13" ||
    normalized === "13kg" ||
    normalized.includes("treze")
  ) {
    return "P13 (13kg)";
  }

  if (
    normalized === "2" ||
    normalized === "p45" ||
    normalized === "45" ||
    normalized === "45kg"
  ) {
    return "P45 (45kg)";
  }

  if (
    normalized === "3" ||
    normalized === "p2" ||
    normalized === "2kg" ||
    normalized.includes("dois")
  ) {
    return "P2 (2kg)";
  }

  return null;
}

export function parsePagamento(text: string): string | null {
  const normalized = normalizeText(text);

  if (normalized === "1" || normalized.includes("pix")) {
    return "PIX";
  }

  if (normalized === "2" || normalized.includes("dinheiro")) {
    return "Dinheiro";
  }

  if (
    normalized === "3" ||
    normalized.includes("cartao") ||
    normalized.includes("credito") ||
    normalized.includes("debito")
  ) {
    return "Cartao na entrega";
  }

  return null;
}

export function matchProductInput(
  text: string,
  products: Product[]
): Product | null {
  const normalized = normalizeText(text);
  const legacyMatch = parseProduto(text);

  for (const product of products) {
    if (!product.active || product.stock_units <= 0) {
      continue;
    }

    const aliases = Array.isArray(product.aliases) ? product.aliases : [];
    const normalizedAliases = aliases.map((alias) => normalizeText(String(alias)));

    if (
      normalized === normalizeText(product.code) ||
      normalized === normalizeText(product.name) ||
      normalizedAliases.includes(normalized)
    ) {
      return product;
    }

    if (legacyMatch && normalizeText(product.name).includes(normalizeText(legacyMatch))) {
      return product;
    }
  }

  return null;
}
