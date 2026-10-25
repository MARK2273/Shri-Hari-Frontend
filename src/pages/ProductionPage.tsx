import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Factory, Plus, Play, CheckCircle2, AlertCircle, ArrowRight, Layers, User, Edit2, GitBranch, Scissors, Check } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { Link } from 'react-router-dom';
import { formatNumber } from '../utils/format';

export const ProductionPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [rawBatches, setRawBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal 1: Create Draft Production Batch
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [batchMode, setBatchMode] = useState<'single' | 'slitting'>('single');
  const [selectedSlitOrderIds, setSelectedSlitOrderIds] = useState<string[]>([]);
  const [slittingExtrusionSize, setSlittingExtrusionSize] = useState('660 - 20 Micron');
  const [draftForm, setDraftForm] = useState({
    orderId: '',
    orderItemId: '',
    recipeId: '',
    plannedQuantityKg: 200,
    operatorName: '',
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
    operatorName: string;
    splitOutputs: Array<{
      orderId?: string;
      orderItemId?: string;
      orderNumber?: string;
      customerName?: string;
      sizeMicron: string;
      acceptedKg: number;
      lotSuffix?: string;
    }>;
  }>({
    consumption: [],
    acceptedOutputKg: 0,
    trimWasteKg: 0,
    plantWasteKg: 0,
    wasteKg: 0,
    rejectedKg: 0,
    operatorName: '',
    splitOutputs: [],
  });

  // Modal 3: Quick Assign / Edit Operator Name
  const [isEditOperatorModalOpen, setIsEditOperatorModalOpen] = useState(false);
  const [activeBatchForOperator, setActiveBatchForOperator] = useState<any>(null);
  const [editingOperatorName, setEditingOperatorName] = useState('');

  const openEditOperatorModal = (batch: any) => {
    setActiveBatchForOperator(batch);
    setEditingOperatorName(batch.operator_name || '');
    setIsEditOperatorModalOpen(true);
  };

  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatchForOperator) return;
    if (!editingOperatorName.trim()) {
      alert('Please enter an operator name.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/production/${activeBatchForOperator.id}/operator`, {
        operatorName: editingOperatorName.trim(),
      });
      setIsEditOperatorModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update operator name');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setBatchMode('single');
    setSelectedSlitOrderIds([]);
    setSlittingExtrusionSize('660 - 20 Micron');

    if (orders.length > 0) {
      const selectedOrd = orders.find((o) => o.id === draftForm.orderId) || orders[0];
      const item = selectedOrd?.customer_order_items?.[0] || {};
      const prod = products.find((p) => p.id === item.product_id);
      setDraftForm({
        orderId: selectedOrd.id,
        orderItemId: item.id || '',
        recipeId: prod?.active_recipe?.id || prod?.product_recipes?.[0]?.id || '',
        plannedQuantityKg: Number(item.requested_quantity_kg) || Number(selectedOrd.total_requested_weight_kg) || 200,
        operatorName: '',
        notes: '',
      });
    }
    setIsDraftModalOpen(true);
  };

  const handleStartDraftBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (batchMode === 'slitting') {
      if (selectedSlitOrderIds.length < 2) {
        alert('Please select at least 2 customer orders to merge for a slitting gang run.');
        return;
      }

      setIsSubmitting(true);
      try {
        const slittingPlan = selectedSlitOrderIds.map((oId) => {
          const o = orders.find((ord) => ord.id === oId);
          const item = o?.customer_order_items?.[0] || {};
          const spec = o?.size_micron || o?.sizeMicron || item.size_micron || item.sizeMicron || '330 - 20 Micron';
          const weight = Number(item.requested_quantity_kg) || Number(o?.total_requested_weight_kg) || 100;
          return {
            orderId: o.id,
            orderItemId: item.id || '',
            orderNumber: o.order_number || 'Order',
            customerName: o.customers?.name || o.customer_name || 'Customer',
            targetSizeMicron: spec,
            targetWeightKg: weight,
          };
        });

        const firstOrd = orders.find((o) => o.id === selectedSlitOrderIds[0]);
        const firstItem = firstOrd?.customer_order_items?.[0] || {};
        const prod = products.find((p) => p.id === firstItem.product_id);
        const recipeId = draftForm.recipeId || prod?.active_recipe?.id || prod?.product_recipes?.[0]?.id || '';

        await api.post('/production', {
          orderId: firstOrd.id,
          orderItemId: firstItem.id || '',
          recipeId,
          plannedQuantityKg: Number(draftForm.plannedQuantityKg),
          sizeMicron: slittingExtrusionSize.trim() || '660 - 20 Micron',
          isSlittingBatch: true,
          slittingPlan,
          operatorName: draftForm.operatorName.trim() || undefined,
          notes: draftForm.notes || `Merged slitting run: ${slittingExtrusionSize} slit into ${slittingPlan.map(s => s.targetSizeMicron).join(' & ')}`,
        });

        setIsDraftModalOpen(false);
        await fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to start slitting batch');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
      const orderSpec = ord?.size_micron || ord?.sizeMicron || item.size_micron || item.sizeMicron || 'Standard';

      await api.post('/production', {
        orderId: draftForm.orderId,
        orderItemId,
        recipeId,
        plannedQuantityKg: Number(draftForm.plannedQuantityKg),
        sizeMicron: orderSpec,
        isSlittingBatch: false,
        operatorName: draftForm.operatorName.trim() || undefined,
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

    let initialSplits: any[] = [];
    if (batch.is_slitting_batch && batch.slitting_plan && Array.isArray(batch.slitting_plan) && batch.slitting_plan.length > 0) {
      const totalPlanned = batch.slitting_plan.reduce((s: number, p: any) => s + (Number(p.targetWeightKg) || 0), 0) || planned || 1;
      initialSplits = batch.slitting_plan.map((p: any, idx: number) => {
        const ratio = (Number(p.targetWeightKg) || 0) / totalPlanned;
        return {
          orderId: p.orderId,
          orderItemId: p.orderItemId,
          orderNumber: p.orderNumber,
          customerName: p.customerName,
          sizeMicron: p.targetSizeMicron || '330 - 20 Micron',
          acceptedKg: Number((planned * ratio).toFixed(2)),
          lotSuffix: String.fromCharCode(65 + idx),
        };
      });
    }

    setConfirmForm({
      consumption: defaultConsumption,
      acceptedOutputKg: planned,
      trimWasteKg: 0,
      plantWasteKg: 0,
      wasteKg: 0,
      rejectedKg: 0,
      operatorName: batch.operator_name || '',
      splitOutputs: initialSplits,
    });
    setIsConfirmModalOpen(true);
  };

  const recalculateSplits = (newAcceptedKg: number) => {
    if (!selectedBatchToConfirm?.is_slitting_batch || !selectedBatchToConfirm?.slitting_plan) return;
    const plan = selectedBatchToConfirm.slitting_plan;
    const totalPlanned = plan.reduce((s: number, p: any) => s + (Number(p.targetWeightKg) || 0), 0) || newAcceptedKg || 1;
    const updated = plan.map((p: any, idx: number) => {
      const ratio = (Number(p.targetWeightKg) || 0) / totalPlanned;
      return {
        orderId: p.orderId,
        orderItemId: p.orderItemId,
        orderNumber: p.orderNumber,
        customerName: p.customerName,
        sizeMicron: p.targetSizeMicron || '330 - 20 Micron',
        acceptedKg: Number((newAcceptedKg * ratio).toFixed(2)),
        lotSuffix: String.fromCharCode(65 + idx),
      };
    });
    setConfirmForm((prev) => ({ ...prev, acceptedOutputKg: newAcceptedKg, splitOutputs: updated }));
  };

  const handleSplitKgChange = (index: number, newKg: number) => {
    const newSplits = [...confirmForm.splitOutputs];
    newSplits[index] = { ...newSplits[index], acceptedKg: newKg };
    const sumSplits = Number(newSplits.reduce((acc, s) => acc + (Number(s.acceptedKg) || 0), 0).toFixed(2));
    setConfirmForm((prev) => ({
      ...prev,
      splitOutputs: newSplits,
      acceptedOutputKg: sumSplits,
    }));
  };

  const toggleSlitOrder = (oId: string) => {
    let nextIds: string[];
    if (selectedSlitOrderIds.includes(oId)) {
      nextIds = selectedSlitOrderIds.filter((id) => id !== oId);
    } else {
      nextIds = [...selectedSlitOrderIds, oId];
    }
    setSelectedSlitOrderIds(nextIds);

    const selectedOrders = orders.filter((o) => nextIds.includes(o.id));
    const totalWeight = selectedOrders.reduce((sum, o) => {
      const item = o.customer_order_items?.[0] || {};
      return sum + (Number(item.requested_quantity_kg) || Number(o.total_requested_weight_kg) || 0);
    }, 0);
    setDraftForm((prev) => ({ ...prev, plannedQuantityKg: totalWeight || 200 }));

    let totalWidth = 0;
    let detectedMicron = '20 Micron';
    let parsedAny = false;

    selectedOrders.forEach((o) => {
      const item = o.customer_order_items?.[0] || {};
      const spec = o.size_micron || o.sizeMicron || item.size_micron || item.sizeMicron || '';
      const match = spec.match(/(\d+)\s*(?:mm)?\s*[-xX]\s*(\d+.*)/);
      if (match) {
        totalWidth += parseInt(match[1], 10);
        detectedMicron = match[2].trim();
        parsedAny = true;
      }
    });

    if (parsedAny && totalWidth > 0) {
      setSlittingExtrusionSize(`${totalWidth} - ${detectedMicron}`);
    } else if (selectedOrders.length > 0) {
      setSlittingExtrusionSize('660 - 20 Micron');
    }
  };

  const handleConfirmBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchToConfirm) return;

    setIsSubmitting(true);
    try {
      const computedWaste = Number(((Number(confirmForm.trimWasteKg) || 0) + (Number(confirmForm.plantWasteKg) || 0)).toFixed(2));
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
        operatorName: confirmForm.operatorName.trim() || undefined,
        splitOutputs: confirmForm.splitOutputs && confirmForm.splitOutputs.length > 0 ? confirmForm.splitOutputs : undefined,
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
  const totalWasteKg = Number(((Number(confirmForm.trimWasteKg) || 0) + (Number(confirmForm.plantWasteKg) || 0)).toFixed(2));
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
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">Date</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Customer</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Finished Product</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Operator</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Planned (kg)</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Actual Input</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Accepted</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Waste</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-4 text-center text-slate-400 text-xs">
                    No production batches recorded yet. Launch a batch from customer order demand.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80 dark:hover:bg-factory-800/40 transition-colors">
                    <td className="py-3.5 px-3.5 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(batch.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3.5 px-3.5 max-w-[200px]">
                      {batch.is_slitting_batch ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Scissors className="w-3 h-3 text-purple-500 shrink-0" />
                            Slitting Run ({batch.slitting_plan?.length || 2} Orders)
                          </span>
                          <div
                            className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-semibold"
                            title={batch.slitting_plan?.map((s: any) => s.customerName).join(', ')}
                          >
                            {batch.slitting_plan?.map((s: any) => s.customerName).join(', ') || batch.customer_orders?.customers?.name || 'Multiple Customers'}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="font-bold text-slate-900 dark:text-white max-w-[180px] truncate block"
                          title={batch.customer_orders?.customers?.name || batch.customer_orders?.customer_name}
                        >
                          {batch.customer_orders?.customers?.name || batch.customer_orders?.customer_name || 'Direct Customer'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 max-w-[220px]">
                      <div
                        className="font-semibold text-slate-800 dark:text-slate-200 truncate"
                        title={batch.products?.name || batch.product_name}
                      >
                        {batch.products?.name || batch.product_name}
                      </div>
                      {batch.size_micron && (
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {batch.is_slitting_batch ? `Extrusion Die: ${batch.size_micron}` : batch.size_micron}
                        </div>
                      )}
                      {batch.is_slitting_batch && batch.slitting_plan && Array.isArray(batch.slitting_plan) && (
                        <div
                          className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold truncate mt-0.5"
                          title={batch.slitting_plan.map((s: any) => `${s.targetSizeMicron} (${s.customerName})`).join(' + ')}
                        >
                          ✂️ Slit: {batch.slitting_plan.map((s: any) => s.targetSizeMicron).join(' + ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 group">
                        {batch.operator_name ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                            <User className="w-3 h-3 text-brand-500 shrink-0" />
                            {batch.operator_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditOperatorModal(batch)}
                          title={batch.operator_name ? "Change Operator" : "Assign Operator"}
                          className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-factory-800 transition-colors opacity-70 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {formatNumber(batch.planned_quantity_kg)} kg
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {formatNumber(batch.actual_input_kg || 0)} kg
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                      {formatNumber(batch.accepted_output_kg || 0)} kg
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono whitespace-nowrap">
                      <div className="text-rose-500 font-bold">{formatNumber(batch.waste_kg || 0)} kg</div>
                      {(Number(batch.trim_waste_kg) > 0 || Number(batch.plant_waste_kg) > 0) && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          Trim: {formatNumber(batch.trim_waste_kg || 0)} | Plant: {formatNumber(batch.plant_waste_kg || 0)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <Badge variant={batch.status === 'completed' ? 'success' : 'info'}>
                        {batch.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/traceability?batchId=${batch.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors border border-brand-500/20"
                          title="Trace Batch Lineage"
                        >
                          <GitBranch className="w-3 h-3" />
                          Trace
                        </Link>
                        {batch.status !== 'completed' ? (
                          <button
                            onClick={() => openConfirmModal(batch)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Execute & Stock
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Stocked
                          </span>
                        )}
                      </div>
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
        title={batchMode === 'slitting' ? '✂️ Launch Slitting Run (Gang Extrusion)' : 'Launch Production Batch (Order-Driven)'}
        maxWidth="lg"
      >
        <form onSubmit={handleStartDraftBatch} className="space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-factory-800 rounded-xl">
            <button
              type="button"
              onClick={() => setBatchMode('single')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                batchMode === 'single'
                  ? 'bg-white dark:bg-factory-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              Single Order Run
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchMode('slitting');
                if (selectedSlitOrderIds.length === 0 && orders.length >= 2) {
                  const firstTwo = [orders[0].id, orders[1].id];
                  setSelectedSlitOrderIds(firstTwo);
                  const sum =
                    (Number(orders[0].total_requested_weight_kg) || 100) +
                    (Number(orders[1].total_requested_weight_kg) || 100);
                  setDraftForm((prev) => ({ ...prev, plannedQuantityKg: sum }));

                  // Auto detect combined size
                  let totalW = 0;
                  let detMicron = '20 Micron';
                  let parsed = false;
                  [orders[0], orders[1]].forEach((o) => {
                    const item = o.customer_order_items?.[0] || {};
                    const spec = o.size_micron || o.sizeMicron || item.size_micron || item.sizeMicron || '';
                    const match = spec.match(/(\d+)\s*(?:mm)?\s*[-xX]\s*(\d+.*)/);
                    if (match) {
                      totalW += parseInt(match[1], 10);
                      detMicron = match[2].trim();
                      parsed = true;
                    }
                  });
                  if (parsed && totalW > 0) {
                    setSlittingExtrusionSize(`${totalW} - ${detMicron}`);
                  }
                }
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                batchMode === 'slitting'
                  ? 'bg-white dark:bg-factory-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-brand-500" />
              Merge Orders (Slitting Run)
            </button>
          </div>

          {batchMode === 'slitting' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                  <Scissors className="w-3.5 h-3.5 text-brand-500" />
                  Gang Extrusion & Slitting (Multi-Order Roll Production)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Merge 2 or more customer orders with identical resin blend & micron into one wide extrusion run (e.g., 660 mm), then split into parallel customer rolls (e.g., 2× 330 mm) upon stock execution.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Customer Orders to Merge (Min. 2 Orders)
                </label>
                {orders.length < 2 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                    At least 2 customer orders are required to perform a merged slitting run.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {orders.map((o) => {
                      const isSelected = selectedSlitOrderIds.includes(o.id);
                      const item = o.customer_order_items?.[0] || {};
                      const spec = o.size_micron || o.sizeMicron || item.size_micron || item.sizeMicron || 'Standard';
                      const weight = Number(item.requested_quantity_kg) || Number(o.total_requested_weight_kg) || 0;

                      return (
                        <div
                          key={o.id}
                          onClick={() => toggleSlitOrder(o.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-slate-900 dark:text-white font-medium shadow-sm'
                              : 'bg-white dark:bg-factory-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? 'bg-brand-500 border-brand-500 text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-factory-800'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100">
                                {o.customers?.name || o.customer_name || 'Customer'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {o.order_number || 'Order'} • Req: {weight} kg
                              </div>
                            </div>
                          </div>
                          <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-700 dark:text-slate-300 text-[11px]">
                            {spec}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedSlitOrderIds.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-factory-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span>📐 Extrusion & Slitting Plan Preview</span>
                    <span className="text-brand-600 dark:text-brand-400 font-mono">
                      {selectedSlitOrderIds.length} Slit Rolls
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 p-2 bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                      <span className="block text-[9px] text-slate-400 uppercase font-semibold">Master Extrusion</span>
                      <span className="font-bold text-slate-800 dark:text-white block truncate">{slittingExtrusionSize}</span>
                      <span className="block text-[11px] font-mono text-brand-600 dark:text-brand-400 font-bold">
                        {draftForm.plannedQuantityKg} kg
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-[2] space-y-1">
                      {selectedSlitOrderIds.map((oId, idx) => {
                        const ord = orders.find((o) => o.id === oId);
                        const spec = ord?.size_micron || ord?.sizeMicron || ord?.customer_order_items?.[0]?.size_micron || '330 - 20 Micron';
                        const kg = ord?.total_requested_weight_kg || ord?.customer_order_items?.[0]?.requested_quantity_kg || 0;
                        return (
                          <div
                            key={oId}
                            className="flex items-center justify-between p-1.5 bg-white dark:bg-factory-900 border border-slate-200/70 dark:border-slate-800 rounded-md text-[11px]"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                              Roll {String.fromCharCode(65 + idx)}: {ord?.customers?.name || ord?.customer_name}
                            </span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                              {spec} ({kg} kg)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Master Extrusion Die / Web Size Specification
                </label>
                <input
                  type="text"
                  required
                  value={slittingExtrusionSize}
                  onChange={(e) => setSlittingExtrusionSize(e.target.value)}
                  placeholder="e.g. 660 - 20 Micron"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Combined bubble/die width to run on the extrusion tower
                </span>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Customer Order
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
                        {o.customers?.name || o.customer_name} ({o.total_requested_weight_kg} kg)
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
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Planned Output (kg)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={draftForm.plannedQuantityKg}
                onChange={(e) =>
                  setDraftForm({ ...draftForm, plannedQuantityKg: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-500" />
                Operator Name (Machine In-Charge)
              </label>
              <input
                type="text"
                value={draftForm.operatorName}
                onChange={(e) => setDraftForm({ ...draftForm, operatorName: e.target.value })}
                placeholder="e.g. Ramesh Kumar, Operator 1"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Specify who is operating or handling this run</span>
            </div>
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
              disabled={orders.length === 0 || (batchMode === 'slitting' && selectedSlitOrderIds.length < 2)}
              isLoading={isSubmitting}
              loadingText="Creating Batch..."
            >
              {batchMode === 'slitting' ? 'Create Slitting Batch' : 'Create Production Batch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Confirm Production Run & Atomic Stock Deductions (Section 5) */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`Execute Production Run: ${selectedBatchToConfirm?.products?.name || 'Batch'}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleConfirmBatch} className="space-y-5">
          {/* Operator Name Field (Prominently Placed at the Top) */}
          <div className="p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-500" />
                Operator Name (Machine In-Charge)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Specify who is operating and handling this production run
              </p>
            </div>
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={confirmForm.operatorName}
                onChange={(e) => setConfirmForm({ ...confirmForm, operatorName: e.target.value })}
                placeholder="e.g. Ramesh Kumar, Operator 1"
                className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-brand-300 dark:border-brand-700/80 rounded-xl font-medium shadow-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              Raw Material Lot Consumption (Lot-by-Lot Traceability)
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
                            Lot from {lot.suppliers?.name || 'Stock'} (Rem: {formatNumber(lot.remaining_quantity_kg)} kg)
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
                Production Output Reconciliation
              </h4>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Total Waste: {formatNumber(totalWasteKg)} kg
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  Accepted Product (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={confirmForm.acceptedOutputKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (selectedBatchToConfirm?.is_slitting_batch) {
                      recalculateSplits(val);
                    } else {
                      setConfirmForm({ ...confirmForm, acceptedOutputKg: val });
                    }
                  }}
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
                  step="0.01"
                  required
                  value={confirmForm.trimWasteKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setConfirmForm({
                      ...confirmForm,
                      trimWasteKg: val,
                      wasteKg: Number((val + (confirmForm.plantWasteKg || 0)).toFixed(2)),
                    });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-amber-600 dark:text-amber-400"
                  placeholder="0.00"
                />
                <span className="text-[9px] text-slate-400">Side trim & slitting scrap</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-1">
                  Plant Waste (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={confirmForm.plantWasteKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setConfirmForm({
                      ...confirmForm,
                      plantWasteKg: val,
                      wasteKg: Number(((confirmForm.trimWasteKg || 0) + val).toFixed(2)),
                    });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-orange-600 dark:text-orange-400"
                  placeholder="0.00"
                />
                <span className="text-[9px] text-slate-400">Purging, start-up & floor lumps</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-rose-500 mb-1">
                  Rejected Output (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
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
                Total Material Input: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatNumber(totalInputKg)} kg</strong>
              </span>
              <span className="text-slate-500">
                Accounted Output: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatNumber(totalAccountedOutputKg)} kg</strong>
              </span>
              <span
                className={`font-bold font-mono ${Math.abs(totalInputKg - totalAccountedOutputKg) < 0.01 ? 'text-emerald-500' : 'text-amber-500'
                  }`}
              >
                Variance: {formatNumber(totalAccountedOutputKg - totalInputKg)} kg
              </span>
            </div>
          </div>

          {/* Roll Slitting & Multi-Lot Finished Goods Output Allocation */}
          {selectedBatchToConfirm?.is_slitting_batch && confirmForm.splitOutputs && confirmForm.splitOutputs.length > 0 && (
            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                    Roll Slitting & Multi-Lot Finished Goods Allocation
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => recalculateSplits(confirmForm.acceptedOutputKg)}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1"
                >
                  ⚡ Auto-balance from {confirmForm.acceptedOutputKg} kg
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Master extrusion roll ({selectedBatchToConfirm.size_micron || '660 mm'}) is slit into individual finished customer rolls. Each roll will receive an independent Finished Goods lot number (e.g. FG-PB-xxx-A, FG-PB-xxx-B) and be stocked for its respective customer order.
              </p>

              <div className="space-y-2">
                {confirmForm.splitOutputs.map((split, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white dark:bg-factory-900 border border-purple-100 dark:border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-600 text-white">
                          Roll {split.lotSuffix || String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {split.customerName || 'Customer'}
                        </span>
                        {split.orderNumber && (
                          <span className="text-[10px] font-mono text-slate-400">({split.orderNumber})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Target Size: <strong className="text-slate-700 dark:text-slate-300">{split.sizeMicron}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        Slit Output:
                      </label>
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={split.acceptedKg}
                          onChange={(e) => handleSplitKgChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-right text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">kg</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-purple-200/60 dark:border-purple-900/60 font-medium">
                <span className="text-slate-500">Sum of Slit Rolls Allocation:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatNumber(confirmForm.splitOutputs.reduce((acc, s) => acc + (Number(s.acceptedKg) || 0), 0))} kg / {formatNumber(confirmForm.acceptedOutputKg)} kg
                </span>
              </div>
            </div>
          )}

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

      {/* Modal 3: Quick Assign / Edit Operator Name */}
      <Modal
        isOpen={isEditOperatorModalOpen}
        onClose={() => setIsEditOperatorModalOpen(false)}
        title={`Assign / Edit Operator: ${activeBatchForOperator?.products?.name || 'Batch'}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveOperator} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-500" />
              Operator Name (Who ran this batch)
            </label>
            <input
              type="text"
              required
              autoFocus
              value={editingOperatorName}
              onChange={(e) => setEditingOperatorName(e.target.value)}
              placeholder="e.g. Ramesh Kumar, Operator 1"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Record or update the operator who handled this production run.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOperatorModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              Save Operator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
