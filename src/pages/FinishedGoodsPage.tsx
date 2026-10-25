import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PackageCheck, Truck, Layers, CheckCircle2, User, GitBranch, Building2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageSkeleton } from '../components/common/Skeleton';
import { Link } from 'react-router-dom';

export const FinishedGoodsPage: React.FC = () => {
  const [data, setData] = useState<{ summary: any[]; batches: any[] }>({
    summary: [],
    batches: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/finished-goods');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load finished goods:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  if (isLoading) {
    return <PageSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-brand-500" />
            Finished Goods Inventory
          </h1>
          {/* <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Maintained separately from raw plastic. Decreases when dispatches are confirmed.
          </p> */}
        </div>
        <Link
          to="/dispatch"
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
        >
          <Truck className="w-4 h-4" />
          Go to Dispatch & Delivery
        </Link>
      </div>

      {/* Aggregated On-Hand Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(data.summary || []).map((prod) => (
          <div
            key={prod.product_id}
            className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {prod.product_code}
              </span>
              <Badge variant="success">In Stock</Badge>
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {prod.product_name}
            </h3>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Available</span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {prod.available_kg || prod.total_on_hand_kg} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Reserved</span>
                <span className="text-sm font-black font-mono text-amber-500">
                  {prod.total_reserved_kg || 0} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispatched</span>
                <span className="text-sm font-black font-mono text-slate-500">
                  {prod.total_dispatched_kg || 0} kg
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Finished Batches Table */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Traceable Finished Goods Batches ({data.batches?.length || 0})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              <tr>
                <th className="px-3.5 py-3 whitespace-nowrap">Product</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Production Date</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Operator</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">Produced</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">On-Hand</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">Dispatched</th>
                <th className="px-3.5 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {(data.batches || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3.5 py-8 text-center text-slate-400 text-xs">
                    No finished goods batches in inventory. Complete a production run to generate finished goods lots.
                  </td>
                </tr>
              ) : (
                (data.batches || []).map((batch) => {
                  const operatorName = batch.production_batches?.operator_name || batch.operator_name || '';
                  const isJobWork = operatorName.toLowerCase().includes('job work') || batch.batch_number?.startsWith('FG-JW');

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="px-3.5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <span>{batch.products?.name || 'Finished Product'}</span>
                          {isJobWork && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                              Job Work
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 font-normal mt-0.5">
                          Lot: {batch.batch_number}
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {new Date(batch.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {isJobWork ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span>{operatorName || 'Job Work Vendor'}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 pl-1">
                              Outsourced Processing
                            </span>
                          </div>
                        ) : operatorName ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                            <User className="w-3 h-3 text-brand-500" />
                            {operatorName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                    <td className="px-3.5 py-3.5 text-right font-mono">{batch.quantity_produced_kg} kg</td>
                    <td className="px-3.5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {batch.quantity_on_hand_kg} kg
                    </td>
                    <td className="px-3.5 py-3.5 text-right font-mono text-slate-500">
                      {batch.quantity_dispatched_kg || 0} kg
                    </td>
                    <td className="px-3.5 py-3.5 text-center">
                      <Badge variant={batch.status === 'in_stock' ? 'success' : 'neutral'}>
                        {batch.status}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/traceability?batchId=${batch.production_batch_id || batch.production_batches?.id || ''}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors border border-brand-500/20"
                        title="Trace Production Lineage"
                      >
                        <GitBranch className="w-3 h-3" />
                        Trace
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
