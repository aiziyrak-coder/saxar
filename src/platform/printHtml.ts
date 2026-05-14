/** Yangi oynada HTML chop etish (buyurtma varaqasi va h.k.) */
export function printHtmlDocument(title: string, innerHtml: string): void {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!w) return;
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>' +
    escapeHtml(title) +
    '</title>' +
    '<style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a} table{border-collapse:collapse;width:100%} th,td{border:1px solid #e2e8f0;padding:8px;text-align:left} @media print{body{padding:0}}</style>' +
    '</head><body>' +
    innerHtml +
    "<script>window.onload=function(){window.print();setTimeout(function(){window.close()},250)}</script></body></html>";
  w.document.write(html);
  w.document.close();
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
