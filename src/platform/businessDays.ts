/** Shanba-yakshanba tashlab, ish kunlarini qo‘shadi (sodda rejim — bayramlar yo‘q) */
export function addBusinessDays(start: Date, businessDays: number): Date {
  const d = new Date(start.getTime());
  let left = businessDays;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return d;
}
