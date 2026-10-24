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
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Boxes
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatNumber } from '../utils/format';

export const TraceabilityPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTraceability = async (term: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/traceability?batchNumber=${encodeURIComponent(term)}`);
      const matched = res.data.traceability || res.data.records?.[0] || null;
      setTraceData(matched);
      if (res.data.availableBatches) {
        setAvailableBatches(res.data.availableBatches);
      }
      if (!term && matched) {
        setSearchTerm(matched.batch_number);
      }
    } catch (err) {
      console.error('Failed to load traceability:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTraceability('');
  }, []);

  const totalRawInputKg =
    traceData?.raw_material_lots_consumed?.reduce(
      (sum: number, l: any) => sum + (Number(l.consumed_kg) || 0),
      0
    ) || Number(traceData?.planned_quantity_kg) || 0;

  if (isLoading && !traceData) {
    return <PageSkeleton type="traceability" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-brand-500" />
          End-to-End Batch Traceability (REP-07)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Full 360° audit trail connecting customer order demand, raw plastic supplier lots, production run yields, and finished goods inventory.
        </p>
      </div>

      {/* Search Input & Quick Selectors */}
      <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTraceability(searchTerm);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Production Batch # (e.g. PB-20261011-509), Order #, or Material Lot #"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-medium focus:outline-none focus:border-brand-500"
            />
          </div>
          <Button
            type="submit"
            isLoading={isLoading}
            loadingText="Searching..."
            icon={Search}
            className="w-full sm:w-auto"
          >
            Trace Supply Chain
          </Button>
        </form>

        {availableBatches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400">Available Batches:</span>
            {availableBatches.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setSearchTerm(b);
                  fetchTraceability(b);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
                  searchTerm === b
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-factory-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Traceability Visual Timeline */}
      {traceData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Customer Order */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Step 1: Originating Demand</span>
                <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {traceData.customer_order?.order_number || traceData.customer_orders?.order_number || 'ORD-01'}
                </h4>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {traceData.customer_order?.customer_name || traceData.customer_orders?.customers?.name || 'Customer Account'}
                </p>
                {traceData.customer_order?.delivery_address && (
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {traceData.customer_order.delivery_address}
                  </p>
                )}
              </div>
              <Badge variant="success" className="mt-4 w-fit">
                {traceData.customer_order?.status || 'Confirmed'} ({traceData.customer_order?.total_requested_weight_kg || traceData.planned_quantity_kg} kg)
              </Badge>
            </div>

            {/* Step 2: Raw Plastic Lots Consumed */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Step 2: Raw Material Lots</span>
                <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {traceData.raw_material_lots_consumed?.length || 0} Lots Consumed
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                  {traceData.raw_material_lots_consumed?.map((l: any) => l.material_name).join(', ') || 'Virgin Polymers'}
                </p>
              </div>
              <Badge variant="info" className="mt-4 w-fit">
                Total Input: {totalRawInputKg} kg
              </Badge>
            </div>

            {/* Step 3: Production Run */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
                  <Factory className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Step 3: Factory Execution</span>
                <h4 className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 mt-1">
                  {traceData.production_batch?.batch_number || traceData.batch_number}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Product: {traceData.products?.name} ({traceData.products?.code})
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Output: {formatNumber(traceData.accepted_output_kg || traceData.planned_quantity_kg)} kg accepted
                  {Number(traceData.waste_kg) > 0 ? (
                    <span>
                      {' '}(Waste: {formatNumber(traceData.waste_kg)} kg
                      {(Number(traceData.trim_waste_kg) > 0 || Number(traceData.plant_waste_kg) > 0)
                        ? ` — Trim: ${formatNumber(traceData.trim_waste_kg)}kg, Plant: ${formatNumber(traceData.plant_waste_kg)}kg`
                        : ''})
                    </span>
                  ) : ''}
                </p>
              </div>
              <Badge variant="success" className="mt-4 w-fit">
                Yield: {formatNumber(traceData.yield_percentage || traceData.production_batch?.yield_pct || 100)}%
              </Badge>
            </div>

            {/* Step 4: Dispatch Delivery / Finished Goods */}
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
                  {traceData.dispatch ? <Truck className="w-4 h-4" /> : <Boxes className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {traceData.dispatch ? 'Step 4: Dispatch Delivery' : 'Step 4: Finished Goods Stock'}
                </span>
                <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {traceData.dispatch?.delivery_number ||
                    traceData.finished_goods_batch?.batch_number ||
                    `FG-${traceData.batch_number?.replace('PB-', '')}`}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
                  {traceData.dispatch
                    ? `Vehicle: ${traceData.dispatch.vehicle_number}`
                    : 'Warehouse Bay 1 (Quality Approved)'}
                </p>
              </div>
              <Badge variant={traceData.dispatch ? 'success' : 'info'} className="mt-4 w-fit">
                {traceData.dispatch ? 'Dispatched to Customer' : 'Stocked & Ready for Dispatch'}
              </Badge>
            </div>
          </div>

          {/* Deep Traceability Details Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Raw Material Lot Lineage & Batch Contribution
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Detailed breakdown of raw material lots consumed into batch {traceData.batch_number}
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Formula: V{traceData.product_recipes?.version || 1}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5 whitespace-nowrap">Plastic Grade</th>
                    <th className="py-2.5 whitespace-nowrap">Code</th>
                    <th className="py-2.5 whitespace-nowrap">Warehouse Lot #</th>
                    <th className="py-2.5 whitespace-nowrap">Supplier / Lot Ref</th>
                    <th className="py-2.5 whitespace-nowrap">Consumed Weight</th>
                    <th className="py-2.5 text-right whitespace-nowrap">Contribution %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {(traceData.raw_material_lots_consumed || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">
                        No raw material consumption logs recorded for this batch.
                      </td>
                    </tr>
                  ) : (
                    traceData.raw_material_lots_consumed.map((lot: any, idx: number) => {
                      const totalInput =
                        traceData.raw_material_lots_consumed.reduce(
                          (sum: number, l: any) => sum + (Number(l.consumed_kg) || 0),
                          0
                        ) || 1;
                      const pct = formatNumber(((lot.consumed_kg / totalInput) * 100));
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                          <td className="py-3 text-slate-800 dark:text-slate-200 font-bold">
                            {lot.material_name}
                          </td>
                          <td className="py-3 font-mono text-slate-500">{lot.material_code}</td>
                          <td className="py-3 font-mono text-brand-600 dark:text-brand-400 font-bold">
                            {lot.batch_number}
                          </td>
                          <td className="py-3 text-slate-500">{lot.supplier}</td>
                          <td className="py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {formatNumber(lot.consumed_kg)} kg
                          </td>
                          <td className="py-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                            {pct}%
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
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-factory-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <GitBranch className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-600 dark:text-slate-300">
            No traceability records found for query "{searchTerm}"
          </p>
          <p className="text-[11px] text-slate-400">
            Please enter a valid production batch number (e.g. PB-20261011-509) or select one from the available batches above.
          </p>
        </div>
      )}
    </div>
  );
};
