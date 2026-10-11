import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Layers,
  Plus,
  Filter,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  Box,
  Scale
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const MaterialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'batches' | 'catalog'>('batches');
  const [materials, setMaterials] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<any | null>(null);
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

  // Form state for Plastic Material Type (Create/Edit)
  const [materialForm, setMaterialForm] = useState({
    code: '',
    name: '',
    description: '',
    minStockLevelKg: 500,
    standardUnit: 'kg',
    isActive: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [matRes, batchRes] = await Promise.all([
        api.get('/materials'),
        api.get('/materials/batches'),
      ]);
      const fetchedMaterials = matRes.data.materials || [];
      setMaterials(fetchedMaterials);
      setBatches(batchRes.data.batches || []);

      if (fetchedMaterials.length > 0 && !receiveForm.materialId) {
        setReceiveForm((prev) => ({ ...prev, materialId: fetchedMaterials[0].id }));
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

  // Open modal to create a new plastic type
  const handleOpenCreateMaterial = () => {
    setMaterialToEdit(null);
    setMaterialForm({
      code: '',
      name: '',
      description: '',
      minStockLevelKg: 500,
      standardUnit: 'kg',
      isActive: true,
    });
    setIsMaterialModalOpen(true);
  };

  // Open modal to edit an existing plastic type
  const handleOpenEditMaterial = (mat: any) => {
    setMaterialToEdit(mat);
    setMaterialForm({
      code: mat.code,
      name: mat.name,
      description: mat.description || '',
      minStockLevelKg: Number(mat.min_stock_level_kg) || 500,
      standardUnit: mat.standard_unit || 'kg',
      isActive: mat.is_active !== false,
    });
    setIsMaterialModalOpen(true);
  };

  // Save (Create or Update) Plastic Material Type
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (materialToEdit) {
        // Update existing
        await api.put(`/materials/${materialToEdit.id}`, {
          name: materialForm.name,
          description: materialForm.description,
          minStockLevelKg: materialForm.minStockLevelKg,
          isActive: materialForm.isActive,
        });
      } else {
        // Create new
        const res = await api.post('/materials', {
          code: materialForm.code,
          name: materialForm.name,
          description: materialForm.description,
          minStockLevelKg: materialForm.minStockLevelKg,
          standardUnit: 'kg',
        });
        if (res.data?.material?.id) {
          setReceiveForm((prev) => ({ ...prev, materialId: res.data.material.id }));
        }
      }
      setIsMaterialModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save plastic material');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Plastic Material Type
  const handleDeleteMaterial = async (mat: any) => {
    if (!window.confirm(`Are you sure you want to delete plastic material "${mat.name}" (${mat.code})?`)) {
      return;
    }
    try {
      await api.delete(`/materials/${mat.id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete material');
    }
  };

  // 1-Click Seed Standard Packaging Polymers
  const handleSeedDefaults = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.post('/materials/seed-defaults', {});
      alert(res.data?.message || 'Standard packaging polymers configured!');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to seed materials');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Receive Batch
  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.materialId) {
      alert('Please select or create a plastic material first.');
      return;
    }
    setIsSubmitting(true);
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
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to receive batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adjust Stock
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatchToAdjust) return;
    setIsSubmitting(true);
    try {
      await api.post(`/materials/batches/${activeBatchToAdjust.id}/adjust`, adjustForm);
      setIsAdjustModalOpen(false);
      setAdjustForm({ adjustmentQuantityKg: 0, reason: '' });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBatches =
    selectedMaterial === 'all'
      ? batches
      : batches.filter((b) => b.material_id === selectedMaterial);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-500" />
            Raw Material & Batch Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configurable plastic polymers (HDPE, LDPE, PP, etc.) & FIFO lot-level tracking in kg
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {materials.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-xl hover:bg-brand-100 transition-colors shadow-sm"
              title="1-Click Populate standard packaging polymer grades (HDPE, LDPE, PP, LLDPE, White Masterbatch)"
            >
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Seed Standard Polymers</span>
            </button>
          )}

          <button
            onClick={handleOpenCreateMaterial}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-factory-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-brand-500" />
            + Configure Plastic Type
          </button>

          <button
            onClick={() => {
              if (materials.length === 0) {
                handleOpenCreateMaterial();
              } else {
                if (!receiveForm.materialId && materials.length > 0) {
                  setReceiveForm((prev) => ({ ...prev, materialId: materials[0].id }));
                }
                setIsReceiveModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Receive Material Batch
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Batches vs Plastic Types Catalog */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Traceable Lots / Batches ({batches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Plastic Material Types ({materials.length})</span>
        </button>
      </div>

      {/* Content depending on active tab */}
      {activeTab === 'batches' ? (
        <div className="space-y-6">
          {/* Quick Filter Cards Grid */}
          {materials.length > 0 ? (
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
                      {m.total_stock_kg || 0} kg
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">/ Min: {m.min_stock_level_kg} kg</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <Layers className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Plastic Materials Configured Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Before receiving raw plastic batches, configure the plastic material types used by your factory (e.g. HDPE, LDPE, PP, Masterbatch).
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSeedDefaults}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl hover:bg-brand-100 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  Seed Standard Packaging Polymers
                </button>
                <button
                  onClick={handleOpenCreateMaterial}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Create Custom Plastic Type
                </button>
              </div>
            </div>
          )}

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

              {materials.length > 0 && (
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
              )}
            </div>

            {filteredBatches.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No raw material batches received yet. Click "+ Receive Material Batch" to log supplier delivery.
              </div>
            ) : (
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
                          {b.materials?.name || b.material_name || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-500">
                          {b.suppliers?.name || b.supplier_name || 'Direct'} /{' '}
                          <span className="font-mono">{b.supplier_lot_number || 'N/A'}</span>
                        </td>
                        <td className="py-3 text-slate-500">{b.receipt_date}</td>
                        <td className="py-3 font-mono">{b.received_quantity_kg} kg</td>
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {b.remaining_quantity_kg} kg
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
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Plastic Material Types Catalog (Manage, Add, Edit, Delete) */
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Configured Plastic Polymers ({materials.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Define resin types, minimum stock alert triggers, and specifications in kilograms (kg).
              </p>
            </div>

            <button
              onClick={handleOpenCreateMaterial}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Plastic Material Type
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No plastic materials configured yet. Click "+ Add Plastic Material Type" or use "Seed Standard Polymers".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5">Code</th>
                    <th className="py-2.5">Polymer Name</th>
                    <th className="py-2.5">Description & Properties</th>
                    <th className="py-2.5">Min Stock Alert</th>
                    <th className="py-2.5">Current Stock</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {mat.code}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                        {mat.name}
                      </td>
                      <td className="py-3 text-slate-500 max-w-xs truncate" title={mat.description}>
                        {mat.description || '—'}
                      </td>
                      <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                        {mat.min_stock_level_kg} kg
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {mat.total_stock_kg || 0} kg
                      </td>
                      <td className="py-3">
                        <Badge variant={mat.is_active !== false ? 'success' : 'neutral'}>
                          {mat.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditMaterial(mat)}
                            className="p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-lg transition-colors"
                            title="Edit Material"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(mat)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-lg transition-colors"
                            title="Delete Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create or Edit Plastic Material Type */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        title={materialToEdit ? `Edit Plastic Material: ${materialToEdit.code}` : 'Configure New Plastic Material Type'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Material Code *
              </label>
              <input
                type="text"
                required
                disabled={!!materialToEdit}
                placeholder="e.g. HDPE-FLM, PP-RAF"
                value={materialForm.code}
                onChange={(e) => setMaterialForm({ ...materialForm, code: e.target.value.toUpperCase() })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique polymer code (uppercase)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Standard Weight Unit
              </label>
              <input
                type="text"
                disabled
                value="Kilograms (kg)"
                className="w-full text-xs px-3 py-2 bg-slate-100 dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-medium cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Strict ERP Standard</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Polymer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDPE High-Density Film Grade (Milk Pouch)"
              value={materialForm.name}
              onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Density: 0.952 g/cm³, MFI: 0.05. Reliance Relene 010F18 grade for blow film extrusion."
              value={materialForm.description}
              onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Minimum Stock Alert Threshold (kg) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                required
                value={materialForm.minStockLevelKg}
                onChange={(e) => setMaterialForm({ ...materialForm, minStockLevelKg: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Triggers visual low-stock warning on dashboard when total remaining lots drop below this weight.
            </span>
          </div>

          {materialToEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActiveToggle"
                checked={materialForm.isActive}
                onChange={(e) => setMaterialForm({ ...materialForm, isActive: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active for production formulation & lot receipt
              </label>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsMaterialModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {materialToEdit ? 'Save Changes' : 'Create Material Type'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Receive Material Batch */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Raw Material Batch (Traceable Lot)"
        maxWidth="lg"
      >
        <form onSubmit={handleReceiveBatch} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Plastic Material *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsReceiveModalOpen(false);
                  handleOpenCreateMaterial();
                }}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add New Material
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">No plastic material types configured yet</p>
                  <p className="text-[11px] opacity-80">You must configure at least one plastic type before receiving lots.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsReceiveModalOpen(false);
                    handleOpenCreateMaterial();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs shrink-0 hover:bg-amber-600 transition-colors"
                >
                  + Add Plastic Type
                </button>
              </div>
            ) : (
              <select
                required
                value={receiveForm.materialId}
                onChange={(e) => setReceiveForm({ ...receiveForm, materialId: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Number (Internal) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MB-20261011-001"
                value={receiveForm.batchNumber}
                onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
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
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Received Weight (kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={receiveForm.receivedQuantityKg}
                  onChange={(e) =>
                    setReceiveForm({ ...receiveForm, receivedQuantityKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">kg</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Date *
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost Per KG (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receiveForm.costPerKg}
                onChange={(e) => setReceiveForm({ ...receiveForm, costPerKg: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes / Quality Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Certified virgin pellets, COA verified"
                value={receiveForm.notes}
                onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || materials.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors disabled:opacity-50"
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
        title={`Adjust Stock: Batch ${activeBatchToAdjust?.batch_number || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <p>
              <strong>Material:</strong> {activeBatchToAdjust?.materials?.name || activeBatchToAdjust?.material_name}
            </p>
            <p>
              <strong>Current Remaining:</strong>{' '}
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                {activeBatchToAdjust?.remaining_quantity_kg} kg
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Adjustment Quantity in KG (use negative to decrease) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                required
                value={adjustForm.adjustmentQuantityKg}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, adjustmentQuantityKg: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Resulting remaining weight:{' '}
              <strong className="font-mono">
                {((activeBatchToAdjust?.remaining_quantity_kg || 0) + (adjustForm.adjustmentQuantityKg || 0)).toFixed(3)} kg
              </strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Adjustment *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Weighing scale calibration variance, physical inventory audit"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              Save Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
