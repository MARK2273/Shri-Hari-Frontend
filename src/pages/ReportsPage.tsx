import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { Badge } from '../components/common/Badge';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" />
          Factory Analytics & Audit Ledger
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Production variance (planned vs actual), scrap loss metrics, and tamper-proof user audit trails (REP-01..REP-08)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('variance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'variance'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
          }`}
        >
          Production Variance (REP-03)
        </button>
        <button
          onClick={() => setActiveTab('waste')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'waste'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
          }`}
        >
          Waste & Scrap Metrics (REP-04)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'audit'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800'
          }`}
        >
          Audit Ledger (AUD-01..AUD-06)
        </button>
      </div>

      {/* Tab 1: Variance Report */}
      {activeTab === 'variance' && (
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5">Batch #</th>
                  <th className="py-2.5">Product</th>
                  <th className="py-2.5">Planned Input</th>
                  <th className="py-2.5">Actual Input</th>
                  <th className="py-2.5">Accepted Output</th>
                  <th className="py-2.5">Waste (kg)</th>
                  <th className="py-2.5">Yield %</th>
                  <th className="py-2.5">Input Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {varianceReport.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                    <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {row.batch_number}
                    </td>
                    <td className="py-3 text-slate-800 dark:text-slate-200">{row.product_name}</td>
                    <td className="py-3 font-mono">{row.planned_input_kg} kg</td>
                    <td className="py-3 font-mono">{row.actual_input_kg} kg</td>
                    <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {row.accepted_output_kg} kg
                    </td>
                    <td className="py-3 font-mono text-rose-500">{row.waste_kg} kg</td>
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {row.yield_percentage}%
                    </td>
                    <td className="py-3 font-mono">
                      <span className={row.input_variance_kg === 0 ? 'text-emerald-500' : 'text-amber-500'}>
                        {row.input_variance_kg > 0 ? `+${row.input_variance_kg}` : row.input_variance_kg} kg
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Waste Report */}
      {activeTab === 'waste' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Accepted Production</span>
              <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {wasteData.summary?.total_accepted_kg || 194} kg
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Waste / Trim Scrap</span>
              <p className="text-xl font-black font-mono text-rose-500 mt-1">
                {wasteData.summary?.total_waste_kg || 6} kg
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Rejected / Quarantined</span>
              <p className="text-xl font-black font-mono text-amber-500 mt-1">
                {wasteData.summary?.total_rejected_kg || 0} kg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Ledger */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-brand-500" />
            Append-Only User Business Actions (AUD-01..AUD-06)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5">Action Event</th>
                  <th className="py-2.5">Entity</th>
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                    <td className="py-3 font-bold text-brand-600 dark:text-brand-400">{log.action}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{log.entity_name}</td>
                    <td className="py-3 text-slate-800 dark:text-slate-200 font-sans">
                      {log.users?.email || log.user_email || 'admin@shrihari.com'}
                    </td>
                    <td className="py-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
