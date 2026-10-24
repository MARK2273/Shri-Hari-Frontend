import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Factory, Plus, Play, CheckCircle2, AlertCircle, ArrowRight, Layers } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { Link } from 'react-router-dom';

export const ProductionPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rawBatches, setRawBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    trimWasteKg: number;
    plantWasteKg: number;
    wasteKg: number;
    rejectedKg: number;
  }>({
    consumption: [],
    acceptedOutputKg: 0,
    trimWasteKg: 0,
    plantWasteKg: 0,
    wasteKg: 0,
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

  const openDraftModal = () => {
    if (orders.length > 0) {
      const selectedOrd = orders.find((o) => o.id === draftForm.orderId) || orders[0];
      const item = selectedOrd?.customer_order_items?.[0] || {};
      const prod = products.find((p) => p.id === item.product_id);
      setDraftForm({
        orderId: selectedOrd.id,
        orderItemId: item.id || '',
        recipeId: prod?.active_recipe?.id || prod?.product_recipes?.[0]?.id || '',
        plannedQuantityKg: Number(item.requested_quantity_kg) || Number(selectedOrd.total_requested_weight_kg) || 200,
        notes: '',
      });
    }
    setIsDraftModalOpen(true);
  };

  const handleStartDraftBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftForm.orderId) {
      alert('Please select an active customer order first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const ord = orders.find((o) => o.id === draftForm.orderId);
      const item = ord?.customer_order_items?.[0] || {};
      const prod = products.find((p) => p.id === item.product_id);
      const recipeId = draftForm.recipeId || prod?.active_recipe?.id || prod?.product_recipes?.[0]?.id || '';
      const orderItemId = draftForm.orderItemId || item.id || '';

      await api.post('/production', {
        orderId: draftForm.orderId,
        orderItemId,
        recipeId,
        plannedQuantityKg: Number(draftForm.plannedQuantityKg),
        notes: draftForm.notes,
      });
      setIsDraftModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to start batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmModal = (batch: any) => {
    setSelectedBatchToConfirm(batch);
    // Find recipe items
    const prod = products.find((p) => p.id === batch.product_id);
    const recipeItems =
      prod?.active_recipe?.product_recipe_items ||
      prod?.active_recipe?.items ||
      prod?.product_recipes?.[0]?.product_recipe_items ||
      batch.product_recipes?.product_recipe_items ||
      [];

    const defaultConsumption = recipeItems.map((item: any) => {
      const plannedKg =
        Number(batch.planned_quantity_kg) *
        Number(item.planned_kg_per_kg_output || (Number(item.percentage) / 100) || 1);
      // Auto-suggest first FIFO available batch of this material
      const availableLot = rawBatches.find((b) => b.material_id === item.material_id);
      return {
        materialId: item.material_id,
        materialName: item.materials?.name || item.material_name || 'Material',
        materialBatchId: availableLot?.id || '',
        plannedQuantityKg: plannedKg,
        actualQuantityKg: plannedKg,
      };
    });

    if (defaultConsumption.length === 0 && rawBatches.length > 0) {
      defaultConsumption.push({
        materialId: rawBatches[0].material_id,
        materialName: rawBatches[0].materials?.name || 'Raw Material',
        materialBatchId: rawBatches[0].id,
        plannedQuantityKg: Number(batch.planned_quantity_kg),
        actualQuantityKg: Number(batch.planned_quantity_kg),
      });
    }

    const planned = Number(batch.planned_quantity_kg) || 0;

    setConfirmForm({
      consumption: defaultConsumption,
      acceptedOutputKg: planned,
      trimWasteKg: 0,
      plantWasteKg: 0,
      wasteKg: 0,
      rejectedKg: 0,
    });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchToConfirm) return;

    setIsSubmitting(true);
    try {
      const computedWaste = Number(((Number(confirmForm.trimWasteKg) || 0) + (Number(confirmForm.plantWasteKg) || 0)).toFixed(3));
      await api.post(`/production/${selectedBatchToConfirm.id}/confirm`, {
        consumption: confirmForm.consumption.map((c) => ({
          materialId: c.materialId,
          materialBatchId: c.materialBatchId,
          plannedQuantityKg: c.plannedQuantityKg,
          actualQuantityKg: c.actualQuantityKg,
        })),
        acceptedOutputKg: confirmForm.acceptedOutputKg,
        trimWasteKg: confirmForm.trimWasteKg,
        plantWasteKg: confirmForm.plantWasteKg,
        wasteKg: computedWaste,
        rejectedKg: confirmForm.rejectedKg,
      });

      setIsConfirmModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm production run');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalInputKg = confirmForm.consumption.reduce((s, c) => s + (Number(c.actualQuantityKg) || 0), 0);
  const totalWasteKg = Number(((Number(confirmForm.trimWasteKg) || 0) + (Number(confirmForm.plantWasteKg) || 0)).toFixed(3));
  const totalAccountedOutputKg =
    Number(confirmForm.acceptedOutputKg || 0) +
    totalWasteKg +
    Number(confirmForm.rejectedKg || 0);

  if (isLoading) {
    return <PageSkeleton type="table" />;
  }

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
          onClick={openDraftModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Launch Production Batch
        </button>
      </div>

      {/* Production Batches Table */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              <tr>
                <th className="py-2.5 whitespace-nowrap">Batch #</th>
                <th className="py-2.5 whitespace-nowrap">Linked Order</th>
                <th className="py-2.5 whitespace-nowrap">Finished Product</th>
                <th className="py-2.5 whitespace-nowrap">Planned (kg)</th>
                <th className="py-2.5 whitespace-nowrap">Actual Input (kg)</th>
                <th className="py-2.5 whitespace-nowrap">Accepted (kg)</th>
                <th className="py-2.5 whitespace-nowrap">Waste (kg)</th>
                <th className="py-2.5 whitespace-nowrap">Status</th>
                <th className="py-2.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No production batches recorded yet. Launch a batch from customer order demand.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
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
                    <td className="py-3 font-mono">
                      <div className="text-rose-500 font-bold">{batch.waste_kg || 0} kg</div>
                      {(Number(batch.trim_waste_kg) > 0 || Number(batch.plant_waste_kg) > 0) && (
                        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          Trim: {batch.trim_waste_kg || 0} | Plant: {batch.plant_waste_kg || 0}
                        </div>
                      )}
                    </td>
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
                ))
              )}
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
            {orders.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">No customer orders available</p>
                  <p className="text-[11px] opacity-85">You need to register at least one customer order before launching a production run.</p>
                </div>
                <Link
                  to="/orders"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs shrink-0 hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Create Order
                </Link>
              </div>
            ) : (
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
                className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="" disabled>-- Select an active customer order --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} - {o.customers?.name || o.customer_name} ({o.total_requested_weight_kg} kg)
                  </option>
                ))}
              </select>
            )}
          </div>

          {draftForm.orderId && (() => {
            const ord = orders.find((o) => o.id === draftForm.orderId);
            const item = ord?.customer_order_items?.[0] || {};
            const prod = products.find((p) => p.id === item.product_id);
            return (
              <div className="p-3 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                  <span>Product: {prod?.name || 'Selected Product'}</span>
                  <span className="font-mono text-brand-600 dark:text-brand-400">{prod?.code || ''}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Customer: {ord?.customers?.name || ord?.customer_name}</span>
                  <span>Order Quantity: {ord?.total_requested_weight_kg || item.requested_quantity_kg || 0} kg</span>
                </div>
                {prod?.active_recipe && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Active Formula: V{prod.active_recipe.version || 1}
                  </div>
                )}
              </div>
            );
          })()}

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
            <Button
              type="submit"
              disabled={orders.length === 0}
              isLoading={isSubmitting}
              loadingText="Creating Batch..."
            >
              Create Production Batch
            </Button>
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
                      {availableLotsForMat.length === 0 ? (
                        <option value="" disabled>No lots in stock (0 kg)</option>
                      ) : (
                        availableLotsForMat.map((lot) => (
                          <option key={lot.id} value={lot.id}>
                            {lot.batch_number} (Rem: {lot.remaining_quantity_kg} kg)
                          </option>
                        ))
                      )}
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

          {/* Outputs Section: Accepted Output, Waste (Trim & Plant) & Rejection */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                Production Output Reconciliation (PRO-07)
              </h4>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Total Waste: {totalWasteKg} kg
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  Accepted Product (kg)
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
                <span className="text-[9px] text-slate-400">Finished goods to stock</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                  Trim Waste (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={confirmForm.trimWasteKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setConfirmForm({
                      ...confirmForm,
                      trimWasteKg: val,
                      wasteKg: Number((val + (confirmForm.plantWasteKg || 0)).toFixed(3)),
                    });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-amber-600 dark:text-amber-400"
                  placeholder="0.000"
                />
                <span className="text-[9px] text-slate-400">Side trim & slitting scrap</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-1">
                  Plant Waste (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={confirmForm.plantWasteKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setConfirmForm({
                      ...confirmForm,
                      plantWasteKg: val,
                      wasteKg: Number(((confirmForm.trimWasteKg || 0) + val).toFixed(3)),
                    });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-orange-600 dark:text-orange-400"
                  placeholder="0.000"
                />
                <span className="text-[9px] text-slate-400">Purging, start-up & floor lumps</span>
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
                <span className="text-[9px] text-slate-400">Defective / out-of-spec goods</span>
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
                className={`font-bold font-mono ${Math.abs(totalInputKg - totalAccountedOutputKg) < 0.01 ? 'text-emerald-500' : 'text-amber-500'
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
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Confirming & Updating Finished Stock..."
              size="lg"
            >
              Confirm Production & Update Finished Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
