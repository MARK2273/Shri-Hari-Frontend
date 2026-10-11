import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Factory, Plus, Play, CheckCircle2, AlertCircle, ArrowRight, Layers } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ProductionPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rawBatches, setRawBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal 1: Create Draft Production Batch
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftForm, setDraftForm] = useState({
    orderId: '',
    orderItemId: '',
    recipeId: '',
    plannedQuantityKg: 200,
    notes: '',
  });

  // Modal 2: Confirm Production Batch Execution
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedBatchToConfirm, setSelectedBatchToConfirm] = useState<any>(null);
  const [confirmForm, setConfirmForm] = useState<{
    consumption: Array<{
      materialId: string;
      materialName: string;
      materialBatchId: string;
      plannedQuantityKg: number;
      actualQuantityKg: number;
    }>;
    acceptedOutputKg: number;
    wasteKg: number;
    rejectedKg: number;
  }>({
    consumption: [],
    acceptedOutputKg: 194,
    wasteKg: 6,
    rejectedKg: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, ordRes, prdRes, rawRes] = await Promise.all([
        api.get('/production'),
        api.get('/orders'),
        api.get('/products'),
        api.get('/materials/batches?status=available'),
      ]);

      setBatches(prodRes.data.batches || []);
      setOrders(ordRes.data.orders || []);
      setProducts(prdRes.data.products || []);
      setRawBatches(rawRes.data.batches || []);

      if (ordRes.data.orders?.length > 0) {
        const firstOrd = ordRes.data.orders[0];
        const firstItem = firstOrd.customer_order_items?.[0] || {};
        const matchedProd = prdRes.data.products?.find((p: any) => p.id === firstItem.product_id);

        setDraftForm((prev) => ({
          ...prev,
          orderId: firstOrd.id,
          orderItemId: firstItem.id || '',
          recipeId: matchedProd?.active_recipe?.id || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load production data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartDraftBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production', draftForm);
      setIsDraftModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start batch');
    }
  };

  const openConfirmModal = (batch: any) => {
    setSelectedBatchToConfirm(batch);
    // Find recipe items
    const prod = products.find((p) => p.id === batch.product_id);
    const recipeItems = prod?.active_recipe?.product_recipe_items || prod?.active_recipe?.items || [];

    const defaultConsumption = recipeItems.map((item: any) => {
      const plannedKg = Number(batch.planned_quantity_kg) * Number(item.planned_kg_per_kg_output);
      // Auto-suggest first FIFO available batch of this material
      const availableLot = rawBatches.find((b) => b.material_id === item.material_id);
      return {
        materialId: item.material_id,
        materialName: item.materials?.name || item.material_name,
        materialBatchId: availableLot?.id || '',
        plannedQuantityKg: plannedKg,
        actualQuantityKg: plannedKg,
      };
    });

    setConfirmForm({
      consumption: defaultConsumption,
      acceptedOutputKg: Number(batch.planned_quantity_kg) * 0.97,
      wasteKg: Number(batch.planned_quantity_kg) * 0.03,
      rejectedKg: 0,
    });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchToConfirm) return;

    try {
      await api.post(`/production/${selectedBatchToConfirm.id}/confirm`, {
        consumption: confirmForm.consumption.map((c) => ({
          materialId: c.materialId,
          materialBatchId: c.materialBatchId,
          plannedQuantityKg: c.plannedQuantityKg,
          actualQuantityKg: c.actualQuantityKg,
        })),
        acceptedOutputKg: confirmForm.acceptedOutputKg,
        wasteKg: confirmForm.wasteKg,
        rejectedKg: confirmForm.rejectedKg,
      });

      setIsConfirmModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm production run');
    }
  };

  const totalInputKg = confirmForm.consumption.reduce((s, c) => s + (Number(c.actualQuantityKg) || 0), 0);
  const totalAccountedOutputKg =
    Number(confirmForm.acceptedOutputKg || 0) +
    Number(confirmForm.wasteKg || 0) +
    Number(confirmForm.rejectedKg || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Factory className="w-6 h-6 text-brand-500" />
            Production Batches & Recipe Execution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Order-linked batch manufacturing with lot-by-lot raw plastic consumption & finished goods generation (PRO-01..PRO-13)
          </p>
        </div>
        <button
          onClick={() => setIsDraftModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Launch Production Batch
        </button>
      </div>

      {/* Production Batches Table */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              <tr>
                <th className="py-2.5">Batch #</th>
                <th className="py-2.5">Linked Order</th>
                <th className="py-2.5">Finished Product</th>
                <th className="py-2.5">Planned (kg)</th>
                <th className="py-2.5">Actual Input (kg)</th>
                <th className="py-2.5">Accepted (kg)</th>
                <th className="py-2.5">Waste (kg)</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                  <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {batch.batch_number}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300 font-mono">
                    {batch.customer_orders?.order_number || batch.order_number}
                  </td>
                  <td className="py-3 text-slate-800 dark:text-slate-200">
                    {batch.products?.name || batch.product_name}
                  </td>
                  <td className="py-3 font-mono">{batch.planned_quantity_kg} kg</td>
                  <td className="py-3 font-mono">{batch.actual_input_kg || 0} kg</td>
                  <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {batch.accepted_output_kg || 0} kg
                  </td>
                  <td className="py-3 font-mono text-rose-500">{batch.waste_kg || 0} kg</td>
                  <td className="py-3">
                    <Badge variant={batch.status === 'completed' ? 'success' : 'info'}>
                      {batch.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    {batch.status !== 'completed' ? (
                      <button
                        onClick={() => openConfirmModal(batch)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm transition-colors ml-auto"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Execute & Stock
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Stocked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Launch Draft Batch */}
      <Modal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        title="Launch Production Batch (Order-Driven)"
        maxWidth="lg"
      >
        <form onSubmit={handleStartDraftBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer Order (ORD-04)
            </label>
            <select
              required
              value={draftForm.orderId}
              onChange={(e) => {
                const ord = orders.find((o) => o.id === e.target.value);
                const item = ord?.customer_order_items?.[0] || {};
                const prod = products.find((p) => p.id === item.product_id);
                setDraftForm({
                  ...draftForm,
                  orderId: e.target.value,
                  orderItemId: item.id || '',
                  recipeId: prod?.active_recipe?.id || '',
                  plannedQuantityKg: Number(item.requested_quantity_kg) || 200,
                });
              }}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} - {o.customers?.name || o.customer_name} ({o.total_requested_weight_kg} kg)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Planned Output (kg)
            </label>
            <input
              type="number"
              step="1"
              required
              value={draftForm.plannedQuantityKg}
              onChange={(e) =>
                setDraftForm({ ...draftForm, plannedQuantityKg: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDraftModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors"
            >
              Create Production Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Confirm Production Run & Atomic Stock Deductions (Section 5) */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`Execute Production Run: ${selectedBatchToConfirm?.batch_number}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleConfirmBatch} className="space-y-5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              Raw Material Lot Consumption (Lot-by-Lot Traceability PRO-05)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select the specific warehouse lots consumed and record actual kilograms used.
            </p>
          </div>

          <div className="space-y-3">
            {confirmForm.consumption.map((item, index) => {
              const availableLotsForMat = rawBatches.filter((b) => b.material_id === item.materialId);
              return (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {item.materialName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Planned: {item.plannedQuantityKg} kg
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Consumed From Batch Lot (FIFO)
                    </label>
                    <select
                      required
                      value={item.materialBatchId}
                      onChange={(e) => {
                        const newC = [...confirmForm.consumption];
                        newC[index].materialBatchId = e.target.value;
                        setConfirmForm({ ...confirmForm, consumption: newC });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                    >
                      {availableLotsForMat.map((lot) => (
                        <option key={lot.id} value={lot.id}>
                          {lot.batch_number} (Rem: {lot.remaining_quantity_kg} kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                      Actual Consumed (kg)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={item.actualQuantityKg}
                      onChange={(e) => {
                        const newC = [...confirmForm.consumption];
                        newC[index].actualQuantityKg = parseFloat(e.target.value) || 0;
                        setConfirmForm({ ...confirmForm, consumption: newC });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Outputs Section: Accepted Output, Waste & Rejection */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              Production Output Reconciliation (PRO-07)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  Accepted Finished Product (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={confirmForm.acceptedOutputKg}
                  onChange={(e) =>
                    setConfirmForm({ ...confirmForm, acceptedOutputKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                  Waste / Trim Scrap (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={confirmForm.wasteKg}
                  onChange={(e) =>
                    setConfirmForm({ ...confirmForm, wasteKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-rose-500 mb-1">
                  Rejected Output (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={confirmForm.rejectedKg}
                  onChange={(e) =>
                    setConfirmForm({ ...confirmForm, rejectedKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-rose-500"
                />
              </div>
            </div>

            {/* Mass balance indicator */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Total Material Input: <strong className="font-mono text-slate-800 dark:text-slate-200">{totalInputKg} kg</strong>
              </span>
              <span className="text-slate-500">
                Accounted Output: <strong className="font-mono text-slate-800 dark:text-slate-200">{totalAccountedOutputKg} kg</strong>
              </span>
              <span
                className={`font-bold font-mono ${
                  Math.abs(totalInputKg - totalAccountedOutputKg) < 0.01 ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                Variance: {(totalAccountedOutputKg - totalInputKg).toFixed(2)} kg
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors"
            >
              Confirm Production & Update Finished Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
