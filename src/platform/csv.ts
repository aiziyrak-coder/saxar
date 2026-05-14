/** UTF-8 BOM bilan CSV — Excel’da o‘zbek/lotin matn to‘g‘ri ochiladi */
export function rowsToCsv(rows: Record<string, string | number | boolean | null | undefined>[]): string {
  if (rows.length === 0) return '\uFEFF';
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = keys.map(esc).join(',');
  const body = rows.map((r) => keys.map((k) => esc(r[k])).join(',')).join('\r\n');
  return `\uFEFF${header}\r\n${body}`;
}

export function downloadCsv(filename: string, rows: Record<string, string | number | boolean | null | undefined>[]): void {
  const blob = new Blob([rowsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
