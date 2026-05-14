/** QQS ni narxga qo‘shish (exclusive → inclusive) */
export function priceWithVatExclusive(amount: number, vatPercent: number): number {
  if (vatPercent <= 0) return amount;
  return Math.round(amount * (1 + vatPercent / 100));
}

/** QQS ajratish (inclusive dan asosiy summa) */
export function extractVatFromInclusive(total: number, vatPercent: number): { net: number; vat: number } {
  if (vatPercent <= 0) return { net: total, vat: 0 };
  const net = Math.round(total / (1 + vatPercent / 100));
  return { net, vat: total - net };
}
