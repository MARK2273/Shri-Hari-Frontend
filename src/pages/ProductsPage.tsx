import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FlaskConical, Calculator, Plus, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [calcQuantityKg, setCalcQuantityKg] = useState<number>(200);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.products || []);
        if (res.data.products?.length > 0) {
          setSelectedProduct(res.data.products[0]);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleCalculateRequirements = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProduct?.active_recipe?.id) return;

    setIsCalcLoading(true);
    try {
      const res = await api.post('/products/calculate-requirements', {
        recipeId: selectedProduct.active_recipe.id,
        quantityKg: calcQuantityKg,
      });
      setCalculationResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to calculate requirements');
    } finally {
      setIsCalcLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProduct?.active_recipe?.id) {
      handleCalculateRequirements();
    }
  }, [selectedProduct, calcQuantityKg]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-brand-500" />
            Product Catalog & Versioned Recipes (BOM)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bill of materials, multi-plastic formulations & automated requirements checking (PRD-01..PRD-08)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Products Catalog ({products.length})
          </h3>
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedProduct?.id === p.id
                  ? 'bg-white dark:bg-factory-900 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                  : 'bg-white/60 dark:bg-factory-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {p.code}
                </span>
                <Badge variant="success">Version {p.active_recipe?.version || 1}</Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{p.name}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{p.description}</p>
            </div>
          ))}
        </div>

        {/* Selected Product Recipe & BOM View */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct && (
            <>
              {/* Recipe BOM Card */}
              <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Formula & Composition: {selectedProduct.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Active Formulation (Version {selectedProduct.active_recipe?.version || 1})
                    </p>
                  </div>
                  <Badge variant="info">Unit: {selectedProduct.unit}</Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Plastic Material Breakdown (% of total batch):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(selectedProduct.active_recipe?.product_recipe_items || selectedProduct.active_recipe?.items || []).map(
                      (item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-700/60"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                              {item.materials?.name || item.material_name}
                            </span>
                            <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400">
                              {item.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-brand-500 h-full rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                            {item.planned_kg_per_kg_output} kg / 1 kg output
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements Pre-Calculation Tool (PRD-05, PRD-06) */}
              <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-brand-500" />
                      Production Requirements & Stock Availability Check
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Calculates required plastic kg and verifies warehouse stock before launching production run.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Planned Output:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        step="10"
                        value={calcQuantityKg}
                        onChange={(e) => setCalcQuantityKg(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-lg text-center"
                      />
                      <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                  </div>
                </div>

                {calculationResult && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <tr>
                            <th className="py-2">Material Type</th>
                            <th className="py-2">Ratio</th>
                            <th className="py-2">Required (kg)</th>
                            <th className="py-2">Available Stock (kg)</th>
                            <th className="py-2 text-right">Feasibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                          {(calculationResult.requirements || []).map((req: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                              <td className="py-2.5 text-slate-800 dark:text-slate-200">
                                {req.material_name}
                              </td>
                              <td className="py-2.5 font-mono">{req.percentage}%</td>
                              <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                {req.required_kg} kg
                              </td>
                              <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                                {req.available_stock_kg} kg
                              </td>
                              <td className="py-2.5 text-right">
                                {req.sufficient ? (
                                  <Badge variant="success">Available</Badge>
                                ) : (
                                  <Badge variant="danger">Shortage</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Total Planned Raw Plastic Input: <strong className="font-mono">{calcQuantityKg} kg</strong>
                      </span>
                      {calculationResult.all_sufficient ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Ready for Production Batch Run
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Insufficient Material in Factory Stock
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
