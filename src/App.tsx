import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AdminLayout from './layouts/AdminLayout';
import B2BLayout from './layouts/B2BLayout';
import MobileLayout from './layouts/MobileLayout';
import AccountantLayout from './layouts/AccountantLayout';
import WarehouseLayout from './layouts/WarehouseLayout';
import ProductionLayout from './layouts/ProductionLayout';
import GlobalFooter from './components/GlobalFooter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Public Pages
import LandingPage from './pages/LandingPage';

// Lazy loaded Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminClients = lazy(() => import('./pages/admin/AdminClients'));
const AdminWMS = lazy(() => import('./pages/admin/AdminWMS'));
const AdminFinance = lazy(() => import('./pages/admin/AdminFinance'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminProduction = lazy(() => import('./pages/admin/AdminProduction'));
const AdminAgents = lazy(() => import('./pages/admin/AdminAgents'));
const AdminLogistics = lazy(() => import('./pages/admin/AdminLogistics'));

// Lazy loaded B2B Pages
const B2BCatalog = lazy(() => import('./pages/b2b/B2BCatalog'));
const B2BOrders = lazy(() => import('./pages/b2b/B2BOrders'));
const B2BProfile = lazy(() => import('./pages/b2b/B2BProfile'));
const B2BCart = lazy(() => import('./pages/b2b/B2BCart'));
const B2BFinance = lazy(() => import('./pages/b2b/B2BFinance'));

// Lazy loaded Agent Pages
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'));
const AgentShops = lazy(() => import('./pages/agent/AgentShops'));
const AgentOrder = lazy(() => import('./pages/agent/AgentOrder'));
const AgentFinance = lazy(() => import('./pages/agent/AgentFinance'));
const AgentProfile = lazy(() => import('./pages/agent/AgentProfile'));

// Lazy loaded Driver Pages
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));
const DriverInventory = lazy(() => import('./pages/driver/DriverInventory'));
const DriverFinance = lazy(() => import('./pages/driver/DriverFinance'));
const DriverProfile = lazy(() => import('./pages/driver/DriverProfile'));

// Lazy loaded Accountant Pages
const AccountantDashboard = lazy(() => import('./pages/accountant/AccountantDashboard'));
const AccountantFinance = lazy(() => import('./pages/accountant/AccountantFinance'));
const AccountantAktSverka = lazy(() => import('./pages/accountant/AccountantAktSverka'));
const AccountantExpenses = lazy(() => import('./pages/accountant/AccountantExpenses'));
const AccountantPayroll = lazy(() => import('./pages/accountant/AccountantPayroll'));

// Lazy loaded Warehouse Pages
const WarehouseDashboard = lazy(() => import('./pages/warehouse/WarehouseDashboard'));
const WarehouseWMS = lazy(() => import('./pages/warehouse/WarehouseWMS'));
const WarehouseReceiving = lazy(() => import('./pages/warehouse/WarehouseReceiving'));
const WarehouseShipment = lazy(() => import('./pages/warehouse/WarehouseShipment'));
const WarehouseInventoryCount = lazy(() => import('./pages/warehouse/WarehouseInventoryCount'));

// Lazy loaded Production Pages
const ProductionDashboard = lazy(() => import('./pages/production/ProductionDashboard'));
const ProductionBatches = lazy(() => import('./pages/production/ProductionBatches'));
const ProductionTransfer = lazy(() => import('./pages/production/ProductionTransfer'));

function AppRoutes() {
  const location = useLocation();
  const isMarketingHome = ['/', '/login', '/register'].includes(location.pathname);

  // Loading fallback component
  const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-emerald-50 text-slate-900 relative ${isMarketingHome ? 'pb-8' : 'pb-24'}`}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* B2B Portal Routes */}
        <Route element={<ProtectedRoute allowedRoles={['b2b']} />}>
          <Route path="/b2b" element={<B2BLayout />}>
            <Route index element={<Navigate to="/b2b/catalog" replace />} />
            <Route path="catalog" element={<Suspense fallback={<PageLoader />}><B2BCatalog /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<PageLoader />}><B2BOrders /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><B2BProfile /></Suspense>} />
            <Route path="cart" element={<Suspense fallback={<PageLoader />}><B2BCart /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<PageLoader />}><B2BFinance /></Suspense>} />
          </Route>
        </Route>

        {/* Admin ERP Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<PageLoader />}><AdminOrders /></Suspense>} />
            <Route path="clients" element={<Suspense fallback={<PageLoader />}><AdminClients /></Suspense>} />
            <Route path="wms" element={<Suspense fallback={<PageLoader />}><AdminWMS /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<PageLoader />}><AdminFinance /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<PageLoader />}><AdminReports /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
            <Route path="production" element={<Suspense fallback={<PageLoader />}><AdminProduction /></Suspense>} />
            <Route path="agents" element={<Suspense fallback={<PageLoader />}><AdminAgents /></Suspense>} />
            <Route path="logistics" element={<Suspense fallback={<PageLoader />}><AdminLogistics /></Suspense>} />
          </Route>
        </Route>

        {/* Agent Mobile Routes */}
        <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
          <Route path="/agent" element={<MobileLayout role="agent" />}>
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><AgentDashboard /></Suspense>} />
            <Route path="shops" element={<Suspense fallback={<PageLoader />}><AgentShops /></Suspense>} />
            <Route path="order" element={<Suspense fallback={<PageLoader />}><AgentOrder /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<PageLoader />}><AgentFinance /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><AgentProfile /></Suspense>} />
          </Route>
        </Route>

        {/* Driver Mobile Routes */}
        <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
          <Route path="/driver" element={<MobileLayout role="driver" />}>
            <Route index element={<Navigate to="/driver/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DriverDashboard /></Suspense>} />
            <Route path="inventory" element={<Suspense fallback={<PageLoader />}><DriverInventory /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<PageLoader />}><DriverFinance /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><DriverProfile /></Suspense>} />
          </Route>
        </Route>

        {/* Accountant Routes */}
        <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
          <Route path="/accountant" element={<AccountantLayout />}>
            <Route index element={<Navigate to="/accountant/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><AccountantDashboard /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<PageLoader />}><AccountantFinance /></Suspense>} />
            <Route path="akt-sverka" element={<Suspense fallback={<PageLoader />}><AccountantAktSverka /></Suspense>} />
            <Route path="expenses" element={<Suspense fallback={<PageLoader />}><AccountantExpenses /></Suspense>} />
            <Route path="payroll" element={<Suspense fallback={<PageLoader />}><AccountantPayroll /></Suspense>} />
          </Route>
        </Route>

        {/* Warehouse (Ombor mudiri) Routes */}
        <Route element={<ProtectedRoute allowedRoles={['warehouse']} />}>
          <Route path="/warehouse" element={<WarehouseLayout />}>
            <Route index element={<Navigate to="/warehouse/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><WarehouseDashboard /></Suspense>} />
            <Route path="wms" element={<Suspense fallback={<PageLoader />}><WarehouseWMS /></Suspense>} />
            <Route path="receiving" element={<Suspense fallback={<PageLoader />}><WarehouseReceiving /></Suspense>} />
            <Route path="shipment" element={<Suspense fallback={<PageLoader />}><WarehouseShipment /></Suspense>} />
            <Route path="inventory-count" element={<Suspense fallback={<PageLoader />}><WarehouseInventoryCount /></Suspense>} />
          </Route>
        </Route>

        {/* Production Routes */}
        <Route element={<ProtectedRoute allowedRoles={['production']} />}>
          <Route path="/production" element={<ProductionLayout />}>
            <Route index element={<Navigate to="/production/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><ProductionDashboard /></Suspense>} />
            <Route path="batches" element={<Suspense fallback={<PageLoader />}><ProductionBatches /></Suspense>} />
            <Route path="transfer" element={<Suspense fallback={<PageLoader />}><ProductionTransfer /></Suspense>} />
          </Route>
        </Route>

        {/* 404 - barcha nomatch yo'llar */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isMarketingHome && <GlobalFooter />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

