import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  Ruler,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { SizeMicron } from '../types';

export const SizeMicronPage: React.FC = () => {
  const [sizeMicrons, setSizeMicrons] = useState<SizeMicron[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<SizeMicron | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SizeMicron | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    size: 'Standard Roll',
    micron: 50,
    unit: 'Micron',
    label: '',
    description: '',
    isActive: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/size-microns');
      setSizeMicrons(res.data.sizeMicrons || []);
    } catch (err) {
      console.error('Failed to load size/micron master:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered list
  const filteredList = useMemo(() => {
    return sizeMicrons.filter((item) => {
      if (statusFilter === 'active' && !item.is_active) return false;
      if (statusFilter === 'inactive' && item.is_active) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.label.toLowerCase().includes(q) ||
        (item.size && item.size.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        String(item.micron).includes(q)
      );
    });
  }, [sizeMicrons, searchQuery, statusFilter]);

  // Quick stats
  const totalCount = sizeMicrons.length;
  const activeCount = sizeMicrons.filter((s) => s.is_active).length;
  const minMicron = sizeMicrons.length ? Math.min(...sizeMicrons.map((s) => Number(s.micron) || 0)) : 0;
  const maxMicron = sizeMicrons.length ? Math.max(...sizeMicrons.map((s) => Number(s.micron) || 0)) : 0;

  // Open Create Modal
  const handleOpenCreate = () => {
    setItemToEdit(null);
    setFormData({
      size: '',
      micron: 50,
      unit: 'Micron',
      label: '50 Micron',
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: SizeMicron) => {
    setItemToEdit(item);
    setFormData({
      size: item.size || '',
      micron: Number(item.micron) || 50,
      unit: item.unit || 'Micron',
      label: item.label,
      description: item.description || '',
      isActive: item.is_active !== false,
    });
    setIsModalOpen(true);
  };

  // Auto-generate label helper
  const handleUpdateField = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If user is editing size or micron and haven't manually decoupled label:
      if (field === 'size' || field === 'micron' || field === 'unit') {
        const sizePart = (field === 'size' ? value : updated.size)?.trim();
        const micronPart = field === 'micron' ? value : updated.micron;
        const unitPart = (field === 'unit' ? value : updated.unit)?.trim() || 'Micron';
        if (sizePart && sizePart !== 'Standard' && sizePart !== 'Standard Roll') {
          updated.label = `${sizePart} - ${micronPart} ${unitPart}`;
        } else {
          updated.label = `${micronPart} ${unitPart}`;
        }
      }
      return updated;
    });
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.micron || Number(formData.micron) <= 0) {
      alert('Please enter a valid positive micron thickness.');
      return;
    }

    const finalLabel =
      formData.label.trim() ||
      (formData.size.trim() ? `${formData.size.trim()} - ${formData.micron} ${formData.unit}` : `${formData.micron} ${formData.unit}`);

    setIsSubmitting(true);
    try {
      if (itemToEdit) {
        await api.put(`/size-microns/${itemToEdit.id}`, {
          label: finalLabel,
          size: formData.size.trim() || 'Standard',
          micron: Number(formData.micron),
          unit: formData.unit.trim() || 'Micron',
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      } else {
        await api.post('/size-microns', {
          label: finalLabel,
          size: formData.size.trim() || 'Standard',
          micron: Number(formData.micron),
          unit: formData.unit.trim() || 'Micron',
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save Size / Micron specification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status inline
  const handleToggleActive = async (item: SizeMicron) => {
    try {
      await api.put(`/size-microns/${item.id}`, {
        isActive: !item.is_active,
      });
      await fetchData();
    } catch (err: any) {
      alert('Failed to update status.');
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/size-microns/${itemToDelete.id}`);
      setItemToDelete(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete specification');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Size & Micron Master
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage standard film gauge (Micron / μm), pouch dimensions & packaging specifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Size / Micron</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by size, micron, label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Status:</span>
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-factory-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${statusFilter === 'all'
                ? 'bg-white dark:bg-factory-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              All ({sizeMicrons.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${statusFilter === 'active'
                ? 'bg-white dark:bg-factory-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${statusFilter === 'inactive'
                ? 'bg-white dark:bg-factory-900 text-slate-700 dark:text-slate-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              Inactive ({sizeMicrons.length - activeCount})
            </button>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
            <Ruler className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Size / Micron Specifications Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {searchQuery
                ? 'No specifications matched your search filter. Try clearing the search term.'
                : 'Create your size and micron packaging specifications using the button below.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Specification
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-factory-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Dropdown Label</th>
                  <th className="py-3 px-4 whitespace-nowrap">Thickness / Gauge</th>
                  <th className="py-3 px-4 whitespace-nowrap">Size / Dimension</th>
                  <th className="py-3 px-4 whitespace-nowrap">Application / Notes</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-factory-800/40 transition-colors group"
                  >
                    {/* Dropdown Label */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.micron}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {item.label}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Thickness / Gauge */}
                    <td className="py-3.5 px-4 font-medium">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-mono font-bold text-xs">
                        {item.micron} {item.unit || 'Micron'}
                      </span>
                    </td>

                    {/* Size / Dimension */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        {item.size || 'Standard'}
                      </span>
                    </td>

                    {/* Application / Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                      {item.description || '—'}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        title="Click to toggle active status"
                        className="inline-flex items-center gap-1 transition-transform hover:scale-105"
                      >
                        {item.is_active ? (
                          <Badge variant="success">Active in Dropdown</Badge>
                        ) : (
                          <Badge variant="neutral">Disabled</Badge>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-factory-800 transition-colors"
                          title="Edit specification"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete specification"
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
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={itemToEdit ? `Edit Specification: ${itemToEdit.label}` : 'Add Size & Micron Specification'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Micron Thickness */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Micron Thickness *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.micron}
                onChange={(e) => handleUpdateField('micron', parseFloat(e.target.value) || 0)}
                placeholder="e.g. 50"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleUpdateField('unit', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="Micron">Micron (μm)</option>
                <option value="μm">μm</option>
                <option value="Gauge">Gauge</option>
                <option value="Mil">Mil</option>
              </select>
            </div>
          </div>

          {/* Size / Dimension */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Size / Dimensions
            </label>
            <input
              type="text"
              value={formData.size}
              onChange={(e) => handleUpdateField('size', e.target.value)}
              placeholder="e.g. 24x36, 12x18, or Standard Roll"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Leave blank or "Standard" for generic rolls, or specify dimensions like 24x36, 12x18.
            </p>
          </div>

          {/* Display Label */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dropdown Display Label *
              </label>
              <span className="text-[10px] text-brand-600 dark:text-brand-400">
                Auto-generated
              </span>
            </div>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. 24x36 - 50 Micron"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              This exact label will be shown in customer order dropdowns.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Application / Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Heavy duty milk pouch liner, high tensile puncture resistant"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Active (Visible in Order and Product dropdowns)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {itemToEdit ? 'Update Specification' : 'Save Specification'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-semibold">
              Are you sure you want to delete specification{' '}
              <strong className="font-bold underline">{itemToDelete?.label}</strong>?
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            This will remove this specification from all future order dropdowns. Existing orders using this size will preserve their value.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={confirmDelete}
            >
              Delete Specification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
