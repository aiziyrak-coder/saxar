import { escapeHtml } from './printHtml';

export interface OrderReceiptLike {
  id: string;
  client: string;
  date: string;
  amount: number;
  status: string;
  items: number;
  agent: string;
}

export function buildOrderReceiptHtml(o: OrderReceiptLike): string {
  return `
  <h1>Buyurtma varaqasi</h1>
  <p><strong>ID:</strong> ${escapeHtml(o.id)}</p>
  <p><strong>Mijoz:</strong> ${escapeHtml(o.client)}</p>
  <p><strong>Sana:</strong> ${escapeHtml(o.date)}</p>
  <p><strong>Agent:</strong> ${escapeHtml(o.agent)}</p>
  <p><strong>Status:</strong> ${escapeHtml(o.status)}</p>
  <p><strong>Pozitsiyalar:</strong> ${o.items}</p>
  <p><strong>Jami:</strong> ${o.amount.toLocaleString('uz-UZ')} UZS</p>
  `;
}
