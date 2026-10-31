import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  FlaskConical,
  Calculator,
  Plus,
  CheckCircle,
  AlertTriangle,
  Layers,
  Edit2,
  Trash2,
  GitBranch,
  Box,
  Scale,
  IndianRupee,
  Ruler,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { SizeMicron } from '../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [sizeMicrons, setSizeMicrons] = useState<SizeMicron[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [calcQuantityKg, setCalcQuantityKg] = useState<number>(200);

  // Helper to fetch cost for a given raw material ID
  const getMaterial = (matId: string) => materials.find((m) => m.id === matId);

  const getMaterialCost = (matId: string): number => {
    const mat = getMaterial(matId);
    return Number(mat?.cost_per_kg || mat?.latest_cost_per_kg || mat?.avg_cost_per_kg || 0);
  };

  // Dynamically calculate recipe formulation cost per kg based on composition weights in kg
  // Calculate polymer-wise totals and machine feed distribution across Type A, Type 2 (B), and Type 3 (C)
  const calculatePolymerTotals = (
    items: Array<{
      materialId: string;
      plateA_kg?: number | string;
      plateB_kg?: number | string;
      plateC_kg?: number | string;
      quantityKg?: number | string;
      percentage?: number | string;
    }>
  ) => {
    let sumA = 0;
    let sumB = 0;
    let sumC = 0;
    let totalCost = 0;

    items.forEach((it) => {
      const a = Number(it.plateA_kg ?? 0);
      const b = Number(it.plateB_kg ?? 0);
      const c = Number(it.plateC_kg ?? 0);
      sumA += a;
      sumB += b;
      sumC += c;

      const rowKg = (a + b + c > 0) ? (a + b + c) : (Number(it.quantityKg ?? it.percentage) || 0);
      const matCost = getMaterialCost(it.materialId);
      totalCost += rowKg * matCost;
    });

    const totalMixKg = sumA + sumB + sumC;
    const pctA = totalMixKg > 0 ? Number(((sumA / totalMixKg) * 100).toFixed(1)) : 0;
    const pctB = totalMixKg > 0 ? Number(((sumB / totalMixKg) * 100).toFixed(1)) : 0;
    const pctC = totalMixKg > 0 ? Number(((sumC / totalMixKg) * 100).toFixed(1)) : 0;
    const costPerKg = totalMixKg > 0 ? totalCost / totalMixKg : 0;

    return {
      sumA: Number(sumA.toFixed(3)),
      sumB: Number(sumB.toFixed(3)),
      sumC: Number(sumC.toFixed(3)),
      totalMixKg: Number(totalMixKg.toFixed(3)),
      pctA,
      pctB,
      pctC,
      totalCost: Number(totalCost.toFixed(2)),
      costPerKg: Number(costPerKg.toFixed(2)),
    };
  };

  // Dynamically calculate recipe formulation cost per kg based on composition weights in kg
  const calculateFormulationCost = (items: Array<any>): number => {
    if (!items || items.length === 0) return 0;
    return calculatePolymerTotals(items).costPerKg;
  };

  // Calculate 3-Input Plate distribution (Machine Feed Plates: Type A, B, C)
  const getPlateDistribution = (
    plateA: number | string,
    plateB: number | string,
    plateC: number | string,
    containerTotalKg: number = 0
  ) => {
    const a = Number(plateA) || 0;
    const b = Number(plateB) || 0;
    const c = Number(plateC) || 0;
    const plateSum = Number((a + b + c).toFixed(2));
    const total = containerTotalKg > 0 ? containerTotalKg : (plateSum > 0 ? plateSum : 150);

    const aPct = total > 0 ? Number(((a / total) * 100).toFixed(1)) : 0;
    const bPct = total > 0 ? Number(((b / total) * 100).toFixed(1)) : 0;
    const cPct = total > 0 ? Number(((c / total) * 100).toFixed(1)) : 0;

    return {
      stats: {
        A: { totalKg: a, pct: aPct },
        B: { totalKg: b, pct: bPct },
        C: { totalKg: c, pct: cPct },
      },
      plateSum,
      containerTotal: total,
      diff: Number((plateSum - total).toFixed(2)),
      isBalanced: Math.abs(plateSum - total) < 0.05,
    };
  };

  // Helper backward-compatible adapter
  const getPlateStats = (itemsOrPlateA: any, plateB?: any, plateC?: any, containerTotalKg?: number) => {
    if (Array.isArray(itemsOrPlateA)) {
      const items = itemsOrPlateA;
      const totals = calculatePolymerTotals(items);
      if (totals.sumA > 0 || totals.sumB > 0 || totals.sumC > 0) {
        return {
          stats: {
            A: { totalKg: totals.sumA, pct: totals.pctA, count: 1 },
            B: { totalKg: totals.sumB, pct: totals.pctB, count: 1 },
            C: { totalKg: totals.sumC, pct: totals.pctC, count: 1 },
          },
          totalBatchKg: totals.totalMixKg,
          plateSum: totals.totalMixKg,
          isBalanced: true,
        };
      }
      const totalKg = items.reduce((sum, it) => sum + (Number(it.quantityKg ?? it.percentage) || 0), 0) || 1;
      const a = Number((totalKg * 0.4).toFixed(2));
      const b = Number((totalKg * (40 / 150)).toFixed(2));
      const c = Number((totalKg - a - b).toFixed(2));
      return {
        stats: {
          A: { totalKg: a, pct: 40.0, count: 1 },
          B: { totalKg: b, pct: 26.7, count: 1 },
          C: { totalKg: c, pct: 33.3, count: 1 },
        },
        totalBatchKg: Number(totalKg.toFixed(2)),
        plateSum: Number(totalKg.toFixed(2)),
        isBalanced: true,
      };
    }
    return getPlateDistribution(itemsOrPlateA, plateB, plateC, containerTotalKg || 0);
  };

  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Product Form (NO manual code field - auto-generated by backend)
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    unit: 'kg' | 'pcs' | 'rolls';
    standardWeightKg: number;
    sizeMicron: string;
    initialRecipeItems: Array<{
      materialId: string;
      plateA_kg: number | string;
      plateB_kg: number | string;
      plateC_kg: number | string;
    }>;
  }>({
    name: '',
    description: '',
    unit: 'kg',
    standardWeightKg: 1.0,
    sizeMicron: '',
    initialRecipeItems: [],
  });

  // Recipe Version Form
  const [recipeForm, setRecipeForm] = useState<{
    notes: string;
    items: Array<{
      materialId: string;
      plateA_kg: number | string;
      plateB_kg: number | string;
      plateC_kg: number | string;
    }>;
  }>({
    notes: '',
    items: [],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, matRes, smRes] = await Promise.all([
        api.get('/products'),
        api.get('/materials'),
        api.get('/size-microns'),
      ]);

      const fetchedProducts = prodRes.data.products || [];
      const fetchedMaterials = matRes.data.materials || [];
      const fetchedSizeMicrons = smRes.data.sizeMicrons || [];

      setProducts(fetchedProducts);
      setMaterials(fetchedMaterials);
      setSizeMicrons(fetchedSizeMicrons);

      if (fetchedProducts.length > 0) {
        // Keep selected product if it still exists, else select first
        setSelectedProduct((prev: any) => {
          if (!prev) return fetchedProducts[0];
          const matched = fetchedProducts.find((p: any) => p.id === prev.id);
          return matched || fetchedProducts[0];
        });
      } else {
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error('Failed to load products/materials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate requirements whenever selected product or quantity changes
  const handleCalculateRequirements = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProduct?.active_recipe?.id) {
      setCalculationResult(null);
      return;
    }

    setIsCalcLoading(true);
    try {
      const res = await api.post('/products/calculate-requirements', {
        recipeId: selectedProduct.active_recipe.id,
        quantityKg: calcQuantityKg,
      });
      setCalculationResult(res.data);
    } catch (err: any) {
      console.error('Failed to calculate requirements:', err);
    } finally {
      setIsCalcLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProduct?.active_recipe?.id) {
      handleCalculateRequirements();
    } else {
      setCalculationResult(null);
    }
  }, [selectedProduct, calcQuantityKg]);

  // Open Create Product Modal
  const handleOpenCreateProduct = () => {
    setProductToEdit(null);
    setProductForm({
      name: '',
      description: '',
      unit: 'kg',
      standardWeightKg: 1.0,
      sizeMicron: '',
      initialRecipeItems:
        materials.length > 0
          ? [
            {
              materialId: materials[0].id,
              plateA_kg: 25,
              plateB_kg: 15,
              plateC_kg: 20,
            },
            ...(materials.length > 1
              ? [
                {
                  materialId: materials[1].id,
                  plateA_kg: 20,
                  plateB_kg: 15,
                  plateC_kg: 15,
                },
              ]
              : []),
            ...(materials.length > 2
              ? [
                {
                  materialId: materials[2].id,
                  plateA_kg: 15,
                  plateB_kg: 10,
                  plateC_kg: 15,
                },
              ]
              : []),
          ]
          : [],
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: any) => {
    setProductToEdit(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      unit: prod.unit || 'kg',
      standardWeightKg: Number(prod.standard_weight_kg) || 1.0,
      sizeMicron: prod.size_micron || '',
      initialRecipeItems: [],
    });
    setIsProductModalOpen(true);
  };

  // Save (Create or Update) Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (productToEdit) {
        // Update product details
        await api.put(`/products/${productToEdit.id}`, {
          name: productForm.name,
          description: productForm.description,
          unit: productForm.unit,
          standardWeightKg: productForm.standardWeightKg,
          sizeMicron: productForm.sizeMicron,
        });
      } else {
        // Create new product (NO manual code sent - backend auto-assigns PRD-XXXX)
        const payload: any = {
          name: productForm.name,
          description: productForm.description,
          unit: productForm.unit,
          standardWeightKg: productForm.standardWeightKg,
          sizeMicron: productForm.sizeMicron,
        };

        if (productForm.initialRecipeItems.length > 0) {
          const totals = calculatePolymerTotals(productForm.initialRecipeItems);
          if (totals.totalMixKg <= 0) {
            alert('Validation Error: Please enter a valid quantity for at least one polymer.');
            setIsSubmitting(false);
            return;
          }

          payload.initialRecipe = {
            notes: 'Initial production formulation (V1)',
            plateA_kg: totals.sumA,
            plateB_kg: totals.sumB,
            plateC_kg: totals.sumC,
            totalBatchKg: totals.totalMixKg,
            items: productForm.initialRecipeItems.map((item) => {
              const a = Number(item.plateA_kg) || 0;
              const b = Number(item.plateB_kg) || 0;
              const c = Number(item.plateC_kg) || 0;
              const itemKg = a + b + c;
              const ratio = totals.totalMixKg > 0 ? itemKg / totals.totalMixKg : 0;
              return {
                materialId: item.materialId,
                plateA_kg: a,
                plateB_kg: b,
                plateC_kg: c,
                quantityKg: itemKg,
                percentage: Number((ratio * 100).toFixed(2)),
                plannedKgPerKgOutput: Number(ratio.toFixed(6)),
              };
            }),
          };
        }

        await api.post('/products', payload);
      }

      setIsProductModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setProductToDelete(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open New Recipe Version Modal
  const handleOpenAddRecipe = () => {
    if (!selectedProduct) return;
    const currentItems =
      selectedProduct.active_recipe?.product_recipe_items ||
      selectedProduct.active_recipe?.items ||
      [];
    const rec = selectedProduct.active_recipe;

    setRecipeForm({
      notes: `Revision V${(rec?.version || 1) + 1} optimization`,
      items:
        currentItems.length > 0
          ? currentItems.map((ci: any) => {
            const a = Number(ci.plate_a_kg ?? 0);
            const b = Number(ci.plate_b_kg ?? 0);
            const c = Number(ci.plate_c_kg ?? 0);
            if (a > 0 || b > 0 || c > 0) {
              return {
                materialId: ci.material_id,
                plateA_kg: a,
                plateB_kg: b,
                plateC_kg: c,
              };
            }
            const qty = Number(ci.quantity_kg ?? ci.percentage) || 10;
            return {
              materialId: ci.material_id,
              plateA_kg: Number((qty * 0.4).toFixed(2)),
              plateB_kg: Number((qty * (40 / 150)).toFixed(2)),
              plateC_kg: Number((qty * (50 / 150)).toFixed(2)),
            };
          })
          : materials.length > 0
            ? [{ materialId: materials[0].id, plateA_kg: 5, plateB_kg: 5, plateC_kg: 10 }]
            : [],
    });
    setIsRecipeModalOpen(true);
  };

  // Save New Recipe Version
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const totals = calculatePolymerTotals(recipeForm.items);
      if (totals.totalMixKg <= 0) {
        alert('Validation Error: Total polymer batch quantity must be greater than 0 kg.');
        setIsSubmitting(false);
        return;
      }

      await api.post(`/products/${selectedProduct.id}/recipes`, {
        notes: recipeForm.notes,
        plateA_kg: totals.sumA,
        plateB_kg: totals.sumB,
        plateC_kg: totals.sumC,
        totalBatchKg: totals.totalMixKg,
        items: recipeForm.items.map((i) => {
          const a = Number(i.plateA_kg) || 0;
          const b = Number(i.plateB_kg) || 0;
          const c = Number(i.plateC_kg) || 0;
          const itemKg = a + b + c;
          const ratio = totals.totalMixKg > 0 ? itemKg / totals.totalMixKg : 0;
          return {
            materialId: i.materialId,
            plateA_kg: a,
            plateB_kg: b,
            plateC_kg: c,
            quantityKg: itemKg,
            percentage: Number((ratio * 100).toFixed(2)),
            plannedKgPerKgOutput: Number(ratio.toFixed(6)),
          };
        }),
      });

      setIsRecipeModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add recipe version');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-brand-500" />
            Product Catalog & Versioned Recipes (BOM)
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenCreateProduct}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {products.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
            <FlaskConical className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Manufactured Products in Catalog Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Add your custom finished packaging products and specify their multi-polymer bill of materials (BOM).
            </p>
          </div>
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={handleOpenCreateProduct}
              className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Product
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List Sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Products Catalog ({products.length})
              </h3>
              <button
                onClick={handleOpenCreateProduct}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${isSelected
                      ? 'bg-white dark:bg-factory-900 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                      : 'bg-white/70 dark:bg-factory-900/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-end mb-1">
                      <div className="flex items-center gap-1.5">
                        {p.size_micron && (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200/50">
                            {p.size_micron}
                          </span>
                        )}
                        <Badge variant="success">Version {p.active_recipe?.version || 1}</Badge>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                      {p.description || 'Custom flexible packaging specification.'}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Standard: <strong className="text-slate-700 dark:text-slate-300 font-mono">{p.standard_weight_kg || 1} {p.unit || 'kg'}</strong></span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditProduct(p);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-factory-800"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(p);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Product Detail & Recipe Formulation */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProduct && (
              <>
                {/* Product Header Card */}
                <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedProduct.name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditProduct(selectedProduct)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-factory-800 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => setProductToDelete(selectedProduct)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recipe BOM Card */}
                <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand-500" />
                        <span>Formulation & Bill of Materials (BOM)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Active recipe: Version {selectedProduct.active_recipe?.version || 1} &bull; Effective for production batch consumption
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="px-3 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Recipe Cost / KG</span>
                        <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400">
                          ₹{calculateFormulationCost((selectedProduct.active_recipe?.product_recipe_items || []).map((it: any) => ({ materialId: it.material_id, quantityKg: it.quantity_kg ?? it.percentage }))).toFixed(2)} / kg
                        </span>
                      </div>
                      <button
                        onClick={handleOpenAddRecipe}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-factory-800 hover:bg-brand-50 dark:hover:bg-brand-950/30 text-xs font-bold text-brand-600 dark:text-brand-400 transition-colors shrink-0"
                      >
                        <GitBranch className="w-3 h-3" /> New Recipe Version
                      </button>
                    </div>
                  </div>

                  {/* Plastic Material Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        3-Input Plates Extrusion Distribution (Plates Type A, B & C):
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Container Batch Output: {(selectedProduct.active_recipe?.product_recipe_items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity_kg ?? it.percentage) || 0), 0).toFixed(2)} kg
                      </span>
                    </div>

                    {(!selectedProduct.active_recipe?.product_recipe_items || selectedProduct.active_recipe?.product_recipe_items.length === 0) ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-factory-800 text-center text-xs text-slate-400">
                        No recipe formulation items configured. Click &ldquo;New Recipe Version&rdquo; to define polymers.
                      </div>
                    ) : (
                      (() => {
                        const rec = selectedProduct.active_recipe;
                        const items = rec?.product_recipe_items || [];
                        const containerTotalKg = items.reduce((sum: number, it: any) => {
                          const a = Number(it.plate_a_kg ?? 0);
                          const b = Number(it.plate_b_kg ?? 0);
                          const c = Number(it.plate_c_kg ?? 0);
                          return sum + ((a + b + c > 0) ? (a + b + c) : (Number(it.quantity_kg ?? it.percentage) || 0));
                        }, 0);
                        const hasExplicitPlates = (rec?.plate_a_kg !== undefined && rec?.plate_a_kg !== null && (Number(rec.plate_a_kg) > 0 || Number(rec.plate_b_kg) > 0 || Number(rec.plate_c_kg) > 0));
                        const plateDist = hasExplicitPlates
                          ? getPlateDistribution(rec.plate_a_kg, rec.plate_b_kg, rec.plate_c_kg, rec.total_batch_kg || containerTotalKg)
                          : (rec?.plate_summary
                              ? {
                                  stats: {
                                    A: { totalKg: Number(rec.plate_summary.A?.total_kg ?? 0), pct: Number(rec.plate_summary.A?.percentage ?? 0) },
                                    B: { totalKg: Number(rec.plate_summary.B?.total_kg ?? 0), pct: Number(rec.plate_summary.B?.percentage ?? 0) },
                                    C: { totalKg: Number(rec.plate_summary.C?.total_kg ?? 0), pct: Number(rec.plate_summary.C?.percentage ?? 0) },
                                  },
                                  plateSum: Number(rec.total_batch_kg || containerTotalKg),
                                  totalBatchKg: Number(rec.total_batch_kg || containerTotalKg),
                                  isBalanced: true,
                                  diff: 0
                                }
                              : getPlateStats(items));
                        const { stats } = plateDist;

                        return (
                          <div className="space-y-4">
                            {/* 3-Input Plate Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50/90 to-blue-100/40 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200/90 dark:border-blue-900/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Input Plate: Type A</span>
                                  </div>
                                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                    {stats.A.pct}%
                                  </span>
                                </div>
                                <div className="mt-2.5 flex items-baseline justify-between">
                                  <span className="text-lg font-black font-mono text-blue-950 dark:text-blue-100">
                                    {stats.A.totalKg} <span className="text-xs font-semibold text-blue-500">kg</span>
                                  </span>
                                  <span className="text-[10px] text-blue-600/80 dark:text-blue-400">
                                    Extruder Plate A
                                  </span>
                                </div>
                              </div>

                              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50/90 to-amber-100/40 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/90 dark:border-amber-900/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Input Plate: Type 2 (B)</span>
                                  </div>
                                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                    {stats.B.pct}%
                                  </span>
                                </div>
                                <div className="mt-2.5 flex items-baseline justify-between">
                                  <span className="text-lg font-black font-mono text-amber-950 dark:text-amber-100">
                                    {stats.B.totalKg} <span className="text-xs font-semibold text-amber-500">kg</span>
                                  </span>
                                  <span className="text-[10px] text-amber-600/80 dark:text-amber-400">
                                    Extruder Plate B
                                  </span>
                                </div>
                              </div>

                              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/90 dark:border-emerald-900/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Input Plate: Type 3 (C)</span>
                                  </div>
                                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                    {stats.C.pct}%
                                  </span>
                                </div>
                                <div className="mt-2.5 flex items-baseline justify-between">
                                  <span className="text-lg font-black font-mono text-emerald-950 dark:text-emerald-100">
                                    {stats.C.totalKg} <span className="text-xs font-semibold text-emerald-500">kg</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400">
                                    Extruder Plate C
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Polymer-wise Breakdown by Type */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Polymers Formulated Across Plates Type A, 2 & 3 ({containerTotalKg.toFixed(2)} kg Batch Total):
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Each polymer individually apportioned by plate type
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {items.map((item: any, idx: number) => {
                                  const matCost = getMaterialCost(item.material_id);
                                  const a = Number(item.plate_a_kg ?? 0);
                                  const b = Number(item.plate_b_kg ?? 0);
                                  const c = Number(item.plate_c_kg ?? 0);
                                  const itemKg = (a + b + c > 0) ? (a + b + c) : (Number(item.quantity_kg ?? item.percentage) || 0);
                                  const itemPct = containerTotalKg > 0 ? Number(((itemKg / containerTotalKg) * 100).toFixed(1)) : 0;

                                  return (
                                    <div
                                      key={idx}
                                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5"
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                          Polymer #{idx + 1}
                                        </span>
                                        <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 shrink-0">
                                          {itemKg.toFixed(2)} kg <span className="text-[10px] text-slate-400 font-normal">({itemPct}%)</span>
                                        </span>
                                      </div>
                                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                        {item.materials?.name || item.material_name || `Polymer #${idx + 1}`}
                                      </div>

                                      {/* Individual Plate Type Breakdown */}
                                      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-center font-mono">
                                        <div className="px-1.5 py-1 rounded bg-blue-100/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40">
                                          <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300 block">Type A</span>
                                          <span className="text-xs font-black text-blue-950 dark:text-blue-100">{a} kg</span>
                                        </div>
                                        <div className="px-1.5 py-1 rounded bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40">
                                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 block">Type 2</span>
                                          <span className="text-xs font-black text-amber-950 dark:text-amber-100">{b} kg</span>
                                        </div>
                                        <div className="px-1.5 py-1 rounded bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40">
                                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 block">Type 3</span>
                                          <span className="text-xs font-black text-emerald-950 dark:text-emerald-100">{c} kg</span>
                                        </div>
                                      </div>

                                      <div className="text-[10px] text-slate-400 font-mono space-y-1 pt-1 border-t border-slate-100 dark:border-slate-700/40">
                                        <div className="flex items-center justify-between font-semibold text-slate-600 dark:text-slate-300">
                                          <span>Rate: ₹{matCost.toFixed(2)}/kg</span>
                                          <span className="text-brand-600 dark:text-brand-400">Cost: ₹{(itemKg * matCost).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Requirements Pre-Calculation Tool (PRD-05, PRD-06) */}
                <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-brand-500" />
                        Production Requirements & 3-Plate Extrusion Feasibility Check
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Calculates required polymer weights for Plates Type A, B & C based on planned output.
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
                      {/* 3-Plate Feed Target Cards for entered planned output */}
                      {(() => {
                        const plateData = calculationResult.plate_summary || getPlateStats(calculationResult.requirements || []).stats;
                        const reqA = calculationResult.plate_summary?.A?.required_kg ?? (calcQuantityKg * ((plateData.A?.percentage || plateData.A?.pct || 0) / 100));
                        const reqB = calculationResult.plate_summary?.B?.required_kg ?? (calcQuantityKg * ((plateData.B?.percentage || plateData.B?.pct || 0) / 100));
                        const reqC = calculationResult.plate_summary?.C?.required_kg ?? (calcQuantityKg * ((plateData.C?.percentage || plateData.C?.pct || 0) / 100));
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-factory-800/40 border border-slate-200/80 dark:border-slate-700/60">
                            <div className="text-xs">
                              <span className="font-bold text-blue-700 dark:text-blue-300">Plate Type A Feed:</span>{' '}
                              <strong className="font-mono text-slate-900 dark:text-white">{Number(reqA.toFixed(2))} kg</strong>
                              <span className="text-[10px] text-slate-400 ml-1">({plateData.A?.percentage || plateData.A?.pct || 0}%)</span>
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-amber-700 dark:text-amber-300">Plate Type B Feed:</span>{' '}
                              <strong className="font-mono text-slate-900 dark:text-white">{Number(reqB.toFixed(2))} kg</strong>
                              <span className="text-[10px] text-slate-400 ml-1">({plateData.B?.percentage || plateData.B?.pct || 0}%)</span>
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-emerald-700 dark:text-emerald-300">Plate Type C Feed:</span>{' '}
                              <strong className="font-mono text-slate-900 dark:text-white">{Number(reqC.toFixed(2))} kg</strong>
                              <span className="text-[10px] text-slate-400 ml-1">({plateData.C?.percentage || plateData.C?.pct || 0}%)</span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[650px]">
                          <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <tr>
                              <th className="px-3 py-2.5 whitespace-nowrap">#</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Polymer Material</th>
                              <th className="px-2.5 py-2.5 text-center whitespace-nowrap text-blue-600 dark:text-blue-400">Type A</th>
                              <th className="px-2.5 py-2.5 text-center whitespace-nowrap text-amber-600 dark:text-amber-400">Type 2</th>
                              <th className="px-2.5 py-2.5 text-center whitespace-nowrap text-emerald-600 dark:text-emerald-400">Type 3</th>
                              <th className="px-3 py-2.5 text-right whitespace-nowrap">Recipe Total</th>
                              <th className="px-3 py-2.5 text-right whitespace-nowrap">Required</th>
                              <th className="px-3 py-2.5 text-right whitespace-nowrap">Available Stock</th>
                              <th className="px-3 py-2.5 text-right whitespace-nowrap">Feasibility</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {(calculationResult.requirements || []).map((req: any, i: number) => {
                              const a = Number(req.plate_a_kg || 0);
                              const b = Number(req.plate_b_kg || 0);
                              const c = Number(req.plate_c_kg || 0);
                              const totalRowKg = (a + b + c > 0) ? (a + b + c) : (Number(req.quantity_kg ?? req.percentage) || 0);

                              return (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[10px] text-slate-400">
                                    #{i + 1}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                                    <span className="font-bold">{req.material_name}</span>
                                    {req.material_code && (
                                      <span className="ml-1 text-[10px] text-slate-400 font-mono">({req.material_code})</span>
                                    )}
                                  </td>
                                  <td className="px-2.5 py-2.5 text-center font-mono font-bold text-blue-700 dark:text-blue-300">
                                    {a} kg
                                  </td>
                                  <td className="px-2.5 py-2.5 text-center font-mono font-bold text-amber-700 dark:text-amber-300">
                                    {b} kg
                                  </td>
                                  <td className="px-2.5 py-2.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                    {c} kg
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono font-semibold">
                                    {totalRowKg.toFixed(2)} kg
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    {req.required_kg} kg
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                                    {req.available_stock_kg} kg
                                  </td>
                                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                    {req.sufficient ? (
                                      <Badge variant="success">Available</Badge>
                                    ) : (
                                      <Badge variant="danger">Shortage</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Total Planned Raw Input: <strong className="font-mono">{calcQuantityKg} kg</strong>
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
      )}

      {/* Modal: Create or Edit Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={productToEdit ? `Edit Product: ${productToEdit.name}` : 'Add New Manufactured Product'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Product Title / Packaging Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Layer Milk Pouch Packaging Film (50 Micron)"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Co-extruded film for pouch packaging machines. High dart-impact puncture resistance."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 whitespace-nowrap">
                Standard Unit
              </label>
              <select
                value={productForm.unit}
                onChange={(e: any) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full h-10 text-xs px-3 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="rolls">Rolls</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 whitespace-nowrap">
                Standard Output Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={productForm.standardWeightKg}
                onChange={(e) => setProductForm({ ...productForm, standardWeightKg: parseFloat(e.target.value) || 1.0 })}
                className="w-full h-10 text-xs px-3 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Default Size / Micron dropdown from Master */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 whitespace-nowrap">
                Default Size / Micron
              </label>
              <select
                value={productForm.sizeMicron}
                onChange={(e) => setProductForm({ ...productForm, sizeMicron: e.target.value })}
                className="w-full h-10 text-xs px-3 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
              >
                <option value="">-- None / Select Master --</option>
                {sizeMicrons
                  .filter((sm) => sm.is_active)
                  .map((sm) => (
                    <option key={sm.id} value={sm.label}>
                      {sm.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Initial Recipe Formulation on creation */}
          {!productToEdit && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Recipe Formulation: 3 Extruder Inputs (Type A, Type 2, Type 3)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Enter polymer quantities individually for each machine input plate (Type A, Type 2, and Type 3). The plate totals and master batch mixture are auto-computed.
                </p>
              </div>

              {materials.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                  No raw materials configured yet. You can add materials in &ldquo;Raw Materials&rdquo; tab anytime.
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Raw Polymers Formulation ({productForm.initialRecipeItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm({
                          ...productForm,
                          initialRecipeItems: [
                            ...productForm.initialRecipeItems,
                            { materialId: materials[0].id, plateA_kg: 5, plateB_kg: 5, plateC_kg: 10 },
                          ],
                        })
                      }
                      className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Polymer
                    </button>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {productForm.initialRecipeItems.map((item, index) => {
                      const cost = getMaterialCost(item.materialId);
                      const a = Number(item.plateA_kg) || 0;
                      const b = Number(item.plateB_kg) || 0;
                      const c = Number(item.plateC_kg) || 0;
                      const rowTotalKg = a + b + c;
                      const rowContribution = rowTotalKg * cost;

                      return (
                        <div
                          key={index}
                          className="p-3 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                                #{index + 1}
                              </span>
                              <select
                                value={item.materialId}
                                onChange={(e) => {
                                  const updated = [...productForm.initialRecipeItems];
                                  updated[index].materialId = e.target.value;
                                  setProductForm({ ...productForm, initialRecipeItems: updated });
                                }}
                                className="flex-1 min-w-0 h-9 text-xs px-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium cursor-pointer"
                              >
                                {materials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} — ₹{Number(m.cost_per_kg || 0).toFixed(2)}/kg
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Polymer Total</span>
                                <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400">
                                  {rowTotalKg.toFixed(2)} kg
                                </span>
                              </div>

                              {productForm.initialRecipeItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = productForm.initialRecipeItems.filter((_, i) => i !== index);
                                    setProductForm({ ...productForm, initialRecipeItems: updated });
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                  title="Remove Polymer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 3 Polymer-Wise Inputs: Type A, Type 2, Type 3 */}
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            {/* Type A Input */}
                            <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
                              <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                                <span>Type A Input</span>
                                <span className="text-[9px] text-blue-500 font-mono">Plate A</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  value={item.plateA_kg}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const updated = [...productForm.initialRecipeItems];
                                    updated[index].plateA_kg = raw;
                                    setProductForm({ ...productForm, initialRecipeItems: updated });
                                  }}
                                  className="w-full h-8 text-xs px-2 bg-white dark:bg-factory-900 border border-blue-200 dark:border-blue-800 rounded-lg font-mono text-center font-bold text-blue-950 dark:text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-[10px] font-bold text-blue-600">kg</span>
                              </div>
                            </div>

                            {/* Type 2 / Type B Input */}
                            <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
                              <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                                <span>Type 2 Input</span>
                                <span className="text-[9px] text-amber-500 font-mono">Plate B</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  value={item.plateB_kg}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const updated = [...productForm.initialRecipeItems];
                                    updated[index].plateB_kg = raw;
                                    setProductForm({ ...productForm, initialRecipeItems: updated });
                                  }}
                                  className="w-full h-8 text-xs px-2 bg-white dark:bg-factory-900 border border-amber-200 dark:border-amber-800 rounded-lg font-mono text-center font-bold text-amber-950 dark:text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <span className="text-[10px] font-bold text-amber-600">kg</span>
                              </div>
                            </div>

                            {/* Type 3 / Type C Input */}
                            <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
                              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                                <span>Type 3 Input</span>
                                <span className="text-[9px] text-emerald-500 font-mono">Plate C</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  value={item.plateC_kg}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const updated = [...productForm.initialRecipeItems];
                                    updated[index].plateC_kg = raw;
                                    setProductForm({ ...productForm, initialRecipeItems: updated });
                                  }}
                                  className="w-full h-8 text-xs px-2 bg-white dark:bg-factory-900 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono text-center font-bold text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <span className="text-[10px] font-bold text-emerald-600">kg</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                            <span>Contribution: ₹{rowContribution.toFixed(2)} (@ ₹{cost.toFixed(2)}/kg)</span>
                            <span>Polymer Ratio: {rowTotalKg > 0 ? `${(rowTotalKg / (calculatePolymerTotals(productForm.initialRecipeItems).totalMixKg || 1) * 100).toFixed(1)}%` : '0%'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Polymer & Plate Feed Summary Dashboard */}
                  {(() => {
                    const totals = calculatePolymerTotals(productForm.initialRecipeItems);
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-factory-800/80 dark:to-factory-800/40 border border-slate-200/80 dark:border-slate-700">
                        <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40">
                          <span className="text-[9px] uppercase font-bold text-blue-700 dark:text-blue-300 block">Total Type A Feed</span>
                          <span className="font-mono text-sm font-black text-blue-950 dark:text-blue-100">{totals.sumA} kg</span>
                          <span className="text-[10px] text-blue-600 font-mono ml-1">({totals.pctA}%)</span>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40">
                          <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Total Type 2 Feed</span>
                          <span className="font-mono text-sm font-black text-amber-950 dark:text-amber-100">{totals.sumB} kg</span>
                          <span className="text-[10px] text-amber-600 font-mono ml-1">({totals.pctB}%)</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40">
                          <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Total Type 3 Feed</span>
                          <span className="font-mono text-sm font-black text-emerald-950 dark:text-emerald-100">{totals.sumC} kg</span>
                          <span className="text-[10px] text-emerald-600 font-mono ml-1">({totals.pctC}%)</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Mixture Batch Total</span>
                          <span className="font-mono text-sm font-black text-brand-600 dark:text-brand-400">{totals.totalMixKg} kg</span>
                          <span className="text-[10px] text-slate-400 block font-mono">₹{totals.costPerKg}/kg</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={
                !productToEdit &&
                calculatePolymerTotals(productForm.initialRecipeItems).totalMixKg <= 0
              }
              isLoading={isSubmitting}
              loadingText="Saving Product..."
            >
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add New Recipe Version */}
      <Modal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        title={`New Recipe Formulation: ${selectedProduct?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveRecipe} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Revision Notes & Rationale
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Increased LLDPE by 5% to boost seal strength"
              value={recipeForm.notes}
              onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Raw Polymers Formulation ({recipeForm.items.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Enter polymer quantities individually for Type A, Type 2, and Type 3.
                </span>
              </div>
              {materials.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setRecipeForm({
                      ...recipeForm,
                      items: [
                        ...recipeForm.items,
                        { materialId: materials[0].id, plateA_kg: 5, plateB_kg: 5, plateC_kg: 10 },
                      ],
                    })
                  }
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Polymer
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recipeForm.items.map((item, index) => {
                const cost = getMaterialCost(item.materialId);
                const a = Number(item.plateA_kg) || 0;
                const b = Number(item.plateB_kg) || 0;
                const c = Number(item.plateC_kg) || 0;
                const rowTotalKg = a + b + c;
                const rowContribution = rowTotalKg * cost;

                return (
                  <div
                    key={index}
                    className="p-3 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">#{index + 1}</span>
                        <select
                          value={item.materialId}
                          onChange={(e) => {
                            const updated = [...recipeForm.items];
                            updated[index].materialId = e.target.value;
                            setRecipeForm({ ...recipeForm, items: updated });
                          }}
                          className="flex-1 min-w-0 h-9 text-xs px-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium cursor-pointer"
                        >
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — ₹{Number(m.cost_per_kg || 0).toFixed(2)}/kg
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Polymer Total</span>
                          <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400">
                            {rowTotalKg.toFixed(2)} kg
                          </span>
                        </div>

                        {recipeForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = recipeForm.items.filter((_, i) => i !== index);
                              setRecipeForm({ ...recipeForm, items: updated });
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Remove Polymer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3 Polymer-Wise Inputs: Type A, Type 2, Type 3 */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {/* Type A Input */}
                      <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
                        <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                          <span>Type A Input</span>
                          <span className="text-[9px] text-blue-500 font-mono">Plate A</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={item.plateA_kg}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const updated = [...recipeForm.items];
                              updated[index].plateA_kg = raw;
                              setRecipeForm({ ...recipeForm, items: updated });
                            }}
                            className="w-full h-8 text-xs px-2 bg-white dark:bg-factory-900 border border-blue-200 dark:border-blue-800 rounded-lg font-mono text-center font-bold text-blue-950 dark:text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-[10px] font-bold text-blue-600">kg</span>
                        </div>
                      </div>

                      {/* Type 2 / Type B Input */}
                      <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                          <span>Type 2 Input</span>
                          <span className="text-[9px] text-amber-500 font-mono">Plate B</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={item.plateB_kg}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const updated = [...recipeForm.items];
                              updated[index].plateB_kg = raw;
                              setRecipeForm({ ...recipeForm, items: updated });
                            }}
                            className="w-full h-8 text-xs px-2 bg-white dark:bg-factory-900 border border-amber-200 dark:border-amber-800 rounded-lg font-mono text-center font-bold text-amber-950 dark:text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="text-[10px] font-bold text-amber-600">kg</span>
                        </div>
                      </div>

                      {/* Type 3 / Type C Input */}
                      <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                          <span>Type 3 Input</span>
                          <span className="text-[9px] text-emerald-500 font-mono">Plate C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={item.plateC_kg}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const updated = [...recipeForm.items];
                              updated[index].plateC_kg = raw;
                              setRecipeForm({ ...recipeForm, items: updated });
                            }}
                            className="w-full h-8 text-xs px-2 bg-white dark:bg-factory-900 border border-emerald-200 dark:border-emerald-800 rounded-lg font-mono text-center font-bold text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-[10px] font-bold text-emerald-600">kg</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                      <span>Contribution: ₹{rowContribution.toFixed(2)} (@ ₹{cost.toFixed(2)}/kg)</span>
                      <span>Polymer Ratio: {rowTotalKg > 0 ? `${(rowTotalKg / (calculatePolymerTotals(recipeForm.items).totalMixKg || 1) * 100).toFixed(1)}%` : '0%'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Polymer & Plate Feed Summary Dashboard */}
            {(() => {
              const totals = calculatePolymerTotals(recipeForm.items);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-factory-800/80 dark:to-factory-800/40 border border-slate-200/80 dark:border-slate-700">
                  <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40">
                    <span className="text-[9px] uppercase font-bold text-blue-700 dark:text-blue-300 block">Total Type A Feed</span>
                    <span className="font-mono text-sm font-black text-blue-950 dark:text-blue-100">{totals.sumA} kg</span>
                    <span className="text-[10px] text-blue-600 font-mono ml-1">({totals.pctA}%)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40">
                    <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Total Type 2 Feed</span>
                    <span className="font-mono text-sm font-black text-amber-950 dark:text-amber-100">{totals.sumB} kg</span>
                    <span className="text-[10px] text-amber-600 font-mono ml-1">({totals.pctB}%)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40">
                    <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Total Type 3 Feed</span>
                    <span className="font-mono text-sm font-black text-emerald-950 dark:text-emerald-100">{totals.sumC} kg</span>
                    <span className="text-[10px] text-emerald-600 font-mono ml-1">({totals.pctC}%)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Mixture Batch Total</span>
                    <span className="font-mono text-sm font-black text-brand-600 dark:text-brand-400">{totals.totalMixKg} kg</span>
                    <span className="text-[10px] text-slate-400 block font-mono">₹{totals.costPerKg}/kg</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRecipeModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={
                recipeForm.items.length === 0 ||
                calculatePolymerTotals(recipeForm.items).totalMixKg <= 0
              }
              isLoading={isSubmitting}
              loadingText="Activating..."
            >
              Activate New Version
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Product Confirmation */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Delete Manufactured Product"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <p className="font-bold">Are you sure you want to delete this product?</p>
              <p className="mt-1">
                <strong>{productToDelete?.name}</strong> and all its recipe versions will be removed from your catalog.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setProductToDelete(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmDeleteProduct}
              isLoading={isDeleting}
              loadingText="Deleting..."
              icon={Trash2}
            >
              Yes, Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
