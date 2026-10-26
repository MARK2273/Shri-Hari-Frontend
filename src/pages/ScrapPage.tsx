import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  Recycle,
  Trash2,
  TrendingUp,
  Plus,
  DollarSign,
  Calendar,
  Truck,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Scale,
  Building2,
  Package,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  Phone,
  MapPin,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatNumber } from '../utils/format';
import { ScrapSummary, ScrapEntry, ScrapSale } from '../types';

export const ScrapPage: React.FC = () => {
  const [summary, setSummary] = useState<ScrapSummary | null>(null);
  const [entries, setEntries] = useState<ScrapEntry[]>([]);
  const [sales, setSales] = useState<ScrapSale[]>([]);
  const [productionBatches, setProductionBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'entries' | 'breakdown'>('sales');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal 1: Sell Scrap to Vendor
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [sellForm, setSellForm] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerAddress: '',
    scrapType: 'Mixed LDPE / LLDPE Film Scrap',
    quantityKg: '' as number | '',
    ratePerKg: '' as number | '',
    paymentMode: 'cash' as 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'pending',
    paymentStatus: 'received' as 'received' | 'pending' | 'partial',
    vehicleNumber: '',
    driverName: '',
    gatePassNumber: '',
    notes: '',
    saleDate: new Date().toISOString().split('T')[0],
  });

  // Modal 2: Log On-Floor Scrap Inward
  const [isLogScrapModalOpen, setIsLogScrapModalOpen] = useState(false);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [logForm, setLogForm] = useState({
    quantityKg: '' as number | '',
    scrapType: 'Extrusion Trim Waste',
    sourceType: 'manual_sweep',
    productionBatchId: '',
    notes: '',
    entryDate: new Date().toISOString().split('T')[0],
  });

  // Modal 3: View / Print Invoice & Gate Pass Receipt
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<ScrapSale | null>(null);

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, entRes, salRes, batRes] = await Promise.all([
        api.get('/scrap/summary'),
        api.get('/scrap/entries'),
        api.get('/scrap/sales'),
        api.get('/production/batches').catch(() => ({ data: { batches: [] } })),
      ]);

      setSummary(sumRes.data.summary || null);
      setEntries(entRes.data.entries || []);
      setSales(salRes.data.sales || []);
      setProductionBatches(batRes.data.batches || []);
    } catch (err) {
      console.error('Failed to load scrap management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onFloorKg = summary?.on_floor_scrap_kg || 0;

  // Open Sell Modal with preset
  const handleOpenSellModal = (presetAll = false) => {
    setSaleError(null);
    setSellForm({
      buyerName: '',
      buyerPhone: '',
      buyerAddress: '',
      scrapType: 'Mixed LDPE / LLDPE Film Scrap',
      quantityKg: presetAll ? onFloorKg : (onFloorKg > 0 ? Math.min(100, onFloorKg) : ''),
      ratePerKg: 38.00,
      paymentMode: 'cash',
      paymentStatus: 'received',
      vehicleNumber: '',
      driverName: '',
      gatePassNumber: `GP-${Date.now().toString().slice(-5)}`,
      notes: '',
      saleDate: new Date().toISOString().split('T')[0],
    });
    setIsSellModalOpen(true);
  };

  // Submit Sell Scrap
  const handleConfirmSellScrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellForm.buyerName.trim()) {
      setSaleError('Please enter the third-party buyer or recycling vendor name.');
      return;
    }
    const qty = Number(sellForm.quantityKg);
    if (!qty || qty <= 0) {
      setSaleError('Quantity sold must be greater than 0 kg.');
      return;
    }
    if (qty > onFloorKg) {
      setSaleError(`Cannot sell ${qty} kg: only ${onFloorKg} kg of scrap is currently available on the factory floor.`);
      return;
    }
    const rate = Number(sellForm.ratePerKg);
    if (!rate || rate <= 0) {
      setSaleError('Selling rate per kg must be greater than 0.');
      return;
    }

    setIsSubmittingSale(true);
    setSaleError(null);
    try {
      const res = await api.post('/scrap/sales', {
        buyerName: sellForm.buyerName.trim(),
        buyerPhone: sellForm.buyerPhone.trim() || undefined,
        buyerAddress: sellForm.buyerAddress.trim() || undefined,
        scrapType: sellForm.scrapType,
        quantityKg: qty,
        ratePerKg: rate,
        paymentMode: sellForm.paymentMode,
        paymentStatus: sellForm.paymentStatus,
        vehicleNumber: sellForm.vehicleNumber.trim() || undefined,
        driverName: sellForm.driverName.trim() || undefined,
        gatePassNumber: sellForm.gatePassNumber.trim() || undefined,
        notes: sellForm.notes.trim() || undefined,
        saleDate: sellForm.saleDate,
      });

      setIsSellModalOpen(false);
      await fetchData();
      if (res.data?.sale) {
        setSelectedSaleForReceipt(res.data.sale);
      }
    } catch (err: any) {
      setSaleError(err.response?.data?.message || 'Failed to record scrap sale.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Submit Log Scrap Inward
  const handleConfirmLogScrap = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(logForm.quantityKg);
    if (!qty || qty <= 0) {
      setEntryError('Quantity must be greater than 0 kg.');
      return;
    }

    setIsSubmittingEntry(true);
    setEntryError(null);
    try {
      await api.post('/scrap/entries', {
        quantityKg: qty,
        scrapType: logForm.scrapType,
        sourceType: logForm.sourceType,
        productionBatchId: logForm.productionBatchId || undefined,
        notes: logForm.notes.trim() || undefined,
        entryDate: logForm.entryDate,
      });

      setIsLogScrapModalOpen(false);
      setLogForm({
        quantityKg: '',
        scrapType: 'Extrusion Trim Waste',
        sourceType: 'manual_sweep',
        productionBatchId: '',
        notes: '',
        entryDate: new Date().toISOString().split('T')[0],
      });
      await fetchData();
    } catch (err: any) {
      setEntryError(err.response?.data?.message || 'Failed to log scrap entry.');
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // Cancel / Delete Sale
  const handleDeleteSale = async (sale: ScrapSale) => {
    if (!window.confirm(`Are you sure you want to cancel scrap sale ${sale.sale_number}? ${sale.quantity_kg} kg will be restored back to the on-floor inventory.`)) {
      return;
    }
    try {
      await api.delete(`/scrap/sales/${sale.id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel scrap sale.');
    }
  };

  // Computed total for modal
  const calculatedTotalAmount = useMemo(() => {
    const q = Number(sellForm.quantityKg) || 0;
    const r = Number(sellForm.ratePerKg) || 0;
    return Number((q * r).toFixed(2));
  }, [sellForm.quantityKg, sellForm.ratePerKg]);

  const remainingAfterSale = useMemo(() => {
    const q = Number(sellForm.quantityKg) || 0;
    return Math.max(0, Number((onFloorKg - q).toFixed(2)));
  }, [onFloorKg, sellForm.quantityKg]);

  // Filtered lists
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return sales;
    const q = searchQuery.toLowerCase();
    return sales.filter(
      (s) =>
        s.buyer_name?.toLowerCase().includes(q) ||
        s.sale_number?.toLowerCase().includes(q) ||
        s.vehicle_number?.toLowerCase().includes(q) ||
        s.scrap_type?.toLowerCase().includes(q)
    );
  }, [sales, searchQuery]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.entry_number?.toLowerCase().includes(q) ||
        e.scrap_type?.toLowerCase().includes(q) ||
        e.source_type?.toLowerCase().includes(q) ||
        e.production_batches?.batch_number?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Scrap & Waste Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track factory floor scrap generation, maintain inventory, and manage sales to third-party recycling vendors.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEntryError(null);
              setIsLogScrapModalOpen(true);
            }}
            className="flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Log Inward Scrap</span>
          </Button>

          <button
            type="button"
            onClick={() => handleOpenSellModal(false)}
            disabled={onFloorKg <= 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl text-white transition-all shadow-md active:scale-95 ${
              onFloorKg > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sell Scrap to Vendor</span>
            {onFloorKg > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/25 text-white font-mono font-extrabold">
                {formatNumber(onFloorKg)} kg
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: On-Floor Scrap Stock (Prominent Hero Card) */}
        <div
          className={`relative overflow-hidden p-5 rounded-2xl border transition-all ${
            onFloorKg > 0
              ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30 dark:border-emerald-500/20 shadow-sm'
              : 'bg-slate-50 dark:bg-factory-800/40 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              On-Floor Scrap Stock
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                onFloorKg > 0
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono tracking-tight ${
                onFloorKg > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {formatNumber(onFloorKg)}
            </span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">kg</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {onFloorKg > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Available for Vendor
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Floor cleared (0 kg)
              </span>
            )}
            {onFloorKg > 0 && (
              <button
                type="button"
                onClick={() => handleOpenSellModal(true)}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Clear all →
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Total Scrap Generated */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Scrap Generated
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {formatNumber(summary?.total_generated_kg || 0)}
            </span>
            <span className="text-xs font-semibold text-slate-400">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {summary?.entries_count || 0} batch outputs & floor sweeps
          </span>
        </div>

        {/* Card 3: Total Scrap Sold */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Scrap Sold
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {formatNumber(summary?.total_sold_kg || 0)}
            </span>
            <span className="text-xs font-semibold text-slate-400">kg</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Dispatched to third-party recyclers
          </span>
        </div>

        {/* Card 4: Total Revenue from Scrap */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Scrap Sales Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">₹</span>
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatNumber(summary?.total_sales_revenue || 0)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Cash & bank recoveries realized
          </span>
        </div>

        {/* Card 5: Average Selling Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Realized Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">₹</span>
            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {formatNumber(summary?.average_rate_per_kg || 0)}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ kg</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Across {summary?.sales_count || 0} vendor sales
          </span>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'sales'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-factory-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Vendor Sales Outward ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'entries'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-factory-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Inward Generation Ledger ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'breakdown'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-factory-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Scrap Categories & Analytics
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor, sale #, scrap..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* TAB 1: SCRAP SALES & DISPATCHES (VENDOR OUTWARD) */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-factory-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Scrap Sales & Third-Party Vendor Dispatches
              </h2>
              <p className="text-xs text-slate-500">
                Outward register of scrap sold and dispatched to recyclers.
              </p>
            </div>
            {onFloorKg > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleOpenSellModal(false)}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sell On-Floor Scrap ({formatNumber(onFloorKg)} kg)</span>
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-factory-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sale Ref & Date</th>
                  <th className="py-3 px-4">Third-Party Buyer</th>
                  <th className="py-3 px-4">Scrap Category</th>
                  <th className="py-3 px-4 text-right">Quantity (kg)</th>
                  <th className="py-3 px-4 text-right">Rate (₹/kg)</th>
                  <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4">Gate Pass / Vehicle</th>
                  <th className="py-3 px-4 text-right">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Recycle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold">No scrap sales recorded yet.</p>
                      <p className="text-xs mt-0.5">
                        {onFloorKg > 0
                          ? `You currently have ${formatNumber(onFloorKg)} kg of scrap available on floor to sell.`
                          : 'Produce batches or log scrap to begin selling.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-factory-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold font-mono text-slate-900 dark:text-white block">
                          {sale.sale_number}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {sale.sale_date}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          {sale.buyer_name}
                        </span>
                        {sale.buyer_phone && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {sale.buyer_phone}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-factory-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {sale.scrap_type || 'Mixed Scrap'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatNumber(sale.quantity_kg)} kg
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        ₹{Number(sale.rate_per_kg).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{formatNumber(sale.total_amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={
                              sale.payment_status === 'received'
                                ? 'success'
                                : sale.payment_status === 'partial'
                                ? 'warning'
                                : 'neutral'
                            }
                            className="capitalize text-[10px]"
                          >
                            {sale.payment_status}
                          </Badge>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {sale.payment_mode}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {sale.vehicle_number ? (
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                            {sale.vehicle_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct Handover</span>
                        )}
                        {sale.gate_pass_number && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Pass: {sale.gate_pass_number}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-factory-700 transition-colors"
                            title="View / Print Scrap Sale Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(sale)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Cancel Sale (Restore to On-Floor Stock)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INWARD SCRAP GENERATION LEDGER */}
      {activeTab === 'entries' && (
        <div className="bg-white dark:bg-factory-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Inward Scrap Generation Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Detailed record of all scrap generated from production batch outputs, trim losses, and floor sweeps.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEntryError(null);
                setIsLogScrapModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 text-brand-600" />
              <span>Log Manual Scrap</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-factory-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Entry Ref & Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Production Batch / Link</th>
                  <th className="py-3 px-4">Scrap Category</th>
                  <th className="py-3 px-4 text-right">Quantity (kg)</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold">No scrap generation entries logged yet.</p>
                      <p className="text-xs mt-0.5">
                        Production batch waste and manual floor sweeps will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-factory-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold font-mono text-slate-900 dark:text-white block">
                          {entry.entry_number}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {entry.entry_date}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-factory-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {entry.source_type?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold">
                        {entry.production_batches?.batch_number ? (
                          <span className="text-brand-600 dark:text-brand-400 font-bold">
                            {entry.production_batches.batch_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Floor Sweep / General</span>
                        )}
                        {entry.products?.name && (
                          <span className="text-[10px] text-slate-400 block font-sans">
                            {entry.products.name}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {entry.scrap_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        +{formatNumber(entry.quantity_kg)} kg
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {entry.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SCRAP CATEGORIES & ANALYTICS */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(summary?.scrap_by_type || {}).map(([type, kg]) => (
              <div
                key={type}
                className="p-5 rounded-2xl bg-white dark:bg-factory-800 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{type}</span>
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Recycle className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {formatNumber(kg)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">kg accumulated</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-factory-900 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, ((kg / (summary?.total_generated_kg || 1)) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {((kg / (summary?.total_generated_kg || 1)) * 100).toFixed(1)}% of total factory waste
                </span>
              </div>
            ))}

            {Object.keys(summary?.scrap_by_type || {}).length === 0 && (
              <div className="col-span-3 p-12 text-center bg-white dark:bg-factory-800 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                <Recycle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="font-bold">No scrap categorized yet.</p>
                <p className="text-xs mt-1">Categories will populate automatically as waste is recorded.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SELL SCRAP TO THIRD-PARTY VENDOR */}
      <Modal
        isOpen={isSellModalOpen}
        onClose={() => {
          if (!isSubmittingSale) setIsSellModalOpen(false);
        }}
        title="Sell Scrap to Third-Party Vendor"
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmSellScrap} className="space-y-4">
          {/* On-Floor Scrap Status Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Current On-Floor Scrap Stock
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                  {formatNumber(onFloorKg)}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">kg available</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSellForm((prev) => ({
                  ...prev,
                  quantityKg: onFloorKg,
                }));
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sell All ({formatNumber(onFloorKg)} kg)</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Third-Party Buyer / Vendor Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gujarat Plastic Recyclers, Royal Scrap Traders"
                value={sellForm.buyerName}
                onChange={(e) => setSellForm({ ...sellForm, buyerName: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Buyer Phone / Contact
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={sellForm.buyerPhone}
                onChange={(e) => setSellForm({ ...sellForm, buyerPhone: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Buyer Location / Address
              </label>
              <input
                type="text"
                placeholder="GIDC, Ahmedabad"
                value={sellForm.buyerAddress}
                onChange={(e) => setSellForm({ ...sellForm, buyerAddress: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scrap Category *
              </label>
              <select
                value={sellForm.scrapType}
                onChange={(e) => setSellForm({ ...sellForm, scrapType: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              >
                <option value="Mixed LDPE / LLDPE Film Scrap">Mixed LDPE / LLDPE Film Scrap</option>
                <option value="Extrusion Trim Waste">Extrusion Trim Waste</option>
                <option value="Plant Start-up Purge / Lumps">Plant Start-up Purge / Lumps</option>
                <option value="Color Change Scrap">Color Change Scrap</option>
                <option value="Rejected Rolls & Quality Waste">Rejected Rolls & Quality Waste</option>
                <option value="General Factory Scrap">General Factory Scrap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sale Date *
              </label>
              <input
                type="date"
                required
                value={sellForm.saleDate}
                onChange={(e) => setSellForm({ ...sellForm, saleDate: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Quantity Sold & Rate */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantity Sold (kg) * (Max {formatNumber(onFloorKg)} kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max={onFloorKg}
                required
                placeholder="e.g. 100"
                value={sellForm.quantityKg}
                onChange={(e) =>
                  setSellForm({
                    ...sellForm,
                    quantityKg: e.target.value === '' ? '' : parseFloat(e.target.value),
                  })
                }
                className="w-full text-sm font-mono font-bold px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Selling Rate (₹ / kg) *
              </label>
              <input
                type="number"
                step="0.10"
                min="0.1"
                required
                placeholder="e.g. 38.00"
                value={sellForm.ratePerKg}
                onChange={(e) =>
                  setSellForm({
                    ...sellForm,
                    ratePerKg: e.target.value === '' ? '' : parseFloat(e.target.value),
                  })
                }
                className="w-full text-sm font-mono font-bold px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Payment & Transport */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={sellForm.paymentMode}
                onChange={(e: any) => setSellForm({ ...sellForm, paymentMode: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              >
                <option value="cash">Cash in Hand</option>
                <option value="upi">UPI / Instant Transfer</option>
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Cheque</option>
                <option value="pending">Credit / Payment Due</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                value={sellForm.paymentStatus}
                onChange={(e: any) => setSellForm({ ...sellForm, paymentStatus: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              >
                <option value="received">Payment Received (Paid)</option>
                <option value="pending">Payment Pending</option>
                <option value="partial">Partially Received</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                placeholder="GJ-01-AB-1234"
                value={sellForm.vehicleNumber}
                onChange={(e) => setSellForm({ ...sellForm, vehicleNumber: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gate Pass Number
              </label>
              <input
                type="text"
                placeholder="GP-SCRAP-001"
                value={sellForm.gatePassNumber}
                onChange={(e) => setSellForm({ ...sellForm, gatePassNumber: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Value Calculation Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-factory-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Invoice Amount:</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{formatNumber(calculatedTotalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Remaining On-Floor Scrap after Sale:</span>
              <span
                className={`font-mono font-bold ${
                  remainingAfterSale === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {formatNumber(remainingAfterSale)} kg {remainingAfterSale === 0 && '(Floor Cleared to Zero)'}
              </span>
            </div>
          </div>

          {saleError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saleError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmittingSale}
              onClick={() => setIsSellModalOpen(false)}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isSubmittingSale || !sellForm.quantityKg || Number(sellForm.quantityKg) <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <TrendingUp className="w-4 h-4" />
              <span>
                {isSubmittingSale ? 'Processing...' : `Confirm Sale (${formatNumber(Number(sellForm.quantityKg) || 0)} kg)`}
              </span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: LOG ON-FLOOR SCRAP (INWARD) */}
      <Modal
        isOpen={isLogScrapModalOpen}
        onClose={() => {
          if (!isSubmittingEntry) setIsLogScrapModalOpen(false);
        }}
        title="Log Inward Scrap to Factory Floor"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmLogScrap} className="space-y-4">
          <p className="text-xs text-slate-500">
            Record manual factory floor trim, setup rolls, purge lumps, or quality reject scrap into the on-floor inventory.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scrap Quantity (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="e.g. 100"
                value={logForm.quantityKg}
                onChange={(e) =>
                  setLogForm({
                    ...logForm,
                    quantityKg: e.target.value === '' ? '' : parseFloat(e.target.value),
                  })
                }
                className="w-full text-sm font-mono font-bold px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scrap Category *
                </label>
                <select
                  value={logForm.scrapType}
                  onChange={(e) => setLogForm({ ...logForm, scrapType: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="Extrusion Trim Waste">Extrusion Trim Waste</option>
                  <option value="Plant Start-up Purge / Lumps">Plant Start-up Purge / Lumps</option>
                  <option value="Color Change Scrap">Color Change Scrap</option>
                  <option value="Rejected Film Rolls">Rejected Film Rolls</option>
                  <option value="Floor Sweep Scrap">Floor Sweep Scrap</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Source Type
                </label>
                <select
                  value={logForm.sourceType}
                  onChange={(e) => setLogForm({ ...logForm, sourceType: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="manual_sweep">Floor Sweep / Clean-up</option>
                  <option value="trim_waste">Extruder Trim Loss</option>
                  <option value="plant_waste">Start-up & Plant Purge</option>
                  <option value="quality_reject">Quality Control Reject</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link to Production Batch (Optional)
              </label>
              <select
                value={logForm.productionBatchId}
                onChange={(e) => setLogForm({ ...logForm, productionBatchId: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
              >
                <option value="">-- No specific batch --</option>
                {productionBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} {b.products?.name ? `(${b.products.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Reason or source notes..."
                value={logForm.notes}
                onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                className="w-full text-xs p-3 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {entryError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{entryError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmittingEntry}
              onClick={() => setIsLogScrapModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingEntry || !logForm.quantityKg || Number(logForm.quantityKg) <= 0}
            >
              {isSubmittingEntry ? 'Saving...' : 'Add to On-Floor Scrap'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VIEW & PRINT SCRAP SALE INVOICE / RECEIPT */}
      <Modal
        isOpen={Boolean(selectedSaleForReceipt)}
        onClose={() => setSelectedSaleForReceipt(null)}
        title="Scrap Sale Invoice & Gate Pass Receipt"
        maxWidth="lg"
      >
        {selectedSaleForReceipt && (
          <div className="space-y-6 text-slate-900 dark:text-white">
            {/* Printable Area */}
            <div className="p-6 bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 print:border-none print:shadow-none">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    SHRI HARI PACKAGING
                  </h3>
                  <p className="text-xs text-slate-500">
                    Industrial Film Manufacturing & Quality Packaging Solutions
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Factory & Warehouse Gate Outward Slip
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono text-xs font-bold">
                    SCRAP SALE SLIP
                  </span>
                  <span className="block font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedSaleForReceipt.sale_number}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Date: {selectedSaleForReceipt.sale_date}
                  </span>
                </div>
              </div>

              {/* Vendor & Transport Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Buyer / Scrap Recycler
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    {selectedSaleForReceipt.buyer_name}
                  </span>
                  {selectedSaleForReceipt.buyer_phone && (
                    <span className="text-slate-600 dark:text-slate-400 block">
                      Phone: {selectedSaleForReceipt.buyer_phone}
                    </span>
                  )}
                  {selectedSaleForReceipt.buyer_address && (
                    <span className="text-slate-500 block">
                      Address: {selectedSaleForReceipt.buyer_address}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Gate Pass & Dispatch Info
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                    Pass #: {selectedSaleForReceipt.gate_pass_number || 'GP-STANDARD'}
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 block">
                    Vehicle #: {selectedSaleForReceipt.vehicle_number || 'Factory Outward'}
                  </span>
                  <span className="capitalize text-slate-500 block">
                    Payment: {selectedSaleForReceipt.payment_mode} ({selectedSaleForReceipt.payment_status})
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-factory-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Weight (kg)</th>
                      <th className="py-2.5 px-3 text-right">Rate (₹/kg)</th>
                      <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3 px-3 font-semibold">
                        {selectedSaleForReceipt.scrap_type || 'Mixed Plastic Scrap'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {formatNumber(selectedSaleForReceipt.quantity_kg)} kg
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        ₹{Number(selectedSaleForReceipt.rate_per_kg).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{formatNumber(selectedSaleForReceipt.total_amount)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50/80 dark:bg-factory-800/80 font-bold border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right text-slate-500 uppercase text-[11px]">
                        Net Payable Realized:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                        ₹{formatNumber(selectedSaleForReceipt.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-[11px] text-slate-500 text-center">
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1.5">
                  Authorized Signatory
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1.5">
                  Weighbridge / Security Officer
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1.5">
                  Vendor / Receiver Signature
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSaleForReceipt(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt / Gate Pass</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default ScrapPage;
