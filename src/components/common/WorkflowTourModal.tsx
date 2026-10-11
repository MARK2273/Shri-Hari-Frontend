import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Layers,
  FlaskConical,
  ShoppingCart,
  Factory,
  PackageCheck,
  Truck,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Scale
} from 'lucide-react';

interface WorkflowTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}

export const WorkflowTourModal: React.FC<WorkflowTourModalProps> = ({ isOpen, onClose, initialStep = 0 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Welcome to Shri Hari Packaging ERP',
      subtitle: 'Understanding the Core Manufacturing Flow',
      icon: Sparkles,
      color: 'from-brand-600 to-emerald-500',
      badge: 'Architecture Overview',
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This ERP is purpose-built for <strong>plastic packaging manufacturing</strong>. Every operation revolves around strict traceability, decimal-precision weight tracking in <strong>Kilograms (kg)</strong>, and order-driven job routing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200 dark:border-slate-700/60">
              <Scale className="w-5 h-5 text-brand-500 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">KG Standard Unit</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                All raw plastic, recipes, production, and dispatches are measured in kilograms with decimal precision.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200 dark:border-slate-700/60">
              <ShieldCheck className="w-5 h-5 text-sky-500 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tenant Isolation</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Protected by PostgreSQL Row-Level Security (RLS). Each factory tenant only accesses its own records.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200 dark:border-slate-700/60">
              <Factory className="w-5 h-5 text-amber-500 mb-1.5" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Order-Driven</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                No untracked production. Every batch originates from an active customer order demand.
              </p>
            </div>
          </div>
        </div>
      ),
      actionLabel: 'Start Walkthrough',
      actionRoute: null,
    },
    {
      title: 'Step 1: Receive Raw Plastic (Traceable Lots)',
      subtitle: 'Batch-Level Raw Material Tracking (INV-01..INV-12)',
      icon: Layers,
      color: 'from-emerald-600 to-teal-500',
      badge: 'Inventory Module',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            When resin pellets (HDPE, LDPE, PP, etc.) arrive at the factory:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>
              <strong>Create a Batch:</strong> Enter supplier, supplier lot number, receipt date, and received weight in <strong>kg</strong>.
            </li>
            <li>
              <strong>FIFO Suggestion:</strong> The system tags the earliest lot as <em>FIFO #1</em> to prioritize oldest resin first and prevent degradation.
            </li>
            <li>
              <strong>Minimum Stock Alerts:</strong> If total stock of any grade dips below minimum threshold, real-time alerts warn operations.
            </li>
          </ul>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs">
            💡 <strong>How it links:</strong> This batch ID (e.g. <code>MB-20261001-A1</code>) stays permanently attached to any roll or pouch film made from it.
          </div>
        </div>
      ),
      actionLabel: 'Go to Materials & Batches',
      actionRoute: '/materials',
    },
    {
      title: 'Step 2: Product Catalog & Versioned Recipes',
      subtitle: 'Bill of Materials (BOM) & Pre-Calculations (PRD-01..PRD-08)',
      icon: FlaskConical,
      color: 'from-indigo-600 to-blue-500',
      badge: 'Product Formulation',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Packaging films combine multiple polymers in precise percentages (e.g., 50% HDPE + 30% LDPE + 20% PP):
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>
              <strong>Recipe Versioning:</strong> If formulation changes, historical production preserves the exact recipe used at that date.
            </li>
            <li>
              <strong>Pre-Calculation Tool:</strong> Enter target production kg and the tool instantly checks if factory warehouse has enough stock of each grade.
            </li>
          </ul>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-indigo-800 dark:text-indigo-300 text-xs">
            💡 <strong>How it links:</strong> The active recipe tells the production run exactly how many kg of each plastic type should be consumed.
          </div>
        </div>
      ),
      actionLabel: 'Go to Products & Recipes',
      actionRoute: '/products',
    },
    {
      title: 'Step 3: Customer Orders (Demand Source)',
      subtitle: 'Order-Driven Manufacturing (ORD-01..ORD-09)',
      icon: ShoppingCart,
      color: 'from-sky-600 to-cyan-500',
      badge: 'Sales & Orders',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Customers order specific quantities of finished products in kilograms:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>
              Orders track 3 stages: <strong>1. Ordered KG</strong> ➔ <strong>2. Produced KG</strong> ➔ <strong>3. Dispatched KG</strong>.
            </li>
            <li>
              Supports <strong>partial production runs</strong> and <strong>partial dispatches</strong> across multiple batches.
            </li>
          </ul>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-sky-800 dark:text-sky-300 text-xs">
            💡 <strong>How it links:</strong> Production batches cannot be created in vacuum; they must choose an active customer order line item.
          </div>
        </div>
      ),
      actionLabel: 'Go to Customer Orders',
      actionRoute: '/orders',
    },
    {
      title: 'Step 4: Execute Production & Mass Balance',
      subtitle: 'Lot Consumption, Output & Waste Recording (PRO-01..PRO-13)',
      icon: Factory,
      color: 'from-amber-600 to-orange-500',
      badge: 'Shop Floor Production',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Operators run extrusion/packaging lines to manufacture the order:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>
              <strong>Lot Consumption:</strong> Operator records the exact supplier lots consumed and actual kg used from each.
            </li>
            <li>
              <strong>Output Reconciliation:</strong> Operator enters <strong>Accepted Output kg</strong>, <strong>Trim Waste kg</strong>, and <strong>Rejected kg</strong>.
            </li>
            <li>
              <strong>Atomic Updates:</strong> Confirming production immediately deducts raw plastic from lots and creates finished goods inventory.
            </li>
          </ul>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs">
            💡 <strong>Formula:</strong> <code>Total Raw Input KG = Accepted Output KG + Waste Scrap KG + Rejected KG</code>.
          </div>
        </div>
      ),
      actionLabel: 'Go to Production Runs',
      actionRoute: '/production',
    },
    {
      title: 'Step 5: Finished Goods Inventory',
      subtitle: 'Traceable Warehouse Batches (FG-01..FG-07)',
      icon: PackageCheck,
      color: 'from-purple-600 to-pink-500',
      badge: 'Warehouse Storage',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Finished rolls/pouches are held in the warehouse awaiting dispatch:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>
              Each finished goods batch carries the prefix <code>FG-</code> and references its parent production batch.
            </li>
            <li>
              Tracks <strong>Quantity On-Hand</strong>, <strong>Reserved for Dispatch</strong>, and <strong>Available KG</strong>.
            </li>
          </ul>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-800 dark:text-purple-300 text-xs">
            💡 <strong>Rule:</strong> Finished goods stock is NOT deducted until a delivery is officially confirmed.
          </div>
        </div>
      ),
      actionLabel: 'Go to Finished Goods',
      actionRoute: '/finished-goods',
    },
    {
      title: 'Step 6: Dispatch & Stock Deduction',
      subtitle: 'Delivery Notes & Final Inventory Deduction (DEL-01..DEL-10)',
      icon: Truck,
      color: 'from-rose-600 to-red-500',
      badge: 'Logistics & Dispatch',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Dispatch manager ships orders to client destinations:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
            <li>
              <strong>Delivery Document:</strong> Creates delivery note with vehicle number, destination, and product quantities.
            </li>
            <li>
              <strong>Batch Allocation:</strong> Selects which finished batches are loaded onto the truck for 100% dispatch traceability.
            </li>
            <li>
              <strong>Stock Deduction:</strong> Once confirmed, the system deducts finished inventory and registers an immutable ledger transaction.
            </li>
          </ul>
        </div>
      ),
      actionLabel: 'Go to Dispatch & Delivery',
      actionRoute: '/dispatch',
    },
    {
      title: 'Step 7: 360° Traceability & Variance Reports',
      subtitle: 'Supply Chain Genealogy & Audit Trail (REP-01..REP-08)',
      icon: GitBranch,
      color: 'from-emerald-600 to-sky-500',
      badge: 'Traceability & Quality',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Search any Production Batch # (e.g. <code>PB-20261011-001</code>) to see the full lineage:
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-factory-800/80 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
            <p>1. Customer Order (Amul / Parle)</p>
            <p className="text-brand-500">⬇️</p>
            <p>2. Raw Polymer Lots Consumed (Reliance / IOCL)</p>
            <p className="text-brand-500">⬇️</p>
            <p>3. Production Batch Run (Yield % & Waste kg)</p>
            <p className="text-brand-500">⬇️</p>
            <p>4. Finished Goods Batch</p>
            <p className="text-brand-500">⬇️</p>
            <p>5. Dispatched Vehicle & Customer Destination</p>
          </div>
        </div>
      ),
      actionLabel: 'Go to Full Traceability',
      actionRoute: '/traceability',
    },
  ];

  const current = tourSteps[currentStep];
  const StepIcon = current.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNavigateStep = (route: string | null) => {
    if (route) {
      onClose();
      navigate(route);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Modal Top Header with Step Indicator */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interactive Factory Tour ({currentStep + 1} of {tourSteps.length})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-brand-500 h-1 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          ></div>
        </div>

        {/* Tour Body */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${current.color} text-white flex items-center justify-center shadow-lg shrink-0`}
            >
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-1">
                {current.badge}
              </span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {current.title}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {current.subtitle}
              </p>
            </div>
          </div>

          <div className="pt-2">{current.content}</div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-factory-950/40">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {current.actionRoute && (
              <button
                onClick={() => handleNavigateStep(current.actionRoute)}
                className="px-3.5 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 rounded-xl transition-colors border border-brand-200 dark:border-brand-800/40"
              >
                {current.actionLabel}
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
