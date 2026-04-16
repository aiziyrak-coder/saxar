import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Wallet, ArrowUpRight, History, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DriverFinance() {
  const [amount, setAmount] = useState('');
  
  const debtList = [
    { id: 1, name: 'Makro Supermarket', debt: 4500000, lastPayment: '2026-03-10' },
    { id: 2, name: 'Korzinka', debt: 1200000, lastPayment: '2026-03-12' },
    { id: 3, name: 'Osiyo Market', debt: 850000, lastPayment: '2026-03-01' },
  ];

  const recentTransactions = [
    { id: 'TRX-001', shop: 'Havas Do\'kon', amount: 2500000, type: 'Naqd', date: 'Bugun, 14:30' },
    { id: 'TRX-002', shop: 'Makro Supermarket', amount: 1500000, type: 'Karta', date: 'Kecha, 11:15' },
  ];

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 text-slate-900 border-none shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-900">Yig'ilgan pul (Naqd)</h2>
          <Wallet className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="text-3xl font-bold mb-1">8,200,000 <span className="text-lg font-normal text-emerald-700">UZS</span></div>
        <div className="text-sm text-emerald-700 flex items-center gap-1 mt-2">
          <AlertCircle className="h-4 w-4" /> Kassaga topshirilmagan
        </div>
      </Card>

      {/* Collect Money Form */}
      <Card className="shadow-sm border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-emerald-600" /> Pul qabul qilish
        </h3>
        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Do'konni tanlang</label>
            <select className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Tanlang...</option>
              {debtList.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name} (Qarz: {shop.debt.toLocaleString()})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Summa (UZS)</label>
            <Input 
              type="number" 
              placeholder="0" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full bg-slate-50 border-slate-200 text-slate-700">Karta orqali</Button>
            <Button variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700 border-none">Naqd pul</Button>
          </div>
        </form>
      </Card>

      {/* Handover Button */}
      <Button variant="primary" className="w-full h-14 text-lg font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 border-none gap-2">
        <Wallet className="h-6 w-6" /> Kassaga topshirish
      </Button>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" /> So'nggi to'lovlar
          </h3>
          <span className="text-sm text-emerald-700 font-medium">Barchasi</span>
        </div>
        
        <div className="space-y-3">
          {recentTransactions.map((trx) => (
            <Card key={trx.id} className="p-4 shadow-sm border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{trx.shop}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">{trx.date} • {trx.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600 text-sm">+{trx.amount.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">{trx.id}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
