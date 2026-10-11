import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Layers, Plus, Filter, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeBatchToAdjust, setActiveBatchToAdjust] = useState<any>(null);

  // Form states for Receive Batch
  const [receiveForm, setReceiveForm] = useState({
    materialId: '',
    batchNumber: '',
    supplierLotNumber: '',
    receiptDate: new Date().toISOString().split('T')[0],
    receivedQuantityKg: 1000,
    costPerKg: 110,
    notes: '',
  });

  // Form state for Adjust Stock
  const [adjustForm, setAdjustForm] = useState({
    adjustmentQuantityKg: 0,
    reason: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [matRes, batchRes] = await Promise.all([
        api.get('/materials'),
        api.get('/materials/batches'),
      ]);
      setMaterials(matRes.data.materials || []);
      setBatches(batchRes.data.batches || []);
      if (matRes.data.materials?.length > 0 && !receiveForm.materialId) {
        setReceiveForm((prev) => ({ ...prev, materialId: matRes.data.materials[0].id }));
      }
    } catch (err) {
      console.error('Failed to load materials/batches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/materials/batches/receive', receiveForm);
      setIsReceiveModalOpen(false);
      setReceiveForm({
        materialId: materials[0]?.id || '',
        batchNumber: '',
        supplierLotNumber: '',
        receiptDate: new Date().toISOString().split('T')[0],
        receivedQuantityKg: 1000,
        costPerKg: 110,
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to receive batch');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatchToAdjust) return;
    try {
      await api.post(`/materials/batches/${activeBatchToAdjust.id}/adjust`, adjustForm);
      setIsAdjustModalOpen(false);
      setAdjustForm({ adjustmentQuantityKg: 0, reason: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const filteredBatches =
    selectedMaterial === 'all'
      ? batches
      : batches.filter((b) => b.material_id === selectedMaterial);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-500" />
            Raw Material & Batch Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            10 standard plastic grades (Type A - J) with FIFO lot-level tracking (INV-01..INV-12)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReceiveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Receive Material Batch
          </button>
        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {materials.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedMaterial(selectedMaterial === m.id ? 'all' : m.id)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedMaterial === m.id
                ? 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                : 'bg-white dark:bg-factory-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {m.code}
              </span>
              {m.is_low_stock ? (
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" /> Low
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3" /> OK
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={m.name}>
              {m.name}
            </h4>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                {m.total_stock_kg || 0}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">/ Min: {m.min_stock_level_kg} kg</span>
            </div>
          </div>
        ))}
      </div>

      {/* Batches Table Section */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Individual Material Lots / Batches ({filteredBatches.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Sorted by FIFO receipt date. Quantities update atomically during production consumption.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Material Types</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              <tr>
                <th className="py-2.5">Batch Number</th>
                <th className="py-2.5">Material</th>
                <th className="py-2.5">Supplier / Lot #</th>
                <th className="py-2.5">Receipt Date</th>
                <th className="py-2.5">Received (kg)</th>
                <th className="py-2.5">Remaining (kg)</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredBatches.map((b, index) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                  <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                    {b.batch_number}
                    {index === 0 && b.status === 'available' && (
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        FIFO #1
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-slate-800 dark:text-slate-200">
                    {b.materials?.name || b.material_name}
                  </td>
                  <td className="py-3 text-slate-500">
                    {b.suppliers?.name || b.supplier_name || 'Direct'} /{' '}
                    <span className="font-mono">{b.supplier_lot_number || 'N/A'}</span>
                  </td>
                  <td className="py-3 text-slate-500">{b.receipt_date}</td>
                  <td className="py-3 font-mono">{b.received_quantity_kg}</td>
                  <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                    {b.remaining_quantity_kg}
                  </td>
                  <td className="py-3">
                    <Badge variant={b.status === 'available' ? 'success' : 'neutral'}>{b.status}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => {
                        setActiveBatchToAdjust(b);
                        setIsAdjustModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Receive Material Batch */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Raw Material Batch (Traceable Lot)"
        maxWidth="lg"
      >
        <form onSubmit={handleReceiveBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Plastic Material
            </label>
            <select
              required
              value={receiveForm.materialId}
              onChange={(e) => setReceiveForm({ ...receiveForm, materialId: e.target.value })}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Number (Internal)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MB-20261011-001"
                value={receiveForm.batchNumber}
                onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier Lot #
              </label>
              <input
                type="text"
                placeholder="e.g. RIL-HDPE-9920"
                value={receiveForm.supplierLotNumber}
                onChange={(e) => setReceiveForm({ ...receiveForm, supplierLotNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Received Weight (kg)
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={receiveForm.receivedQuantityKg}
                onChange={(e) =>
                  setReceiveForm({ ...receiveForm, receivedQuantityKg: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Date
              </label>
              <input
                type="date"
                required
                value={receiveForm.receiptDate}
                onChange={(e) => setReceiveForm({ ...receiveForm, receiptDate: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors"
            >
              Confirm Stock Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Batch Stock */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock for Batch: ${activeBatchToAdjust?.batch_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <p className="text-xs text-slate-500">
            Current balance: <strong>{activeBatchToAdjust?.remaining_quantity_kg} kg</strong>. Enter positive to
            add or negative to write off.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quantity Adjustment (kg)
            </label>
            <input
              type="number"
              step="0.001"
              required
              value={adjustForm.adjustmentQuantityKg}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, adjustmentQuantityKg: parseFloat(e.target.value) || 0 })
              }
              placeholder="-5 or +10"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Authorization Note (INV-11)
            </label>
            <textarea
              required
              rows={3}
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              placeholder="e.g. Moisture evaporation variance or pallet recount verified by supervisor"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors"
            >
              Apply Audited Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
