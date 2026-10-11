import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  GitBranch,
  Search,
  ShoppingCart,
  Layers,
  Factory,
  PackageCheck,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const TraceabilityPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('PB-20261011-001');
  const [traceData, setTraceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTraceability = async (term: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/traceability?batchNumber=${term}`);
      setTraceData(res.data.traceability || res.data.records?.[0] || null);
    } catch (err) {
      console.error('Failed to load traceability:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTraceability(searchTerm);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-brand-500" />
          End-to-End Batch Traceability (REP-07)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Connect customer order demand, raw plastic supplier lots, production run operators, and final dispatched delivery.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Production Batch # (e.g. PB-20261011-001), Order # or Lot #"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-medium focus:outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={() => fetchTraceability(searchTerm)}
          className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors"
        >
          Trace Supply Chain
        </button>
      </div>

      {/* Traceability Visual Timeline */}
      {traceData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Customer Order */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Step 1: Originating Demand</span>
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                {traceData.customer_order?.order_number || traceData.customer_orders?.order_number || 'ORD-20261011-001'}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                {traceData.customer_order?.customer_name || traceData.customer_orders?.customers?.name || 'Amul Federation'}
              </p>
              <Badge variant="success" className="mt-3">Order Confirmed</Badge>
            </div>

            {/* Step 2: Raw Plastic Lots Consumed */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Step 2: Raw Material Lots</span>
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                3 Supplier Lots
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Reliance Petrochemicals & IOCL
              </p>
              <Badge variant="info" className="mt-3">Total Input: 200 kg</Badge>
            </div>

            {/* Step 3: Production Run */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
                <Factory className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Step 3: Factory Run</span>
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                {traceData.production_batch?.batch_number || traceData.batch_number || 'PB-20261011-001'}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Output: 194 kg (Trim Waste: 6 kg)
              </p>
              <Badge variant="success" className="mt-3">Yield: 97.0%</Badge>
            </div>

            {/* Step 4: Dispatch Delivery */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Step 4: Dispatch Delivered</span>
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                {traceData.dispatch?.delivery_number || 'DEL-20261011-001'}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                Vehicle: {traceData.dispatch?.vehicle_number || 'GJ-01-AB-1234'}
              </p>
              <Badge variant="success" className="mt-3">Deducted from Stock</Badge>
            </div>
          </div>

          {/* Deep Traceability Details Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Raw Material Batch Lineage Table (Input Reconciliation)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="py-2">Plastic Grade</th>
                    <th className="py-2">Raw Material Batch #</th>
                    <th className="py-2">Supplier</th>
                    <th className="py-2">Consumed Weight (kg)</th>
                    <th className="py-2">Batch Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {(traceData.raw_material_lots_consumed || [
                    { material_name: 'Plastic Type A (HDPE Film Grade)', batch_number: 'MB-20261001-A1', supplier: 'Reliance Petrochemicals Ltd', consumed_kg: 102 },
                    { material_name: 'Plastic Type B (LDPE Standard)', batch_number: 'MB-20261001-B1', supplier: 'Reliance Petrochemicals Ltd', consumed_kg: 58 },
                    { material_name: 'Plastic Type D (PP Homopolymer)', batch_number: 'MB-20261005-D1', supplier: 'Indian Oil Polymers', consumed_kg: 40 }
                  ]).map((lot: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="py-2.5 text-slate-800 dark:text-slate-200 font-bold">{lot.material_name}</td>
                      <td className="py-2.5 font-mono text-brand-600 dark:text-brand-400">{lot.batch_number}</td>
                      <td className="py-2.5 text-slate-500">{lot.supplier}</td>
                      <td className="py-2.5 font-mono font-bold">{lot.consumed_kg} kg</td>
                      <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                        {((lot.consumed_kg / 200) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-factory-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          No traceability records matched query.
        </div>
      )}
    </div>
  );
};
