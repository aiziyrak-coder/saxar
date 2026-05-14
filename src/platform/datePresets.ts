export type DatePresetId = 'today' | 'last7' | 'last30' | 'thisMonth';

export function getDateRangePreset(id: DatePresetId): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (id) {
    case 'today':
      return { start: fmt(end), end: fmt(end) };
    case 'last7':
      start.setDate(start.getDate() - 6);
      return { start: fmt(start), end: fmt(end) };
    case 'last30':
      start.setDate(start.getDate() - 29);
      return { start: fmt(start), end: fmt(end) };
    case 'thisMonth':
      start.setDate(1);
      return { start: fmt(start), end: fmt(end) };
    default:
      return { start: fmt(end), end: fmt(end) };
  }
}
