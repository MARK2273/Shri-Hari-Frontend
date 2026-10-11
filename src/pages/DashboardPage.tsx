import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Layers,
  PackageCheck,
  Factory,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [productionRuns, setProductionRuns] = useState<any[]>([]);
  const [fgInventory, setFgInventory] = useState<any>({ summary: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [matRes, ordRes, prodRes, fgRes] = await Promise.all([
          api.get('/materials'),
          api.get('/orders'),
          api.get('/production'),
          api.get('/finished-goods'),
        ]);

        setMaterials(matRes.data.materials || []);
        setOrders(ordRes.data.orders || []);
        setProductionRuns(prodRes.data.batches || []);
        setFgInventory(fgRes.data || { summary: [] });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalRawStockKg = materials.reduce((acc, m) => acc + (Number(m.total_stock_kg) || 0), 0);
  const lowStockMaterials = materials.filter((m) => m.is_low_stock);
  const totalFinishedGoodsKg = (fgInventory.summary || []).reduce(
    (acc: number, item: any) => acc + (Number(item.total_on_hand_kg) || 0),
    0
  );
  const pendingOrdersKg = orders
    .filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
    .reduce((acc, o) => acc + (Number(o.total_requested_weight_kg) || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Factory Control Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time material lots, order-driven production batches & dispatch ledger
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Link
            to="/materials"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-brand-500" />
            Receive Stock
          </Link>
          <Link
            to="/production"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Production Run
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner (INV-09) */}
      {lowStockMaterials.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Low Raw Material Stock Warning ({lowStockMaterials.length} Types below threshold)
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockMaterials.map((m) => (
                <span
                  key={m.id}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/80 dark:bg-factory-900/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50"
                >
                  {m.name}: <strong className="font-mono">{m.total_stock_kg} kg</strong> (Min: {m.min_stock_level_kg} kg)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Raw Plastic Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Raw Plastic On-Hand</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalRawStockKg.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Across 10 standard plastic grades
          </p>
        </div>

        {/* Finished Goods Stock */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Finished Goods Stock</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalFinishedGoodsKg.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Deducted at confirmed dispatch</p>
        </div>

        {/* Pending Order Weight */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Orders Demand</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {pendingOrdersKg.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{orders.length} active customer orders</p>
        </div>

        {/* Production Runs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Production Batches</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {productionRuns.length}
            </span>
            <span className="text-xs font-bold text-slate-400">runs recorded</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Order-linked traceability
          </p>
        </div>
      </div>

      {/* Main Tables Split: Recent Production Runs & Open Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Production Runs */}
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Factory className="w-4 h-4 text-brand-500" />
              Latest Production Batches
            </h3>
            <Link to="/production" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5">Batch #</th>
                  <th className="py-2.5">Product</th>
                  <th className="py-2.5">Output (kg)</th>
                  <th className="py-2.5">Waste (kg)</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {productionRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No production batches recorded yet.
                    </td>
                  </tr>
                ) : (
                  productionRuns.slice(0, 5).map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {run.batch_number}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                        {run.products?.name || run.product_name}
                      </td>
                      <td className="py-3 font-mono">{run.accepted_output_kg ?? 0}</td>
                      <td className="py-3 font-mono text-rose-500">{run.waste_kg ?? 0}</td>
                      <td className="py-3">
                        <Badge variant={run.status === 'completed' ? 'success' : 'info'}>
                          {run.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Orders Status */}
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-500" />
              Customer Orders & Fulfillment
            </h3>
            <Link to="/orders" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5">Order #</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Requested</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                      No active orders placed yet.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                    <td className="py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {order.order_number}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {order.customers?.name || order.customer_name}
                    </td>
                    <td className="py-3 font-mono">{order.total_requested_weight_kg} kg</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          order.status === 'completed'
                            ? 'success'
                            : order.status === 'in_production'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
