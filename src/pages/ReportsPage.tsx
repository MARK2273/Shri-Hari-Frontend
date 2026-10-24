import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, History, Trash2, CheckCircle2, User } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatNumber } from '../utils/format';

export const ReportsPage: React.FC = () => {
  const [varianceReport, setVarianceReport] = useState<any[]>([]);
  const [wasteData, setWasteData] = useState<any>({ summary: {}, records: [] });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'variance' | 'waste' | 'audit'>('variance');
  const [isLoading, setIsLoading] = useState(true);

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
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Production variance (planned vs actual), scrap loss metrics, and tamper-proof user audit trails
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('variance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'variance'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
          }`}
        >
          Production Variance
        </button>
        <button
          onClick={() => setActiveTab('waste')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'waste'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
          }`}
        >
          Waste & Scrap Metrics
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'audit'
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
            <table className="w-full text-left text-xs min-w-[780px]">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5 whitespace-nowrap">Batch #</th>
                  <th className="py-2.5 whitespace-nowrap">Operator</th>
                  <th className="py-2.5 whitespace-nowrap">Product</th>
                  <th className="py-2.5 whitespace-nowrap">Planned Input</th>
                  <th className="py-2.5 whitespace-nowrap">Actual Input</th>
                  <th className="py-2.5 whitespace-nowrap">Accepted Output</th>
                  <th className="py-2.5 whitespace-nowrap">Waste (Trim / Plant)</th>
                  <th className="py-2.5 whitespace-nowrap">Yield %</th>
                  <th className="py-2.5 whitespace-nowrap">Input Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {varianceReport.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400 text-xs">
                      No production batch variance records logged yet.
                    </td>
                  </tr>
                ) : (
                  varianceReport.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {row.batch_number}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        {row.operator_name ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                            <User className="w-3 h-3 text-brand-500" />
                            {row.operator_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-800 dark:text-slate-200">{row.product_name}</td>
                      <td className="py-3 font-mono">{formatNumber(row.planned_input_kg)} kg</td>
                      <td className="py-3 font-mono">{formatNumber(row.actual_input_kg)} kg</td>
                      <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(row.accepted_output_kg)} kg
                      </td>
                      <td className="py-3 font-mono">
                        <span className="text-rose-500 font-bold">{formatNumber(row.waste_kg)} kg</span>
                        {(Number(row.trim_waste_kg) > 0 || Number(row.plant_waste_kg) > 0) && (
                          <div className="text-[10px] text-slate-400">
                            Trim: {formatNumber(row.trim_waste_kg)} | Plant: {formatNumber(row.plant_waste_kg)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {formatNumber(row.yield_percentage ?? 100)}%
                      </td>
                      <td className="py-3 font-mono">
                        <span className={Number(row.input_variance_kg) === 0 ? 'text-emerald-500' : 'text-amber-500'}>
                          {Number(row.input_variance_kg) > 0 ? `+${formatNumber(row.input_variance_kg)}` : formatNumber(row.input_variance_kg)} kg
                        </span>
                      </td>
                    </tr>
                  ))
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
              <table className="w-full text-left text-xs min-w-[820px]">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5 whitespace-nowrap">Batch #</th>
                    <th className="py-2.5 whitespace-nowrap">Operator</th>
                    <th className="py-2.5 whitespace-nowrap">Product</th>
                    <th className="py-2.5 whitespace-nowrap">Accepted (kg)</th>
                    <th className="py-2.5 whitespace-nowrap">Trim Waste (kg)</th>
                    <th className="py-2.5 whitespace-nowrap">Plant Waste (kg)</th>
                    <th className="py-2.5 whitespace-nowrap">Total Waste (kg)</th>
                    <th className="py-2.5 whitespace-nowrap">Rejected (kg)</th>
                    <th className="py-2.5 whitespace-nowrap">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {(wasteData.records || []).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-4 text-center text-slate-400 text-xs">
                        No production waste or scrap entries recorded.
                      </td>
                    </tr>
                  ) : (
                    (wasteData.records || []).map((rec: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                        <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {rec.batch_number}
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-300">
                          {rec.operator_name ? (
                            <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                              <User className="w-3 h-3 text-brand-500" />
                              {rec.operator_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-800 dark:text-slate-200">{rec.product_name}</td>
                        <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(rec.accepted_kg)} kg
                        </td>
                        <td className="py-3 font-mono text-amber-500 font-semibold">
                          {formatNumber(rec.trim_waste_kg)} kg
                        </td>
                        <td className="py-3 font-mono text-orange-500 font-semibold">
                          {formatNumber(rec.plant_waste_kg)} kg
                        </td>
                        <td className="py-3 font-mono text-rose-500 font-bold">
                          {formatNumber(rec.waste_kg)} kg
                        </td>
                        <td className="py-3 font-mono text-slate-500">
                          {formatNumber(rec.rejected_kg)} kg
                        </td>
                        <td className="py-3 text-slate-400">
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
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5 whitespace-nowrap">Action Event</th>
                  <th className="py-2.5 whitespace-nowrap">Entity</th>
                  <th className="py-2.5 whitespace-nowrap">User</th>
                  <th className="py-2.5 whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs font-sans">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="py-3 font-bold text-brand-600 dark:text-brand-400">{log.action}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 font-sans">{log.entity_name}</td>
                      <td className="py-3 text-slate-800 dark:text-slate-200 font-sans">
                        {log.users?.email || log.user_email || 'admin@shrihari.com'}
                      </td>
                      <td className="py-3 text-slate-500 font-sans">
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
    </div>
  );
};
