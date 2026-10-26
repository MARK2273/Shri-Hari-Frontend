import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  History,
  Trash2,
  CheckCircle2,
  User,
  Eye,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatNumber } from '../utils/format';

export const ReportsPage: React.FC = () => {
  const [varianceReport, setVarianceReport] = useState<any[]>([]);
  const [wasteData, setWasteData] = useState<any>({ summary: {}, records: [] });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'variance' | 'waste' | 'audit'>('variance');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatchVariance, setSelectedBatchVariance] = useState<any | null>(null);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const toggleExpandBatch = (batchNumber: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchNumber)) {
        next.delete(batchNumber);
      } else {
        next.add(batchNumber);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [varRes, wasteRes, auditRes] = await Promise.all([
          api.get('/reports/variance'),
          api.get('/reports/waste'),
          api.get('/reports/audit-logs'),
        ]);

        setVarianceReport(varRes.data.report || []);
        setWasteData(wasteRes.data || { summary: {}, records: [] });
        setAuditLogs(auditRes.data.logs || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (isLoading) {
    return <PageSkeleton type="reports" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" />
          Factory Analytics & Audit Ledger
        </h1>
        {/* <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Production variance (planned vs actual), scrap loss metrics, and tamper-proof user audit trails
        </p> */}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('variance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === 'variance'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
            }`}
        >
          Production Variance
        </button>
        <button
          onClick={() => setActiveTab('waste')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === 'waste'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
            }`}
        >
          Waste & Scrap Metrics
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === 'audit'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
            }`}
        >
          Audit Ledger
        </button>
      </div>

      {/* Tab 1: Variance Report */}
      {activeTab === 'variance' && (
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="w-10 px-2 py-3 text-center"></th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Product / Batch</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Operator</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Planned Input</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Actual Input</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Accepted Output</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Waste (Trim / Plant)</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Yield %</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Input Variance</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {varianceReport.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3.5 py-8 text-center text-slate-400 text-xs">
                      No production batch variance records logged yet.
                    </td>
                  </tr>
                ) : (
                  varianceReport.map((row, idx) => {
                    const isExpanded = expandedBatches.has(row.batch_number);
                    const overusedMaterials = (row.materials || []).filter(
                      (m: any) => Number(m.variance_kg) > 0.001
                    );
                    const underusedMaterials = (row.materials || []).filter(
                      (m: any) => Number(m.variance_kg) < -0.001
                    );

                    return (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-factory-800/40 transition-colors">
                          <td className="w-10 px-2 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpandBatch(row.batch_number)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-factory-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title={isExpanded ? 'Collapse raw material details' : 'Expand raw material details'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-brand-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-3.5 py-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {row.product_name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-brand-600 dark:text-brand-400">{row.batch_number}</span>
                              {row.completion_time && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(row.completion_time).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                            {row.operator_name ? (
                              <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                                <User className="w-3 h-3 text-brand-500" />
                                {row.operator_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3.5 text-right font-mono">{formatNumber(row.planned_input_kg)} kg</td>
                          <td className="px-3.5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatNumber(row.actual_input_kg)} kg
                          </td>
                          <td className="px-3.5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatNumber(row.accepted_output_kg)} kg
                          </td>
                          <td className="px-3.5 py-3.5 text-right font-mono">
                            <span className="text-rose-500 font-bold">{formatNumber(row.waste_kg)} kg</span>
                            {(Number(row.trim_waste_kg) > 0 || Number(row.plant_waste_kg) > 0) && (
                              <div className="text-[10px] text-slate-400">
                                Trim: {formatNumber(row.trim_waste_kg)} | Plant: {formatNumber(row.plant_waste_kg)}
                              </div>
                            )}
                          </td>
                          <td className="px-3.5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatNumber(row.yield_percentage ?? 100)}%
                          </td>
                          <td className="px-3.5 py-3.5 text-right font-mono">
                            <span className={Number(row.input_variance_kg) === 0 ? 'text-emerald-500 font-bold' : Number(row.input_variance_kg) > 0 ? 'text-amber-500 font-bold' : 'text-blue-500 font-bold'}>
                              {Number(row.input_variance_kg) > 0 ? `+${formatNumber(row.input_variance_kg)}` : formatNumber(row.input_variance_kg)} kg
                            </span>
                            {/* Direct identification of overused materials */}
                            {overusedMaterials.length > 0 ? (
                              <div className="text-[10px] font-sans font-medium flex items-center justify-end gap-1 mt-0.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                                  More: <strong>{overusedMaterials.map((m: any) => `${m.material_name} (+${formatNumber(m.variance_kg)} kg)`).join(', ')}</strong>
                                </span>
                              </div>
                            ) : underusedMaterials.length > 0 ? (
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-sans font-medium flex items-center justify-end gap-1 mt-0.5">
                                <span>Under: {underusedMaterials.map((m: any) => `${m.material_name} (${formatNumber(m.variance_kg)} kg)`).join(', ')}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans mt-0.5">Exact recipe balance</div>
                            )}
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedBatchVariance(row)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-white bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-500 dark:hover:bg-brand-600 rounded-xl transition-all border border-brand-200 dark:border-brand-800/60 shadow-xs"
                              title="View material-by-material consumption breakdown"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>

                        {/* Inline Expandable Raw Material Breakdown */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 dark:bg-factory-800/50">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="p-4 rounded-xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-brand-500" />
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      Raw Material Consumption Breakdown
                                    </h4>
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-700/60">
                                      Batch: {row.batch_number}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedBatchVariance(row)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Open Detailed Analysis Modal</span>
                                  </button>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs min-w-[700px]">
                                    <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                                      <tr>
                                        <th className="py-2 px-3">Material Name</th>
                                        <th className="py-2 px-3 text-right">Planned (kg)</th>
                                        <th className="py-2 px-3 text-right">Actual Used (kg)</th>
                                        <th className="py-2 px-3 text-right">Variance (kg)</th>
                                        <th className="py-2 px-3 text-right">Deviation %</th>
                                        <th className="py-2 px-3 text-center">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                      {(row.materials || []).map((m: any, mIdx: number) => {
                                        const pKg = Number(m.planned_kg) || 0;
                                        const aKg = Number(m.actual_kg) || 0;
                                        const diff = Number((aKg - pKg).toFixed(3));
                                        const devPct = pKg > 0 ? (diff / pKg) * 100 : 0;
                                        const isOver = diff > 0.001;
                                        const isUnder = diff < -0.001;

                                        return (
                                          <tr key={mIdx} className={isOver ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                              {m.material_name}
                                              {m.material_code && (
                                                <span className="text-[10px] text-slate-400 font-mono ml-1.5">({m.material_code})</span>
                                              )}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                              {formatNumber(pKg)} kg
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                              {formatNumber(aKg)} kg
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                                              <span className={isOver ? 'text-amber-600 dark:text-amber-400' : isUnder ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                                {diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)} kg
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                                              <span className={isOver ? 'text-amber-600 font-bold' : isUnder ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                                                {diff > 0 ? `+${devPct.toFixed(1)}%` : diff < 0 ? `${devPct.toFixed(1)}%` : '0.0%'}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              {isOver ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                  <ArrowUpRight className="w-2.5 h-2.5" /> Overused
                                                </span>
                                              ) : isUnder ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                  <ArrowDownRight className="w-2.5 h-2.5" /> Underused
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                  <CheckCircle2 className="w-2.5 h-2.5" /> Exact
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Waste Report */}
      {activeTab === 'waste' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Accepted</span>
              <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatNumber(wasteData.summary?.total_accepted_kg)} kg
              </p>
              <span className="text-[10px] text-slate-400">Stocked finished product</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">1. Trim Waste</span>
              <p className="text-xl font-black font-mono text-amber-500 mt-1">
                {formatNumber(wasteData.summary?.total_trim_waste_kg)} kg
              </p>
              <span className="text-[10px] text-slate-400">Side trim & slitting scrap</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">2. Plant Waste</span>
              <p className="text-xl font-black font-mono text-orange-500 mt-1">
                {formatNumber(wasteData.summary?.total_plant_waste_kg)} kg
              </p>
              <span className="text-[10px] text-slate-400">Purging, lumps & floor</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Scrap Loss</span>
              <p className="text-xl font-black font-mono text-rose-500 mt-1">
                {formatNumber(wasteData.summary?.total_waste_kg)} kg
              </p>
              <span className="text-[10px] text-slate-400">Trim + Plant combined</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Rejected</span>
              <p className="text-xl font-black font-mono text-slate-600 dark:text-slate-300 mt-1">
                {formatNumber(wasteData.summary?.total_rejected_kg)} kg
              </p>
              <span className="text-[10px] text-slate-400">Quarantine inspection</span>
            </div>
          </div>

          <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider text-slate-400">
              Batch-by-Batch Waste & Scrap Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1050px]">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="px-3.5 py-3 whitespace-nowrap">Product</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Operator</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Accepted</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Trim Waste</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Plant Waste</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Total Waste</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Rejected</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {(wasteData.records || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3.5 py-8 text-center text-slate-400 text-xs">
                        No production waste or scrap entries recorded.
                      </td>
                    </tr>
                  ) : (
                    (wasteData.records || []).map((rec: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                        <td className="px-3.5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {rec.product_name || 'Manufactured Item'}
                        </td>
                        <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {rec.operator_name ? (
                            <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                              <User className="w-3 h-3 text-brand-500" />
                              {rec.operator_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(rec.accepted_kg)} kg
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono text-amber-500 font-semibold">
                          {formatNumber(rec.trim_waste_kg)} kg
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono text-orange-500 font-semibold">
                          {formatNumber(rec.plant_waste_kg)} kg
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono text-rose-500 font-bold">
                          {formatNumber(rec.waste_kg)} kg
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono text-slate-500">
                          {formatNumber(rec.rejected_kg)} kg
                        </td>
                        <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-400">
                          {rec.recorded_at ? new Date(rec.recorded_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Ledger */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-brand-500" />
            Append-Only User Business Actions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="px-3.5 py-3 whitespace-nowrap">Action Event</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Entity</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">User</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-8 text-center text-slate-400 text-xs font-sans">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="px-3.5 py-3.5 font-bold text-brand-600 dark:text-brand-400">{log.action}</td>
                      <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 font-sans">{log.entity_name}</td>
                      <td className="px-3.5 py-3.5 text-slate-800 dark:text-slate-200 font-sans">
                        {log.users?.email || log.user_email || 'admin@shrihari.com'}
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-500 font-sans">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Production Variance & Raw Material Breakdown */}
      <Modal
        isOpen={!!selectedBatchVariance}
        onClose={() => setSelectedBatchVariance(null)}
        title={selectedBatchVariance ? `Material Consumption & Variance: ${selectedBatchVariance.batch_number}` : ''}
        maxWidth="3xl"
      >
        {selectedBatchVariance && (
          <div className="space-y-4">
            {/* Batch Info Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-slate-50 dark:from-factory-800/80 dark:to-factory-800/40 border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedBatchVariance.product_name}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700 text-brand-600 dark:text-brand-400">
                    {selectedBatchVariance.batch_number}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  {selectedBatchVariance.operator_name && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-brand-500" />
                      Operator: {selectedBatchVariance.operator_name}
                    </span>
                  )}
                  {selectedBatchVariance.completion_time && (
                    <span>
                      Completed: {new Date(selectedBatchVariance.completion_time).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-700/80 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Yield</span>
                  <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                    {formatNumber(selectedBatchVariance.yield_percentage)}%
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-700/80 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Output</span>
                  <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {formatNumber(selectedBatchVariance.accepted_output_kg)} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Overuse / Variance Callout Banner */}
            {Number(selectedBatchVariance.input_variance_kg) > 0.001 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold">Input Overuse of +{formatNumber(selectedBatchVariance.input_variance_kg)} kg detected: </span>
                  <span>
                    {(selectedBatchVariance.materials || [])
                      .filter((m: any) => Number(m.variance_kg) > 0.001)
                      .map((m: any) => `"${m.material_name}" exceeded planned recipe by +${formatNumber(m.variance_kg)} kg`)
                      .join('; ') || 'Actual consumption exceeded planned batch input.'}
                  </span>
                </div>
              </div>
            ) : Number(selectedBatchVariance.input_variance_kg) < -0.001 ? (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-bold">Net Material Savings: </span>
                  <span>Total actual consumption was {formatNumber(Math.abs(selectedBatchVariance.input_variance_kg))} kg less than planned formula.</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold">Perfect Formulation Match: </span>
                  <span>Actual raw material usage exactly matched the planned BOM recipe (0.00 kg variance).</span>
                </div>
              </div>
            )}

            {/* High-level Summary Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Planned Input</span>
                <span className="font-mono text-base font-bold text-slate-700 dark:text-slate-300">
                  {formatNumber(selectedBatchVariance.planned_input_kg)} kg
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Actual Input</span>
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  {formatNumber(selectedBatchVariance.actual_input_kg)} kg
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Input Variance</span>
                <span className={`font-mono text-base font-black ${
                  Number(selectedBatchVariance.input_variance_kg) > 0 ? 'text-amber-500' : Number(selectedBatchVariance.input_variance_kg) < 0 ? 'text-blue-500' : 'text-emerald-500'
                }`}>
                  {Number(selectedBatchVariance.input_variance_kg) > 0 ? `+${formatNumber(selectedBatchVariance.input_variance_kg)}` : formatNumber(selectedBatchVariance.input_variance_kg)} kg
                </span>
              </div>
            </div>

            {/* Itemized Material Consumption Table */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-factory-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Raw Material Consumption Table
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedBatchVariance.materials?.length || 0} Materials in Formulation
                </span>
              </div>

              <div className="overflow-x-auto max-h-[45vh]">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-factory-800/30 sticky top-0 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3.5">Material</th>
                      <th className="py-2.5 px-3.5 text-right">Planned (kg)</th>
                      <th className="py-2.5 px-3.5 text-right">Actual Used (kg)</th>
                      <th className="py-2.5 px-3.5 text-right">Variance (kg)</th>
                      <th className="py-2.5 px-3.5 text-right">Deviation</th>
                      <th className="py-2.5 px-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {(selectedBatchVariance.materials || []).map((m: any, idx: number) => {
                      const pKg = Number(m.planned_kg) || 0;
                      const aKg = Number(m.actual_kg) || 0;
                      const diff = Number((aKg - pKg).toFixed(3));
                      const devPct = pKg > 0 ? (diff / pKg) * 100 : 0;
                      const isOver = diff > 0.001;
                      const isUnder = diff < -0.001;

                      return (
                        <tr key={idx} className={isOver ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-factory-800/30'}>
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{m.material_name}</span>
                            {m.material_code && (
                              <span className="text-[10px] text-slate-400 font-mono ml-1.5">({m.material_code})</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatNumber(pKg)} kg
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatNumber(aKg)} kg
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold">
                            <span className={isOver ? 'text-amber-600 dark:text-amber-400' : isUnder ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)} kg
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-[11px]">
                            <span className={isOver ? 'text-amber-600 font-bold' : isUnder ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                              {diff > 0 ? `+${devPct.toFixed(1)}%` : diff < 0 ? `${devPct.toFixed(1)}%` : '0.0%'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {isOver ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <ArrowUpRight className="w-2.5 h-2.5" /> Overused
                              </span>
                            ) : isUnder ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <ArrowDownRight className="w-2.5 h-2.5" /> Underused
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Exact Match
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedBatchVariance(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
