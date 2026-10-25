import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  Workflow,
  Plus,
  Truck,
  Building2,
  Layers,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowRight,
  Package,
  Calendar,
  Send,
  Boxes,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Percent,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import {
  JobWorker,
  JobWorkOutward,
  JobWorkOrder,
  JobWorkReceipt,
  VendorStockSummary,
  SizeMicron,
} from '../types';

export const JobWorkPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'vendors' | 'receipts' | 'outward'>('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');

  // Backend Data State
  const [workers, setWorkers] = useState<JobWorker[]>([]);
  const [vendorBalances, setVendorBalances] = useState<VendorStockSummary[]>([]);
  const [orders, setOrders] = useState<JobWorkOrder[]>([]);
  const [receipts, setReceipts] = useState<JobWorkReceipt[]>([]);
  const [outwardChallans, setOutwardChallans] = useState<JobWorkOutward[]>([]);

  // Auxiliary data for dropdowns
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialBatches, setMaterialBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sizeMicrons, setSizeMicrons] = useState<SizeMicron[]>([]);

  // Modals state
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);

  // Selected Order for Receipt
  const [selectedOrderForReceive, setSelectedOrderForReceive] = useState<JobWorkOrder | null>(null);

  // Pre-selected vendor when opening outward from vendor card
  const [selectedVendorForOutward, setSelectedVendorForOutward] = useState<string>('');

  // 1. Outward Form State
  const [outwardForm, setOutwardForm] = useState({
    vendorId: '',
    materialId: '',
    sourceBatchId: '',
    quantityKg: '',
    dispatchDate: new Date().toISOString().slice(0, 10),
    vehicleNumber: '',
    notes: '',
  });

  // 2. Order Form State
  const [orderForm, setOrderForm] = useState({
    vendorId: '',
    productId: '',
    recipeId: '',
    plannedQuantityKg: '',
    targetSize: '',
    targetMicron: '',
    customerId: '',
    expectedDeliveryDate: '',
    instructions: '',
  });

  // 3. Receive Goods Form State
  const [receiveForm, setReceiveForm] = useState({
    jobWorkOrderId: '',
    acceptedQuantityKg: '',
    scrapQuantityKg: '0',
    deliveryDestination: 'factory_stock' as 'factory_stock' | 'direct_customer',
    customerId: '',
    vehicleNumber: '',
    deliveryDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // 4. Job Worker Form State
  const [workerForm, setWorkerForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  // Fetch all Job Work and reference data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        workersRes,
        balancesRes,
        ordersRes,
        receiptsRes,
        outwardRes,
        materialsRes,
        batchesRes,
        productsRes,
        customersRes,
        sizesRes,
      ] = await Promise.all([
        api.get('/job-work/workers').catch(() => ({ data: { workers: [] } })),
        api.get('/job-work/vendor-stock').catch(() => ({ data: { vendorBalances: [] } })),
        api.get('/job-work/orders').catch(() => ({ data: { orders: [] } })),
        api.get('/job-work/receipts').catch(() => ({ data: { receipts: [] } })),
        api.get('/job-work/outward').catch(() => ({ data: { outwardChallans: [] } })),
        api.get('/materials').catch(() => ({ data: { materials: [] } })),
        api.get('/materials/batches').catch(() => ({ data: { batches: [] } })),
        api.get('/products').catch(() => ({ data: { products: [] } })),
        api.get('/orders/customers').catch(() => ({ data: { customers: [] } })),
        api.get('/size-microns').catch(() => ({ data: { sizeMicrons: [] } })),
      ]);

      setWorkers(workersRes.data.workers || []);
      setVendorBalances(balancesRes.data.vendorBalances || []);
      setOrders(ordersRes.data.orders || []);
      setReceipts(receiptsRes.data.receipts || []);
      setOutwardChallans(outwardRes.data.outwardChallans || []);

      setMaterials(materialsRes.data.materials || []);
      setMaterialBatches(batchesRes.data.batches || []);
      setProducts(productsRes.data.products || []);
      setCustomers(customersRes.data.customers || []);
      setSizeMicrons(sizesRes.data.sizeMicrons || []);
    } catch (err) {
      console.error('Error fetching job work data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalHeldKg = vendorBalances.reduce((sum, v) => sum + (v.total_balance_kg || 0), 0);
    const activeOrders = orders.filter((o) => o.status === 'in_progress' || o.status === 'draft').length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const activeVendors = workers.filter((w) => w.is_active).length;
    return { totalHeldKg, activeOrders, completedOrders, activeVendors };
  }, [vendorBalances, orders, workers]);

  // Available batches for selected material in outward modal
  const availableBatchesForSelectedMat = useMemo(() => {
    if (!outwardForm.materialId) return [];
    return materialBatches.filter(
      (b) => b.material_id === outwardForm.materialId && (b.remaining_quantity_kg || 0) > 0
    );
  }, [materialBatches, outwardForm.materialId]);

  // Selected batch stock balance
  const selectedBatchRemainingKg = useMemo(() => {
    const b = materialBatches.find((item) => item.id === outwardForm.sourceBatchId);
    return b ? Number(b.remaining_quantity_kg) : 0;
  }, [materialBatches, outwardForm.sourceBatchId]);

  // Product recipes for order modal
  const selectedProductRecipes = useMemo(() => {
    if (!orderForm.productId) return [];
    const prod = products.find((p) => p.id === orderForm.productId);
    return prod?.recipes || [];
  }, [products, orderForm.productId]);

  // Selected recipe formulation details
  const selectedRecipe = useMemo(() => {
    if (!orderForm.recipeId) return null;
    return selectedProductRecipes.find((r: any) => r.id === orderForm.recipeId) || null;
  }, [selectedProductRecipes, orderForm.recipeId]);

  // Handle open receive modal
  const handleOpenReceive = (order: JobWorkOrder) => {
    setSelectedOrderForReceive(order);
    const remainingToReceive = Math.max(0, order.planned_quantity_kg - order.received_quantity_kg);
    setReceiveForm({
      jobWorkOrderId: order.id,
      acceptedQuantityKg: remainingToReceive > 0 ? String(remainingToReceive) : String(order.planned_quantity_kg),
      scrapQuantityKg: '0',
      deliveryDestination: 'factory_stock',
      customerId: order.customer_id || '',
      vehicleNumber: '',
      deliveryDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setIsReceiveModalOpen(true);
  };

  // Open Outward with pre-selected vendor
  const handleOpenOutwardForVendor = (vendorId: string) => {
    setSelectedVendorForOutward(vendorId);
    setOutwardForm((prev) => ({
      ...prev,
      vendorId: vendorId,
    }));
    setIsOutwardModalOpen(true);
  };

  // 1. Submit Outward Material Challan
  const handleSubmitOutward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outwardForm.vendorId || !outwardForm.materialId || !outwardForm.quantityKg) {
      alert('Please fill all mandatory fields (Vendor, Material, Quantity).');
      return;
    }

    const qty = parseFloat(outwardForm.quantityKg);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid outward quantity greater than 0.');
      return;
    }

    if (outwardForm.sourceBatchId && qty > selectedBatchRemainingKg) {
      alert(`Entered quantity (${qty} kg) exceeds remaining lot stock (${selectedBatchRemainingKg} kg).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/job-work/outward', {
        vendorId: outwardForm.vendorId,
        materialId: outwardForm.materialId,
        sourceBatchId: outwardForm.sourceBatchId || undefined,
        quantityKg: qty,
        dispatchDate: outwardForm.dispatchDate,
        vehicleNumber: outwardForm.vehicleNumber,
        notes: outwardForm.notes,
      });

      setIsOutwardModalOpen(false);
      setOutwardForm({
        vendorId: '',
        materialId: '',
        sourceBatchId: '',
        quantityKg: '',
        dispatchDate: new Date().toISOString().slice(0, 10),
        vehicleNumber: '',
        notes: '',
      });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to create outward challan:', err);
      alert(err.response?.data?.error || 'Failed to dispatch raw material to vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Job Work Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.vendorId || !orderForm.productId || !orderForm.plannedQuantityKg) {
      alert('Please select Vendor, Target Product, and Planned Quantity.');
      return;
    }

    const plannedKg = parseFloat(orderForm.plannedQuantityKg);
    if (isNaN(plannedKg) || plannedKg <= 0) {
      alert('Planned quantity must be greater than 0 kg.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/job-work/orders', {
        vendorId: orderForm.vendorId,
        productId: orderForm.productId,
        recipeId: orderForm.recipeId || undefined,
        plannedQuantityKg: plannedKg,
        targetSize: orderForm.targetSize || undefined,
        targetMicron: orderForm.targetMicron ? parseFloat(orderForm.targetMicron) : undefined,
        customerId: orderForm.customerId || undefined,
        expectedDeliveryDate: orderForm.expectedDeliveryDate || undefined,
        instructions: orderForm.instructions || undefined,
      });

      setIsOrderModalOpen(false);
      setOrderForm({
        vendorId: '',
        productId: '',
        recipeId: '',
        plannedQuantityKg: '',
        targetSize: '',
        targetMicron: '',
        customerId: '',
        expectedDeliveryDate: '',
        instructions: '',
      });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to issue job work order:', err);
      alert(err.response?.data?.error || 'Failed to create job work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Inward Finished Goods Receipt
  const handleSubmitReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.jobWorkOrderId || !receiveForm.acceptedQuantityKg) {
      alert('Please enter accepted quantity.');
      return;
    }

    const acceptedKg = parseFloat(receiveForm.acceptedQuantityKg);
    const scrapKg = parseFloat(receiveForm.scrapQuantityKg || '0');

    if (isNaN(acceptedKg) || acceptedKg <= 0) {
      alert('Accepted quantity must be greater than 0 kg.');
      return;
    }

    if (receiveForm.deliveryDestination === 'direct_customer' && !receiveForm.customerId) {
      alert('Please select the destination customer for direct delivery.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/job-work/receipts', {
        jobWorkOrderId: receiveForm.jobWorkOrderId,
        acceptedQuantityKg: acceptedKg,
        scrapQuantityKg: isNaN(scrapKg) ? 0 : scrapKg,
        deliveryDestination: receiveForm.deliveryDestination,
        customerId: receiveForm.deliveryDestination === 'direct_customer' ? receiveForm.customerId : undefined,
        vehicleNumber: receiveForm.vehicleNumber || undefined,
        deliveryDate: receiveForm.deliveryDate,
        notes: receiveForm.notes || undefined,
      });

      setIsReceiveModalOpen(false);
      setSelectedOrderForReceive(null);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to receive goods:', err);
      alert(err.response?.data?.error || 'Failed to record inward receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Submit Job Worker
  const handleSubmitWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name.trim()) {
      alert('Please enter vendor / processor company name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/job-work/workers', {
        name: workerForm.name,
        contactPerson: workerForm.contactPerson,
        phone: workerForm.phone,
        email: workerForm.email,
        address: workerForm.address,
      });

      setIsWorkerModalOpen(false);
      setWorkerForm({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
      });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to register worker:', err);
      alert(err.response?.data?.error || 'Failed to register job worker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Filtered Outward Challans
  const filteredOutward = useMemo(() => {
    return outwardChallans.filter((c) => {
      return (
        c.challan_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.material_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [outwardChallans, searchQuery]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      return (
        r.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.job_work_order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [receipts, searchQuery]);

  // Filtered Vendor Balances
  const filteredVendors = useMemo(() => {
    return vendorBalances.filter((v) => {
      return (
        v.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vendorBalances, searchQuery]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-brand-500/20">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Job Work & Outsource Processing
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track external processors, custody material balances, recipe orders, and finished goods
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsWorkerModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Add Processor</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedVendorForOutward('');
              setOutwardForm((prev) => ({ ...prev, vendorId: '' }));
              setIsOutwardModalOpen(true);
            }}
            className="flex items-center gap-2 border-brand-200 dark:border-brand-900/50 hover:bg-brand-50 dark:hover:bg-brand-950/30 text-brand-700 dark:text-brand-300 shadow-sm"
          >
            <Truck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Send Material (Outward)</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Job Work Order</span>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Material Held at Vendors
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalHeldKg.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">kg in custody</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Across {workers.length} registered contract processors
          </p>
        </div>

        <div className="bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Outsource Orders
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.activeOrders}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">orders</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Under active production at vendor plants</p>
        </div>

        <div className="bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fulfilled Outsource Orders
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.completedOrders}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">completed</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Goods received & raw reconciled</p>
        </div>

        <div className="bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Contract Processors
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.activeVendors}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">partners</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Extruders, converters & film makers</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'orders'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Workflow className="w-4 h-4" />
              <span>Job Work Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'vendors'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Material Held by Vendors ({vendorBalances.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'receipts'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inward Receipts ({receipts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('outward')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'outward'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Outward Challans ({outwardChallans.length})</span>
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white"
              />
            </div>

            {activeTab === 'orders' && (
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            )}

            <button
              onClick={fetchData}
              title="Refresh"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: JOB WORK ORDERS */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Workflow className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Job Work Orders</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Create outsource orders to send formulation recipes and specs to external third-party factories.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue First Order</span>
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm min-w-[900px]">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Vendor / Processor</th>
                    <th className="px-4 py-3">Product & Recipe</th>
                    <th className="px-4 py-3">Size & Micron</th>
                    <th className="px-4 py-3 text-right">Planned (kg)</th>
                    <th className="px-4 py-3 text-right">Received (kg)</th>
                    <th className="px-4 py-3 text-right">Scrap (kg)</th>
                    <th className="px-4 py-3">Linked Customer</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredOrders.map((order) => {
                    const progressPercent = Math.min(
                      100,
                      Math.round(((order.received_quantity_kg || 0) / (order.planned_quantity_kg || 1)) * 100)
                    );
                    const isFullyReceived = order.status === 'completed' || progressPercent >= 100;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                            <div>
                              <span>{order.vendor_name}</span>
                              {order.expected_delivery_date && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                                  <Calendar className="w-3 h-3" />
                                  <span>Due: {order.expected_delivery_date}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {order.product_name}
                          </span>
                          {order.recipe_name && (
                            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                              Recipe: {order.recipe_name}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {order.target_size || order.target_micron ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                              {order.target_size ? `${order.target_size}` : ''}
                              {order.target_size && order.target_micron ? ' • ' : ''}
                              {order.target_micron ? `${order.target_micron} µ` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                          {order.planned_quantity_kg.toLocaleString()} kg
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {order.received_quantity_kg.toLocaleString()} kg
                            </span>
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {progressPercent}%
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                          {order.scrap_quantity_kg ? `${order.scrap_quantity_kg.toLocaleString()} kg` : '0 kg'}
                        </td>

                        <td className="px-4 py-3">
                          {order.customer_name ? (
                            <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200 font-medium text-xs">
                              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                              {order.customer_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Own Stock</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {order.status === 'completed' ? (
                            <Badge variant="success">Completed</Badge>
                          ) : order.status === 'in_progress' ? (
                            <Badge variant="info">In Progress</Badge>
                          ) : (
                            <Badge variant="warning">Draft</Badge>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {!isFullyReceived ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReceive(order)}
                              className="text-xs py-1 px-2.5 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                              Receive Goods
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Fulfilled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: MATERIAL HELD BY VENDORS */}
        {activeTab === 'vendors' && (
          <div className="p-4 sm:p-6 space-y-6">
            {filteredVendors.length === 0 ? (
              <div className="text-center py-16">
                <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  No Vendor Balances Recorded
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  When you send raw materials via outward challan, each vendor's custody inventory balance is automatically calculated.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsOutwardModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Send First Outward Lot</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredVendors.map((v) => (
                  <div
                    key={v.vendor_id}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-factory-900 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Vendor Card Header */}
                      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {v.vendor_name}
                            </h3>
                          </div>
                          {v.address && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{v.address}</span>
                            </p>
                          )}
                          {v.contact_person && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span>{v.contact_person} {v.phone ? `(${v.phone})` : ''}</span>
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-400 block uppercase">
                            Total Held Balance
                          </span>
                          <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                            {v.total_balance_kg.toLocaleString()} kg
                          </span>
                        </div>
                      </div>

                      {/* Polymers in Vendor Custody Table */}
                      <div className="mt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Raw Materials in Plant Custody
                        </h4>
                        {v.materials.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">No active raw materials held.</p>
                        ) : (
                          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                                <tr>
                                  <th className="px-3 py-2 text-left">Material</th>
                                  <th className="px-3 py-2 text-right">Sent (kg)</th>
                                  <th className="px-3 py-2 text-right">Consumed (kg)</th>
                                  <th className="px-3 py-2 text-right font-bold">Balance (kg)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {v.materials.map((m) => (
                                  <tr key={m.material_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                                      {m.material_name}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-500">
                                      {m.sent_kg.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">
                                      {m.consumed_kg.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-right font-black text-amber-600 dark:text-amber-400">
                                      {m.balance_kg.toLocaleString()} kg
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenOutwardForVendor(v.vendor_id)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-brand-600" />
                        <span>Send Material to {v.vendor_name.split(' ')[0]}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INWARD RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="overflow-x-auto">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Receipts Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  When goods are received back from job workers, receipt entries with scrap and destination details will appear here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm min-w-[850px]">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Receipt & Date</th>
                    <th className="px-4 py-3">Vendor / Processor</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3 text-right">Accepted (kg)</th>
                    <th className="px-4 py-3 text-right">Scrap (kg)</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Vehicle / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredReceipts.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {r.receipt_number}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {r.delivery_date}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {r.vendor_name}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {r.product_name}
                      </td>

                      <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {r.accepted_quantity_kg.toLocaleString()} kg
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400">
                        {r.scrap_quantity_kg ? `${r.scrap_quantity_kg.toLocaleString()} kg` : '0 kg'}
                      </td>

                      <td className="px-4 py-3">
                        {r.delivery_destination === 'direct_customer' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Truck className="w-3 h-3" />
                              Direct to Customer
                            </span>
                            {r.customer_name && (
                              <div className="text-[11px] text-slate-500 mt-0.5 font-medium pl-1">
                                {r.customer_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Boxes className="w-3 h-3" />
                            Factory Finished Goods
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {r.vehicle_number && (
                          <span className="block font-semibold text-slate-700 dark:text-slate-300">
                            Vehicle: {r.vehicle_number}
                          </span>
                        )}
                        {r.notes && <span className="block italic">{r.notes}</span>}
                        {!r.vehicle_number && !r.notes && <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 4: OUTWARD CHALLANS */}
        {activeTab === 'outward' && (
          <div className="overflow-x-auto">
            {filteredOutward.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Outward Challans</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Outward challans track physical raw material dispatch from your warehouse to third-party factories.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsOutwardModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Outward Challan</span>
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm min-w-[850px]">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Challan & Date</th>
                    <th className="px-4 py-3">Vendor / Processor</th>
                    <th className="px-4 py-3">Material Dispatched</th>
                    <th className="px-4 py-3 text-right">Quantity (kg)</th>
                    <th className="px-4 py-3">Vehicle #</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredOutward.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {c.challan_number}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {c.dispatch_date}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {c.vendor_name}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {c.material_name}
                        </span>
                        {c.source_batch_number && (
                          <span className="text-[11px] text-slate-400">
                            Lot: {c.source_batch_number}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-black text-amber-600 dark:text-amber-400">
                        {c.quantity_kg.toLocaleString()} kg
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {c.vehicle_number || '—'}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500 italic">
                        {c.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: SEND MATERIAL OUTWARD CHALLAN */}
      <Modal
        isOpen={isOutwardModalOpen}
        onClose={() => setIsOutwardModalOpen(false)}
        title="Send Raw Material to Vendor (Outward Challan)"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitOutward} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Select Third-Party Vendor / Processor *
            </label>
            <select
              value={outwardForm.vendorId}
              onChange={(e) => setOutwardForm({ ...outwardForm, vendorId: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Choose Vendor --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.contact_person ? `(${w.contact_person})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Raw Material *
              </label>
              <select
                value={outwardForm.materialId}
                onChange={(e) => {
                  setOutwardForm({
                    ...outwardForm,
                    materialId: e.target.value,
                    sourceBatchId: '',
                  });
                }}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Material --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.current_stock_kg?.toLocaleString() || 0} kg in whs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Warehouse Stock Lot (Deduction Source)
              </label>
              <select
                value={outwardForm.sourceBatchId}
                onChange={(e) => setOutwardForm({ ...outwardForm, sourceBatchId: e.target.value })}
                disabled={!outwardForm.materialId}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              >
                <option value="">-- Optional: Specific Lot --</option>
                {availableBatchesForSelectedMat.map((b) => (
                  <option key={b.id} value={b.id}>
                    Lot {b.batch_number} ({b.remaining_quantity_kg} kg left)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Quantity to Dispatch (kg) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={outwardForm.quantityKg}
                onChange={(e) => setOutwardForm({ ...outwardForm, quantityKg: e.target.value })}
                placeholder="e.g. 1000"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {outwardForm.sourceBatchId && (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Available in this lot: {selectedBatchRemainingKg} kg
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                value={outwardForm.vehicleNumber}
                onChange={(e) => setOutwardForm({ ...outwardForm, vehicleNumber: e.target.value })}
                placeholder="e.g. GJ-05-BX-4921"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Dispatch Date
              </label>
              <input
                type="date"
                value={outwardForm.dispatchDate}
                onChange={(e) => setOutwardForm({ ...outwardForm, dispatchDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Challan Remarks / Instructions
              </label>
              <input
                type="text"
                value={outwardForm.notes}
                onChange={(e) => setOutwardForm({ ...outwardForm, notes: e.target.value })}
                placeholder="e.g. For extrusion run batch #4"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOutwardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Challan...' : 'Confirm Outward Dispatch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ISSUE JOB WORK ORDER */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Issue Outsource Job Work Order"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Assigned Vendor / Processor *
              </label>
              <select
                value={orderForm.vendorId}
                onChange={(e) => setOrderForm({ ...orderForm, vendorId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Vendor --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Target Product to Produce *
              </label>
              <select
                value={orderForm.productId}
                onChange={(e) => {
                  const prodId = e.target.value;
                  const prod = products.find((p) => p.id === prodId);
                  const defaultRec = prod?.recipes?.find((r: any) => r.is_default) || prod?.recipes?.[0];
                  setOrderForm({
                    ...orderForm,
                    productId: prodId,
                    recipeId: defaultRec ? defaultRec.id : '',
                  });
                }}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Formulation Recipe
              </label>
              <select
                value={orderForm.recipeId}
                onChange={(e) => setOrderForm({ ...orderForm, recipeId: e.target.value })}
                disabled={!orderForm.productId || selectedProductRecipes.length === 0}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              >
                <option value="">-- Standard / Default Recipe --</option>
                {selectedProductRecipes.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (v{r.version || 1})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Planned Quantity (kg) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={orderForm.plannedQuantityKg}
                onChange={(e) => setOrderForm({ ...orderForm, plannedQuantityKg: e.target.value })}
                placeholder="e.g. 500"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Recipe Breakdown Banner */}
          {selectedRecipe && selectedRecipe.recipe_items?.length > 0 && (
            <div className="p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 rounded-xl">
              <span className="text-xs font-bold text-brand-800 dark:text-brand-300 flex items-center gap-1.5 mb-1.5">
                <Percent className="w-3.5 h-3.5" />
                Recipe Formulation Composition:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedRecipe.recipe_items.map((it: any, idx: number) => {
                  const mName = materials.find((m) => m.id === it.material_id)?.name || 'Polymer';
                  return (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {mName}: <strong>{it.percentage}%</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Target Size (Dimensions)
              </label>
              <input
                type="text"
                value={orderForm.targetSize}
                onChange={(e) => setOrderForm({ ...orderForm, targetSize: e.target.value })}
                placeholder="e.g. 12x18 inches"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Target Thickness (Microns)
              </label>
              <input
                type="number"
                step="any"
                value={orderForm.targetMicron}
                onChange={(e) => setOrderForm({ ...orderForm, targetMicron: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Linked Customer (Optional)
              </label>
              <select
                value={orderForm.customerId}
                onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- No Direct Customer (Own Stock) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={orderForm.expectedDeliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Processing Instructions for Processor
            </label>
            <textarea
              rows={2}
              value={orderForm.instructions}
              onChange={(e) => setOrderForm({ ...orderForm, instructions: e.target.value })}
              placeholder="e.g. Corona treated on both sides, gusseted bottom"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Placing Order...' : 'Issue Job Work Order'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: RECEIVE FINISHED GOODS */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setSelectedOrderForReceive(null);
        }}
        title="Receive Finished Goods from Job Worker"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitReceive} className="space-y-4">
          {/* Order Info Banner */}
          {selectedOrderForReceive && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedOrderForReceive.product_name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold">
                  {selectedOrderForReceive.vendor_name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Planned:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedOrderForReceive.planned_quantity_kg} kg
                  </strong>
                </span>
                <span>
                  Already Received:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {selectedOrderForReceive.received_quantity_kg} kg
                  </strong>
                </span>
                {selectedOrderForReceive.target_size && (
                  <span>
                    Size:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedOrderForReceive.target_size}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Accepted Output Quantity (kg) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={receiveForm.acceptedQuantityKg}
                onChange={(e) => setReceiveForm({ ...receiveForm, acceptedQuantityKg: e.target.value })}
                required
                placeholder="e.g. 500"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Scrap / Process Loss (kg)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={receiveForm.scrapQuantityKg}
                onChange={(e) => setReceiveForm({ ...receiveForm, scrapQuantityKg: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Delivery Destination Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              Goods Inward / Delivery Destination *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  receiveForm.deliveryDestination === 'factory_stock'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryDestination"
                  checked={receiveForm.deliveryDestination === 'factory_stock'}
                  onChange={() => setReceiveForm({ ...receiveForm, deliveryDestination: 'factory_stock' })}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    Factory Warehouse
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Add directly into Finished Goods inventory
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  receiveForm.deliveryDestination === 'direct_customer'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryDestination"
                  checked={receiveForm.deliveryDestination === 'direct_customer'}
                  onChange={() => setReceiveForm({ ...receiveForm, deliveryDestination: 'direct_customer' })}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    Direct to Customer
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Dispatched directly to client without warehouse storage
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Customer selection if Direct Customer */}
          {receiveForm.deliveryDestination === 'direct_customer' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Select Destination Customer *
              </label>
              <select
                value={receiveForm.customerId}
                onChange={(e) => setReceiveForm({ ...receiveForm, customerId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                value={receiveForm.deliveryDate}
                onChange={(e) => setReceiveForm({ ...receiveForm, deliveryDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                value={receiveForm.vehicleNumber}
                onChange={(e) => setReceiveForm({ ...receiveForm, vehicleNumber: e.target.value })}
                placeholder="e.g. GJ-05-BX-4921"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Receipt Notes / Quality Feedback
            </label>
            <input
              type="text"
              value={receiveForm.notes}
              onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
              placeholder="e.g. Passed thickness & tensile quality check"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Automatic Reconciliation Note */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Automatic Raw Material Deduction:</strong> Confirming receipt will automatically deduct raw polymer from this vendor's held custody balance according to the order recipe!
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsReceiveModalOpen(false);
                setSelectedOrderForReceive(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording Receipt...' : 'Confirm Goods Receipt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: REGISTER JOB WORKER (PROCESSOR) */}
      <Modal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        title="Register Job Worker / Processor"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Company / Factory Name *
            </label>
            <input
              type="text"
              value={workerForm.name}
              onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
              placeholder="e.g. Shivam Polymers & Extruders"
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={workerForm.contactPerson}
              onChange={(e) => setWorkerForm({ ...workerForm, contactPerson: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                placeholder="+91 98250 12345"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={workerForm.email}
                onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                placeholder="contact@shivampolymers.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Plant / Factory Address
            </label>
            <textarea
              rows={2}
              value={workerForm.address}
              onChange={(e) => setWorkerForm({ ...workerForm, address: e.target.value })}
              placeholder="Plot No. 12, GIDC Industrial Area, Vapi, Gujarat"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsWorkerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Job Worker'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JobWorkPage;
