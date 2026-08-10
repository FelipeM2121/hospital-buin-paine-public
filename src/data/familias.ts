import { RAW } from "./raw";

// Mismas 4 familias oficiales del inventario (ver PIE_FAMILIA_COLORS en constants/theme.ts),
// en el orden solicitado para agrupar listas de productos como Especificaciones Técnicas.
export const FAMILIAS = ["Silla", "Mobiliario", "Otro", "Mesa"] as const;

const PREFIJO_A_FAMILIA: Record<string, string> = {};
for (const item of RAW) {
  if (!item.tipoEquipo) continue;
  const prefijo = item.tipoEquipo.replace(/[a-z]+$/i, "");
  if (!(prefijo in PREFIJO_A_FAMILIA)) PREFIJO_A_FAMILIA[prefijo] = item.familia;
}

/**
 * Familia oficial (Silla / Mesa / Otro / Mobiliario) de un código EETT,
 * a partir del mismo tipoEquipo con que el inventario ya está clasificado.
 * Ej: "204.002" → "204002" → "Silla".
 */
export function familiaPorCodigoEETT(codigoEETT: string): string {
  const prefijo = codigoEETT.replace(".", "").replace(/[a-z]+$/i, "");
  return PREFIJO_A_FAMILIA[prefijo] ?? "Otro";
}
