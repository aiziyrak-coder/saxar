import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, Filter, Loader2 } from 'lucide-react';
import { getPLSummary, getSalesByRegion } from '../../services/dashboard';

const salesData = [
  { name: 'Yan', un: 4000, yog: 2400, shakar: 2400 },
  { name: 'Fev', un: 3000, yog: 1398, shakar: 2210 },
  { name: 'Mar', un: 2000, yog: 9800, shakar: 2290 },
  { name: 'Apr', un: 2780, yog: 3908, shakar: 2000 },
  { name: 'May', un: 1890, yog: 4800, shakar: 2181 },
  { name: 'Iyun', un: 2390, yog: 3800, shakar: 2500 },
];
const COLORS = ['#059669', '#10b981', '#f59e0b', '#ef4444'];

function formatMoney(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} mlrd`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export default function AdminReports() {
  const [pl, setPl] = useState<{ revenue: number; expenses: number; profit: number } | null>(null);
  const [regionData, setRegionData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = new Date();
      start.setDate(1);
      const startStr = start.toISOString().split('T')[0];
      const endStr = new Date().toISOString().split('T')[0];
      try {
        const [plRes, regions] = await Promise.all([
          getPLSummary(startStr, endStr),
          getSalesByRegion(),
        ]);
        if (!cancelled) {
          setPl(plRes);
          setRegionData(regions.map(r => ({ name: r.region, value: r.sales })));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Hisobotlar (P&L va Tahlil)</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> Sana oralig'i
          </Button>
          <Button variant="primary" className="gap-2">
            <Download className="h-4 w-4" /> Eksport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Summary */}
        <Card className="lg:col-span-2 bg-white/70 text-slate-900 border border-emerald-200/60">
          <h3 className="text-lg font-bold mb-6 text-slate-900">Foyda va Zarar (P&L) - Joriy oy</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-4">
              <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
            </div>
          ) : pl ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
              <div className="pt-4 sm:pt-0">
                <div className="text-sm text-slate-400 mb-1">Jami tushum (Daromad)</div>
                <div className="text-3xl font-bold text-emerald-400">{formatMoney(pl.revenue)} so‘m</div>
              </div>
              <div className="pt-4 sm:pt-0 sm:pl-6">
                <div className="text-sm text-slate-400 mb-1">Jami xarajatlar (Operatsion)</div>
                <div className="text-3xl font-bold text-red-400">{formatMoney(pl.expenses)} so‘m</div>
              </div>
              <div className="pt-4 sm:pt-0 sm:pl-6">
                <div className="text-sm text-slate-400 mb-1">Toza foyda (Net Profit)</div>
                <div className="text-3xl font-bold text-emerald-600">{formatMoney(pl.profit)} so‘m</div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 py-4">Ma’lumot yo‘q</div>
          )}
        </Card>

        {/* Sales by Category */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Kategoriyalar bo'yicha savdo</h3>
            <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /></Button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="un" name="Un mahsulotlari" stackId="a" fill="#059669" radius={[0, 0, 4, 4]} />
                <Bar dataKey="yog" name="Yog' mahsulotlari" stackId="a" fill="#10b981" />
                <Bar dataKey="shakar" name="Shakar" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sales by Region */}
        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-6">Hududlar kesimida savdo</h3>
          <div className="h-80 w-full flex flex-col items-center justify-center">
            {regionData.length === 0 ? (
              <p className="text-slate-500">Hudud bo‘yicha ma’lumot yo‘q</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#059669"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {regionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                  {regionData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
