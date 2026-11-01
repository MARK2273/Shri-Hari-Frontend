import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  AlertCircle,
  Copy,
  RotateCcw,
  Boxes,
  Truck,
  IndianRupee,
  Layers,
  Calendar,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Material, Supplier } from '../../types';
import { ParsedBatchRow, ParseExcelResult } from '../../utils/excelMaterials';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importResult: ParseExcelResult | null;
  materials: Material[];
  suppliers: Supplier[];
  onConfirm: (finalRows: ParsedBatchRow[]) => Promise<void>;
  onReupload: () => void;
  isSubmitting?: boolean;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  importResult,
  materials,
  suppliers,
  onConfirm,
  onReupload,
  isSubmitting = false,
}) => {
  const [rows, setRows] = useState<ParsedBatchRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Sync internal editable rows whenever a new file is parsed
  useEffect(() => {
    if (importResult?.rows) {
      setRows(JSON.parse(JSON.stringify(importResult.rows)));
    } else {
      setRows([]);
    }
  }, [importResult]);

  if (!isOpen || !importResult) return null;

  // Validation re-check on field change
  const validateRow = (row: ParsedBatchRow): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!row.materialId) {
      errors.push('Please select a valid material');
    }
    if (Number(row.receivedQuantityKg) <= 0) {
      errors.push('Quantity must be > 0 kg');
    }
    if (Number(row.costPerKg) <= 0) {
      errors.push('Rate must be > 0 ₹');
    }
    if (!row.supplierName?.trim()) {
      errors.push('Vendor name is required');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleUpdateField = (id: string, field: keyof ParsedBatchRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const updated = { ...r, [field]: value };

        // If materialId changed, also update materialName and code
        if (field === 'materialId') {
          const mat = materials.find((m) => m.id === value);
          if (mat) {
            updated.materialName = mat.name;
            updated.materialCode = mat.code;
          }
        }

        // If supplierId changed from dropdown
        if (field === 'supplierId') {
          const sup = suppliers.find((s) => s.id === value);
          if (sup) {
            updated.supplierName = sup.name;
          }
        }

        const validation = validateRow(updated);
        updated.isValid = validation.isValid;
        updated.errors = validation.errors;

        return updated;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDuplicateRow = (row: ParsedBatchRow) => {
    const todayCompact = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newRow: ParsedBatchRow = {
      ...row,
      id: Math.random().toString(36).substring(2, 11),
      batchNumber: `MB-${todayCompact}-${Math.floor(Math.random() * 900 + 100)}`,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleAddNewRow = () => {
    const todayCompact = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const defaultMat = materials[0];
    const defaultSup = suppliers[0];

    const newRow: ParsedBatchRow = {
      id: Math.random().toString(36).substring(2, 11),
      materialId: defaultMat?.id || '',
      materialName: defaultMat?.name || '',
      materialCode: defaultMat?.code || '',
      rawMaterialInput: '',
      supplierId: defaultSup?.id || null,
      supplierName: defaultSup?.name || '',
      receivedQuantityKg: 500,
      costPerKg: 110,
      supplierLotNumber: '',
      receiptDate: new Date().toISOString().split('T')[0],
      batchNumber: `MB-${todayCompact}-${Math.floor(Math.random() * 900 + 100)}`,
      notes: '',
      isValid: Boolean(defaultMat?.id),
      errors: defaultMat?.id ? [] : ['Please select a valid material'],
    };

    setRows((prev) => [...prev, newRow]);
  };

  const handleResetToOriginal = () => {
    if (importResult?.rows) {
      setRows(JSON.parse(JSON.stringify(importResult.rows)));
    }
  };

  // Computed summary statistics
  const totalItems = rows.length;
  const totalWeightKg = rows.reduce((acc, r) => acc + (Number(r.receivedQuantityKg) || 0), 0);
  const totalValueInr = rows.reduce(
    (acc, r) => acc + (Number(r.receivedQuantityKg) || 0) * (Number(r.costPerKg) || 0),
    0
  );
  const invalidRowsCount = rows.filter((r) => !r.isValid).length;
  const hasErrors = invalidRowsCount > 0;

  const handleConfirmAndAdd = async () => {
    if (rows.length === 0) {
      alert('There are no items to add to stock.');
      return;
    }
    if (hasErrors) {
      alert('Please fix all highlighted errors in the rows before continuing.');
      return;
    }
    await onConfirm(rows);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Excel Inward Import Preview"
      maxWidth="7xl"
    >
      <div className="space-y-5">
        {/* Top Prominent Confirmation Banner */}
        <div className="bg-gradient-to-r from-brand-50 to-indigo-50/60 dark:from-brand-950/40 dark:to-indigo-950/30 border border-brand-200 dark:border-brand-800/60 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-500 text-white shadow-sm shadow-brand-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  This is the final result. Do you want to continue?
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl pl-9">
                File: <strong className="font-semibold text-slate-800 dark:text-slate-200">{importResult.fileName}</strong>.
                Review the parsed raw material batches below. You can edit any material, vendor, quantity, rate, date, or add/delete items before finalizing stock entry.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleResetToOriginal}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm"
                title="Reset edits to original file contents"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={onReupload}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm"
              >
                Upload Different File
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-brand-200/60 dark:border-brand-800/40">
            <div className="bg-white/80 dark:bg-factory-900/80 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Lots / Items
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {totalItems}
                </span>
                <span className="text-xs text-slate-500">entries</span>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-factory-900/80 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Weight (kg)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono">
                  {totalWeightKg.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500">kg</span>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-factory-900/80 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Consignment Value
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{totalValueInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-factory-900/80 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Validation Status
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {hasErrors ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    {invalidRowsCount} {invalidRowsCount === 1 ? 'row needs' : 'rows need'} attention
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    All {totalItems} rows verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Header above table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Consignment Items ({rows.length})
            </span>
            <span className="text-xs text-slate-500">
              (Click any cell below to modify values)
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddNewRow}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>

        {/* Editable Table Container */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-factory-900 shadow-sm max-h-[50vh] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 dark:bg-factory-950/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <tr className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[200px]">Plastic Material *</th>
                <th className="py-3 px-3 min-w-[170px]">Vendor / Supplier *</th>
                <th className="py-3 px-3 min-w-[110px]">Qty (kg) *</th>
                <th className="py-3 px-3 min-w-[110px]">Rate (₹/kg) *</th>
                <th className="py-3 px-3 min-w-[110px]">Total (₹)</th>
                <th className="py-3 px-3 min-w-[130px]">Lot / Invoice No</th>
                <th className="py-3 px-3 min-w-[125px]">Inward Date</th>
                <th className="py-3 px-3 min-w-[130px]">Batch No</th>
                <th className="py-3 px-3 min-w-[160px]">Remarks / Notes</th>
                <th className="py-3 px-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {rows.map((row, index) => {
                const isSelected = selectedRowId === row.id;
                const rowTotal = (Number(row.receivedQuantityKg) || 0) * (Number(row.costPerKg) || 0);

                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRowId(row.id)}
                    className={`transition-colors ${
                      !row.isValid
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70'
                        : isSelected
                        ? 'bg-brand-50/30 dark:bg-brand-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-factory-800/40'
                    }`}
                  >
                    {/* # Index & Status */}
                    <td className="py-2.5 px-3 text-center text-slate-400 text-xs font-mono">
                      <div className="flex flex-col items-center gap-1">
                        <span>{index + 1}</span>
                        {!row.isValid ? (
                          <span title={row.errors.join(', ')}>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                    </td>

                    {/* Material Select */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <select
                          value={row.materialId}
                          onChange={(e) => handleUpdateField(row.id, 'materialId', e.target.value)}
                          className={`w-full text-xs py-1.5 px-2 rounded-lg border font-semibold ${
                            !row.materialId
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white'
                          } focus:ring-2 focus:ring-brand-500 focus:outline-none`}
                        >
                          <option value="">-- Select Material --</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.code} - {m.name}
                            </option>
                          ))}
                        </select>
                        {row.rawMaterialInput && row.rawMaterialInput !== row.materialName && (
                          <span
                            className="text-[10px] text-slate-400 truncate block max-w-[200px]"
                            title={`Original in file: "${row.rawMaterialInput}"`}
                          >
                            Excel: {row.rawMaterialInput}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Vendor Name */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={row.supplierName}
                          onChange={(e) => handleUpdateField(row.id, 'supplierName', e.target.value)}
                          list={`suppliers-list-${row.id}`}
                          placeholder="Vendor Name"
                          className={`w-full text-xs py-1.5 px-2 rounded-lg border font-medium ${
                            !row.supplierName?.trim()
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white'
                          } focus:ring-2 focus:ring-brand-500 focus:outline-none`}
                        />
                        <datalist id={`suppliers-list-${row.id}`}>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.code ? `${s.code} - ` : ''}
                              {s.name}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </td>

                    {/* Received Quantity (kg) */}
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={row.receivedQuantityKg || ''}
                          onChange={(e) =>
                            handleUpdateField(row.id, 'receivedQuantityKg', parseFloat(e.target.value) || 0)
                          }
                          className={`w-full text-xs py-1.5 px-2 rounded-lg border font-mono font-bold ${
                            Number(row.receivedQuantityKg) <= 0
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white'
                          } focus:ring-2 focus:ring-brand-500 focus:outline-none`}
                        />
                      </div>
                    </td>

                    {/* Cost per kg (₹) */}
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={row.costPerKg || ''}
                          onChange={(e) =>
                            handleUpdateField(row.id, 'costPerKg', parseFloat(e.target.value) || 0)
                          }
                          className={`w-full text-xs py-1.5 px-2 rounded-lg border font-mono font-bold ${
                            Number(row.costPerKg) <= 0
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white'
                          } focus:ring-2 focus:ring-brand-500 focus:outline-none`}
                        />
                      </div>
                    </td>

                    {/* Total Value (₹) - Auto calculated */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      ₹{rowTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>

                    {/* Supplier Lot / Invoice */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.supplierLotNumber}
                        onChange={(e) => handleUpdateField(row.id, 'supplierLotNumber', e.target.value)}
                        placeholder="e.g. INV-2024"
                        className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>

                    {/* Receipt Date */}
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        value={row.receiptDate}
                        onChange={(e) => handleUpdateField(row.id, 'receiptDate', e.target.value)}
                        className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                      />
                    </td>

                    {/* Internal Batch No */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.batchNumber}
                        onChange={(e) => handleUpdateField(row.id, 'batchNumber', e.target.value)}
                        placeholder="Auto generated"
                        className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono text-[11px]"
                      />
                    </td>

                    {/* Notes */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.notes}
                        onChange={(e) => handleUpdateField(row.id, 'notes', e.target.value)}
                        placeholder="Remarks / bag count"
                        className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-factory-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(row)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Duplicate row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Warning Callout if any row has errors */}
        {hasErrors && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">Attention Needed Before Adding to Stocks:</strong>
              <p>
                {invalidRowsCount} {invalidRowsCount === 1 ? 'item has' : 'items have'} missing materials or non-positive quantities/rates.
                Please select the appropriate plastic material or fill in valid rates directly in the table above.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total of <strong className="text-slate-800 dark:text-white">{rows.length} lots</strong> ({totalWeightKg.toLocaleString()} kg) ready for stock addition.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAndAdd}
              disabled={isSubmitting || rows.length === 0 || hasErrors}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md ${
                hasErrors || rows.length === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding to Stocks...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Yes, Continue & Add to Stocks ({rows.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

