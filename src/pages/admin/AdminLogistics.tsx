import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Truck, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function AdminLogistics() {
  const deliveries = [
    { id: 'DLV-1042', driver: 'Rustam Karimov', vehicle: 'Isuzu (01 A 123 AA)', route: 'Yunusobod - Mirzo Ulug\'bek', status: 'Yo\'lda', points: 12, completed: 5, amount: 15400000 },
    { id: 'DLV-1043', driver: 'Dilshod To\'rayev', vehicle: 'Labo (01 B 456 BB)', route: 'Chilonzor - Uchtepa', status: 'Yakunlandi', points: 8, completed: 8, amount: 8200000 },
    { id: 'DLV-1044', driver: 'Sanjar Oripov', vehicle: 'Gazel (10 C 789 CC)', route: 'Sergeli - Yangihayot', status: 'Yuklanmoqda', points: 15, completed: 0, amount: 21000000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Logistika va Yetkazib berish</h1>
        <Button variant="primary" className="gap-2">
          <Truck className="h-4 w-4" /> Yangi marshrut
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {deliveries.map((delivery) => (
            <Card key={delivery.id} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-slate-900">{delivery.id}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    delivery.status === 'Yakunlandi' ? 'bg-emerald-100 text-emerald-700' :
                    delivery.status === 'Yo\'lda' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {delivery.status === 'Yakunlandi' && <CheckCircle2 className="h-3 w-3" />}
                    {delivery.status === 'Yo\'lda' && <Truck className="h-3 w-3" />}
                    {delivery.status === 'Yuklanmoqda' && <Clock className="h-3 w-3" />}
                    {delivery.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Haydovchi:</div>
                  <div className="font-medium text-slate-900">{delivery.driver}</div>
                  
                  <div className="text-slate-500">Transport:</div>
                  <div className="font-medium text-slate-900">{delivery.vehicle}</div>
                  
                  <div className="text-slate-500">Marshrut:</div>
                  <div className="font-medium text-slate-900 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" /> {delivery.route}
                  </div>
                </div>
              </div>
              
              <div className="w-full sm:w-48 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Nuqtalar:</div>
                <div className="font-bold text-slate-900 mb-3">{delivery.completed} / {delivery.points} ta do'kon</div>
                
                <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${(delivery.completed / delivery.points) * 100}%` }}
                  ></div>
                </div>
                
                <div className="text-sm text-slate-500 mb-1">Summa:</div>
                <div className="font-bold text-emerald-600">{delivery.amount.toLocaleString()} UZS</div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Vozvratlar (Qaytarish)
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-slate-900 text-sm">Makro Supermarket</div>
                  <span className="text-xs font-bold text-red-600">-120,000 UZS</span>
                </div>
                <div className="text-xs text-slate-600">Sut 1L (10 dona) - Muddati o'tgan</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-slate-900 text-sm">Havas Do'kon</div>
                  <span className="text-xs font-bold text-red-600">-45,000 UZS</span>
                </div>
                <div className="text-xs text-slate-600">Tuz 1kg (18 dona) - Qadoq shikastlangan</div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">Barchasini ko'rish</Button>
          </Card>
          
          <Card className="bg-white/70 text-slate-900 border-emerald-200/60">
            <h3 className="font-bold mb-4">Jonli Xarita</h3>
            <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
              <MapPin className="h-8 w-8 text-slate-600" />
              <span className="ml-2 text-slate-600 font-medium">Xarita integratsiyasi</span>
            </div>
            <Button variant="primary" className="w-full mt-4">Kuzatish</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
