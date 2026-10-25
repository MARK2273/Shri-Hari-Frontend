import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  PackageCheck,
  Truck,
  Layers,
  User,
  GitBranch,
  Building2,
  Ruler,
  Search,
  Filter,
  X,
  Sparkles,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageSkeleton } from '../components/common/Skeleton';
import { Link } from 'react-router-dom';

interface ProductSpec {
  size_micron: string;
  on_hand_kg: number;
  reserved_kg: number;
  dispatched_kg: number;
  available_kg: number;
  batch_count: number;
}

interface ProductSummary {
  product_id: string;
  product_code: string;
  product_name: string;
  unit?: string;
  total_on_hand_kg: number;
  total_reserved_kg: number;
  total_dispatched_kg: number;
  available_kg: number;
  specs?: ProductSpec[];
}

interface SizeMicronSummary {
  size_micron: string;
  total_on_hand_kg: number;
  total_reserved_kg: number;
  total_dispatched_kg: number;
  available_kg: number;
  batch_count: number;
  products?: { product_id: string; product_name: string; product_code: string; available_kg: number }[];
}

interface FinishedBatch {
  id: string;
  tenant_id: string;
  product_id: string;
  production_batch_id?: string;
  batch_number: string;
  size_micron?: string;
  quantity_produced_kg?: number;
  quantity_on_hand_kg: number;
  quantity_reserved_kg?: number;
  quantity_dispatched_kg?: number;
  status: string;
  created_at: string;
  operator_name?: string;
  products?: { id: string; code: string; name: string; unit?: string };
  production_batches?: {
    id: string;
    batch_number: string;
    operator_name?: string;
    order_id?: string;
    size_micron?: string;
    customer_orders?: { order_number: string; size_micron?: string };
  };
}

export const FinishedGoodsPage: React.FC = () => {
  const [data, setData] = useState<{
    summary: ProductSummary[];
    sizeMicronSummary: SizeMicronSummary[];
    batches: FinishedBatch[];
  }>({
    summary: [],
    sizeMicronSummary: [],
    batches: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // View mode: 'byProduct' or 'bySpec'
  const [viewMode, setViewMode] = useState<'byProduct' | 'bySpec'>('byProduct');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/finished-goods');
        setData({
          summary: res.data.summary || [],
          sizeMicronSummary: res.data.sizeMicronSummary || [],
          batches: res.data.batches || [],
        });
      } catch (err) {
        console.error('Failed to load finished goods:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Unique list of size_microns with active stock > 0 kg
  const uniqueSpecs = useMemo(() => {
    const specsSet = new Set<string>();
    (data.batches || []).forEach((b) => {
      if (b.size_micron && Number(b.quantity_on_hand_kg || 0) > 0) {
        specsSet.add(b.size_micron);
      }
    });
    (data.sizeMicronSummary || []).forEach((s) => {
      if (s.size_micron && Number(s.available_kg || s.total_on_hand_kg || 0) > 0) {
        specsSet.add(s.size_micron);
      }
    });
    return Array.from(specsSet).sort();
  }, [data.batches, data.sizeMicronSummary]);

  // Active size micron summaries with stock > 0 kg
  const activeSpecsSummary = useMemo(() => {
    return (data.sizeMicronSummary || []).filter(
      (spec) => Number(spec.available_kg || spec.total_on_hand_kg || 0) > 0
    );
  }, [data.sizeMicronSummary]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return (data.batches || []).filter((batch) => {
      const spec = batch.size_micron || 'Standard';
      const productName = batch.products?.name || '';
      const productCode = batch.products?.code || '';
      const lot = batch.batch_number || '';
      const operatorName = batch.production_batches?.operator_name || batch.operator_name || '';

      // Spec filter
      if (selectedSpec !== 'all' && spec !== selectedSpec) {
        return false;
      }

      // Product filter
      if (selectedProduct !== 'all' && batch.product_id !== selectedProduct) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && batch.status !== selectedStatus) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          productName.toLowerCase().includes(q) ||
          productCode.toLowerCase().includes(q) ||
          lot.toLowerCase().includes(q) ||
          operatorName.toLowerCase().includes(q) ||
          spec.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [data.batches, selectedSpec, selectedProduct, selectedStatus, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSpec !== 'all' ||
    selectedProduct !== 'all' ||
    selectedStatus !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSpec('all');
    setSelectedProduct('all');
    setSelectedStatus('all');
  };

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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time stock tracking by Product and multi-spec Micron & Size variations.
          </p>
        </div>
        <Link
          to="/dispatch"
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20 w-fit"
        >
          <Truck className="w-4 h-4" />
          Go to Dispatch & Delivery
        </Link>
      </div>

      {/* View Mode Switcher and Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-factory-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('byProduct')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'byProduct'
                ? 'bg-white dark:bg-factory-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            Group by Product ({data.summary?.length || 0})
          </button>
          <button
            onClick={() => setViewMode('bySpec')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'bySpec'
                ? 'bg-white dark:bg-factory-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Group by Size & Micron ({activeSpecsSummary.length})
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 px-2">
          <span>
            Total Batches:{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {data.batches?.length || 0}
            </strong>
          </span>
          <span>•</span>
          <span>
            Variations:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
              {uniqueSpecs.length} specs
            </strong>
          </span>
        </div>
      </div>

      {/* CARDS DISPLAY: Grouped by Product */}
      {viewMode === 'byProduct' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data.summary || []).map((prod) => {
            const isSelected = selectedProduct === prod.product_id;
            return (
              <div
                key={prod.product_id}
                className={`p-5 rounded-2xl bg-white dark:bg-factory-900 border transition-all shadow-sm ${
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {prod.product_code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="success">In Stock</Badge>
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {prod.product_name}
                </h3>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
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

                {/* Size & Micron Breakdown Section */}
                {(() => {
                  const availableSpecs = (prod.specs || []).filter(
                    (spec) => Number(spec.available_kg || spec.on_hand_kg || 0) > 0
                  );

                  if (availableSpecs.length === 0) return null;

                  return (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-indigo-500" />
                          Size & Micron Variations ({availableSpecs.length})
                        </span>
                        <span className="text-[10px] text-slate-400 italic">click to filter</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {availableSpecs.map((spec) => {
                          const isSpecActive =
                            selectedSpec === spec.size_micron && selectedProduct === prod.product_id;
                          return (
                            <button
                              key={spec.size_micron}
                              onClick={() => {
                                if (isSpecActive) {
                                  setSelectedSpec('all');
                                  setSelectedProduct('all');
                                } else {
                                  setSelectedSpec(spec.size_micron);
                                  setSelectedProduct(prod.product_id);
                                }
                              }}
                              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                isSpecActive
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                              }`}
                            >
                              <span className="font-bold">{spec.size_micron}</span>
                              <span
                                className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                                  isSpecActive
                                    ? 'bg-indigo-700 text-white'
                                    : 'bg-white/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200'
                                }`}
                              >
                                {spec.available_kg} kg
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* CARDS DISPLAY: Grouped by Size & Micron */}
      {viewMode === 'bySpec' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSpecsSummary.map((spec) => {
            const isSelected = selectedSpec === spec.size_micron;
            return (
              <div
                key={spec.size_micron}
                onClick={() => {
                  setSelectedSpec(isSelected ? 'all' : spec.size_micron);
                }}
                className={`p-5 rounded-2xl bg-white dark:bg-factory-900 border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                    <Ruler className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{spec.size_micron}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {spec.batch_count} {spec.batch_count === 1 ? 'batch' : 'batches'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Available</span>
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {spec.available_kg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">On Hand</span>
                    <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-300">
                      {spec.total_on_hand_kg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispatched</span>
                    <span className="text-sm font-black font-mono text-slate-500">
                      {spec.total_dispatched_kg || 0} kg
                    </span>
                  </div>
                </div>

                {/* Products having this spec */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                    Products with this Specification:
                  </span>
                  <div className="space-y-1">
                    {(spec.products || []).map((p) => (
                      <div
                        key={p.product_id}
                        className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded bg-slate-50 dark:bg-factory-800/40"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {p.product_name}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          {p.available_kg} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Traceable Batches Section with Filters */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
              Traceable Finished Goods Batches
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {filteredBatches.length} of {data.batches?.length || 0}
            </span>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product, lot, spec..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-factory-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Spec Dropdown */}
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-factory-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Sizes & Microns</option>
              {uniqueSpecs.map((spec) => (
                <option key={spec} value={spec}>
                  📏 {spec}
                </option>
              ))}
            </select>

            {/* Product Dropdown */}
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-factory-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Products</option>
              {(data.summary || []).map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-factory-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="depleted">Depleted</option>
            </select>

            {/* Reset button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/40 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Batches Table with custom horizontal scroll container */}
        <div className="overflow-x-auto -mx-5 px-5 pb-2">
          <table className="w-full text-left text-xs min-w-[1150px] border-collapse">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 bg-white dark:bg-factory-900">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap min-w-[210px]">Product & Lot</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[160px]">Size & Micron</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[120px]">Production Date</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[190px]">Operator / Vendor</th>
                <th className="px-4 py-3 text-right whitespace-nowrap min-w-[95px]">Produced</th>
                <th className="px-4 py-3 text-right whitespace-nowrap min-w-[95px]">On-Hand</th>
                <th className="px-4 py-3 text-right whitespace-nowrap min-w-[95px]">Dispatched</th>
                <th className="px-4 py-3 text-center whitespace-nowrap min-w-[105px]">Status</th>
                <th className="px-4 py-3 text-right whitespace-nowrap min-w-[170px] pr-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                    {hasActiveFilters
                      ? 'No finished goods batches match the selected filters.'
                      : 'No finished goods batches in inventory. Complete a production run to generate finished goods lots.'}
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const operatorName = batch.production_batches?.operator_name || batch.operator_name || '';
                  const isJobWork =
                    operatorName.toLowerCase().includes('job work') ||
                    batch.batch_number?.startsWith('FG-JW');
                  const spec = batch.size_micron || 'Standard';

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      {/* Product & Lot */}
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[210px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs whitespace-nowrap">
                            {batch.products?.name || 'Finished Product'}
                          </span>
                          {isJobWork && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0 whitespace-nowrap">
                              Job Work
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 font-normal mt-0.5 whitespace-nowrap select-all">
                          Lot: {batch.batch_number}
                        </div>
                      </td>

                      {/* Size & Micron */}
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[160px]">
                        <button
                          onClick={() => setSelectedSpec(spec)}
                          className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-2xs whitespace-nowrap"
                          title="Click to filter by this size & micron"
                        >
                          <Ruler className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{spec}</span>
                        </button>
                      </td>

                      {/* Production Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[120px] text-slate-600 dark:text-slate-300">
                        {new Date(batch.created_at).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Operator / Vendor */}
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[190px] text-slate-700 dark:text-slate-300">
                        {isJobWork ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs whitespace-nowrap">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span>{operatorName || 'Job Work Vendor'}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 pl-1 whitespace-nowrap">
                              Outsourced Processing
                            </span>
                          </div>
                        ) : operatorName ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap">
                            <User className="w-3 h-3 text-brand-500 shrink-0" />
                            {operatorName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Quantities */}
                      <td className="px-4 py-3.5 text-right font-mono min-w-[95px] whitespace-nowrap">
                        {batch.quantity_produced_kg || batch.quantity_on_hand_kg} kg
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white min-w-[95px] whitespace-nowrap">
                        {batch.quantity_on_hand_kg} kg
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-500 min-w-[95px] whitespace-nowrap">
                        {batch.quantity_dispatched_kg || 0} kg
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center min-w-[105px] whitespace-nowrap">
                        <Badge variant={batch.status === 'in_stock' ? 'success' : 'neutral'}>
                          {batch.status}
                        </Badge>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap min-w-[170px] pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {Number(batch.quantity_on_hand_kg) > 0 && (
                            <Link
                              to={`/dispatch?batchId=${batch.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-300 dark:border-emerald-800/60 shrink-0 whitespace-nowrap shadow-2xs"
                              title="Direct Dispatch to Matching Order"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Dispatch</span>
                            </Link>
                          )}
                          <Link
                            to={`/traceability?batchId=${
                              batch.production_batch_id || batch.production_batches?.id || ''
                            }`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors border border-brand-500/20 shrink-0 whitespace-nowrap"
                            title="Trace Production Lineage"
                          >
                            <GitBranch className="w-3 h-3 shrink-0" />
                            <span>Trace</span>
                          </Link>
                        </div>
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
