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
  AlertCircle,
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
  Ruler,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  JobWorker,
  JobWorkOutward,
  JobWorkOrder,
  JobWorkReceipt,
  VendorStockSummary,
  SizeMicron,
} from '../types';

export const JobWorkPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'vendors' | 'receipts' | 'outward'>('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');

  // Inline Modal Error State
  const [outwardError, setOutwardError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [workerError, setWorkerError] = useState<string | null>(null);

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

  // Size & Micron sync state
  const [isCustomSizeMicron, setIsCustomSizeMicron] = useState<boolean>(false);
  const [isQuickSizeModalOpen, setIsQuickSizeModalOpen] = useState<boolean>(false);
  const [quickSizeForm, setQuickSizeForm] = useState({
    size: '',
    micron: 50,
    unit: 'Micron',
    label: '50 Micron',
    description: '',
  });
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);

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
    return prod?.product_recipes || prod?.recipes || [];
  }, [products, orderForm.productId]);

  // Selected recipe formulation details
  const selectedRecipe = useMemo(() => {
    if (!orderForm.productId) return null;
    if (orderForm.recipeId) {
      return selectedProductRecipes.find((r: any) => r.id === orderForm.recipeId) || null;
    }
    return selectedProductRecipes.find((r: any) => r.is_active) || selectedProductRecipes[0] || null;
  }, [selectedProductRecipes, orderForm.recipeId, orderForm.productId]);

  // Real-time recipe material stock validation for selected vendor
  const materialValidation = useMemo(() => {
    if (!orderForm.vendorId || !selectedRecipe) {
      return { items: [], hasShortage: false, isReady: false };
    }

    const plannedKg = parseFloat(orderForm.plannedQuantityKg) || 0;
    const vendorBal = vendorBalances.find((v) => v.vendor_id === orderForm.vendorId);
    const vendorMaterials = vendorBal?.materials || [];

    const recipeItems = selectedRecipe.product_recipe_items || selectedRecipe.recipe_items || [];
    if (recipeItems.length === 0) {
      return { items: [], hasShortage: false, isReady: plannedKg > 0 };
    }

    const items = recipeItems.map((item: any) => {
      const mat = materials.find((m) => m.id === item.material_id);
      const matName = mat?.name || item.materials?.name || item.material_name || 'Raw Material';
      const percentage = Number(item.percentage) || 100;
      const requiredKg = Number(((percentage / 100) * (plannedKg > 0 ? plannedKg : 0)).toFixed(2));

      // What the vendor currently holds in hand
      const vendorMat = vendorMaterials.find((vm) => vm.material_id === item.material_id);
      const inHandKg = Number((vendorMat?.balance_kg || 0).toFixed(2));
      const hasEnough = inHandKg > 0 && (plannedKg > 0 ? inHandKg >= requiredKg : true);
      const deficitKg = Number(Math.max(0, requiredKg - inHandKg).toFixed(2));

      return {
        materialId: item.material_id,
        materialName: matName,
        percentage,
        requiredKg,
        inHandKg,
        deficitKg,
        hasEnough,
      };
    });

    const hasShortage = items.some((it: any) => !it.hasEnough);
    return {
      items,
      hasShortage,
      isReady: plannedKg > 0,
    };
  }, [orderForm.vendorId, selectedRecipe, orderForm.plannedQuantityKg, vendorBalances, materials]);

  // Handle open receive modal
  const handleOpenReceive = (order: JobWorkOrder) => {
    setSelectedOrderForReceive(order);
    const remainingToReceive = Math.max(0, order.planned_quantity_kg - order.received_quantity_kg);
    setReceiveError(null);
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
    setOutwardError(null);
    setOutwardForm((prev) => ({
      ...prev,
      vendorId: vendorId,
    }));
    setIsOutwardModalOpen(true);
  };

  // 1. Submit Outward Material Challan
  const handleSubmitOutward = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutwardError(null);

    if (!outwardForm.vendorId || !outwardForm.materialId || !outwardForm.quantityKg) {
      const msg = 'Please select both Vendor, Raw Material, and specify Quantity (kg).';
      setOutwardError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    const qty = parseFloat(outwardForm.quantityKg);
    if (isNaN(qty) || qty <= 0) {
      const msg = 'Please enter a valid outward quantity greater than 0 kg.';
      setOutwardError(msg);
      toast.error(msg, 'Invalid Quantity');
      return;
    }

    if (outwardForm.sourceBatchId && qty > selectedBatchRemainingKg) {
      const msg = `Entered quantity (${qty} kg) exceeds remaining lot stock (${selectedBatchRemainingKg} kg).`;
      setOutwardError(msg);
      toast.error(msg, 'Stock Exceeded');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/job-work/outward', {
        vendorId: outwardForm.vendorId,
        materialId: outwardForm.materialId,
        sourceBatchId: outwardForm.sourceBatchId || undefined,
        quantityKg: qty,
        dispatchDate: outwardForm.dispatchDate,
        vehicleNumber: outwardForm.vehicleNumber,
        notes: outwardForm.notes,
      });

      const challanNum = res.data?.outward?.challan_number || 'Challan';
      toast.success(
        `Dispatched ${qty.toLocaleString()} kg of raw material via ${challanNum}. Warehouse stock deducted.`,
        'Material Dispatched Successfully'
      );

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
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to dispatch raw material to vendor.';
      setOutwardError(errMsg);
      toast.error(errMsg, 'Outward Dispatch Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Job Work Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (!orderForm.vendorId || !orderForm.productId || !orderForm.plannedQuantityKg) {
      const msg = 'Please select Vendor, Target Product, and Planned Quantity.';
      setOrderError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    const plannedKg = parseFloat(orderForm.plannedQuantityKg);
    if (isNaN(plannedKg) || plannedKg <= 0) {
      const msg = 'Planned quantity must be greater than 0 kg.';
      setOrderError(msg);
      toast.error(msg, 'Invalid Quantity');
      return;
    }

    if (materialValidation.hasShortage) {
      const shortageDetails = materialValidation.items
        .filter((it: any) => !it.hasEnough)
        .map((it: any) => `${it.materialName} (Need: ${it.requiredKg} kg, In Hand: ${it.inHandKg} kg)`)
        .join(', ');
      const msg = `Cannot assign order: Selected job worker does not hold the required materials in hand (${shortageDetails}). Please dispatch material outward first.`;
      setOrderError(msg);
      toast.error(msg, 'Material Stock Shortage');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/job-work/orders', {
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

      const orderNum = res.data?.order?.order_number || 'Order';
      toast.success(
        `Job work order ${orderNum} issued for ${plannedKg.toLocaleString()} kg!`,
        'Order Placed Successfully'
      );

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
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to create job work order.';
      setOrderError(errMsg);
      toast.error(errMsg, 'Job Work Order Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Inward Finished Goods Receipt
  const handleSubmitReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveError(null);

    if (!receiveForm.jobWorkOrderId || !receiveForm.acceptedQuantityKg) {
      const msg = 'Please enter accepted finished goods quantity.';
      setReceiveError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    const acceptedKg = parseFloat(receiveForm.acceptedQuantityKg);
    const scrapKg = parseFloat(receiveForm.scrapQuantityKg || '0');

    if (isNaN(acceptedKg) || acceptedKg <= 0) {
      const msg = 'Accepted quantity must be greater than 0 kg.';
      setReceiveError(msg);
      toast.error(msg, 'Invalid Quantity');
      return;
    }

    if (receiveForm.deliveryDestination === 'direct_customer' && !receiveForm.customerId) {
      const msg = 'Please select the destination customer for direct delivery.';
      setReceiveError(msg);
      toast.error(msg, 'Customer Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/job-work/receipts', {
        jobWorkOrderId: receiveForm.jobWorkOrderId,
        acceptedQuantityKg: acceptedKg,
        scrapQuantityKg: isNaN(scrapKg) ? 0 : scrapKg,
        deliveryDestination: receiveForm.deliveryDestination,
        customerId: receiveForm.deliveryDestination === 'direct_customer' ? receiveForm.customerId : undefined,
        vehicleNumber: receiveForm.vehicleNumber || undefined,
        deliveryDate: receiveForm.deliveryDate,
        notes: receiveForm.notes || undefined,
      });

      const receiptNum = res.data?.receipt?.receipt_number || 'Receipt';
      toast.success(
        `Received ${acceptedKg.toLocaleString()} kg finished goods via ${receiptNum}. Vendor raw materials deducted!`,
        'Goods Inward Confirmed'
      );

      setIsReceiveModalOpen(false);
      setSelectedOrderForReceive(null);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to receive goods:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to record inward receipt.';
      setReceiveError(errMsg);
      toast.error(errMsg, 'Inward Receipt Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Submit Job Worker
  const handleSubmitWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorkerError(null);

    if (!workerForm.name.trim()) {
      const msg = 'Please enter vendor / processor company name.';
      setWorkerError(msg);
      toast.error(msg, 'Name Required');
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

      toast.success(
        `Processor "${workerForm.name}" registered successfully!`,
        'Job Worker Added'
      );

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
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to register job worker.';
      setWorkerError(errMsg);
      toast.error(errMsg, 'Registration Error');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-start sm:items-center gap-2.5">
            <Workflow className="w-6 h-6 text-brand-500 shrink-0 mt-0.5 sm:mt-0" />
            <span>Job Work & Outsource Processing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track external processors, custody material balances, recipe orders, and finished goods
          </p>
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
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'orders'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Workflow className="w-4 h-4" />
              <span>Job Work Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'vendors'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Material Held by Vendors ({vendorBalances.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'receipts'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Package className="w-4 h-4" />
              <span>Inward Receipts ({receipts.length})</span>
            </button>

            {/* <button
              onClick={() => setActiveTab('outward')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'outward'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Outward Challans ({outwardChallans.length})</span>
            </button> */}
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
        {/* {activeTab === 'outward' && (
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
        )} */}
      </div>

      {/* MODAL 1: SEND MATERIAL OUTWARD CHALLAN */}
      <Modal
        isOpen={isOutwardModalOpen}
        onClose={() => {
          setIsOutwardModalOpen(false);
          setOutwardError(null);
        }}
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
              onChange={(e) => {
                setOutwardError(null);
                setOutwardForm({ ...outwardForm, vendorId: e.target.value });
              }}
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
                  const selectedMatId = e.target.value;
                  const available = materialBatches.filter(
                    (b) => b.material_id === selectedMatId && (b.remaining_quantity_kg || 0) > 0
                  );
                  setOutwardError(null);
                  setOutwardForm({
                    ...outwardForm,
                    materialId: selectedMatId,
                    sourceBatchId: available[0]?.id || '',
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
                onChange={(e) => {
                  setOutwardError(null);
                  setOutwardForm({ ...outwardForm, sourceBatchId: e.target.value });
                }}
                disabled={!outwardForm.materialId}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              >
                <option value="">
                  {availableBatchesForSelectedMat.length > 0
                    ? '-- Auto-select lot from warehouse --'
                    : '-- No lots with stock in warehouse --'}
                </option>
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
                onChange={(e) => {
                  setOutwardError(null);
                  setOutwardForm({ ...outwardForm, quantityKg: e.target.value });
                }}
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

          {outwardError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{outwardError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsOutwardModalOpen(false);
                setOutwardError(null);
              }}
            >
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

          {/* Recipe Formulation & Real-Time Vendor Stock Availability Check */}
          {selectedRecipe && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                orderForm.vendorId && materialValidation.hasShortage
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                  : orderForm.vendorId && materialValidation.items.length > 0
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-100 dark:border-brand-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    orderForm.vendorId && materialValidation.hasShortage
                      ? 'text-rose-700 dark:text-rose-300'
                      : orderForm.vendorId && materialValidation.items.length > 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-brand-800 dark:text-brand-300'
                  }`}
                >
                  {orderForm.vendorId && materialValidation.hasShortage ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Material Shortage: Cannot Assign Job Work</span>
                    </>
                  ) : orderForm.vendorId && materialValidation.items.length > 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Vendor Stock Verified: Ready to Produce</span>
                    </>
                  ) : (
                    <>
                      <Percent className="w-3.5 h-3.5" />
                      <span>Recipe Formulation Composition</span>
                    </>
                  )}
                </span>

                {orderForm.vendorId && materialValidation.hasShortage && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrderModalOpen(false);
                      handleOpenOutwardForVendor(orderForm.vendorId);
                    }}
                    className="text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" /> Send Materials Outward
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5">
                {orderForm.vendorId && materialValidation.hasShortage
                  ? 'This job worker does not hold the raw material stock required for this recipe. Job work cannot be assigned to them until material is dispatched.'
                  : orderForm.vendorId && materialValidation.items.length > 0
                  ? 'This vendor holds all required recipe ingredients in hand to produce the requested batch quantity.'
                  : 'Select a vendor and enter planned quantity to verify if the vendor holds sufficient material stock.'}
              </p>

              {/* Breakdown per ingredient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {materialValidation.items.map((it: any) => (
                  <div
                    key={it.materialId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      !orderForm.vendorId
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        : it.hasEnough
                        ? 'bg-white/80 dark:bg-slate-800/80 border-emerald-200/80 dark:border-emerald-800/60'
                        : 'bg-white/80 dark:bg-slate-800/80 border-rose-200/80 dark:border-rose-800/60'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {it.materialName} ({it.percentage}%)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {orderForm.plannedQuantityKg && Number(orderForm.plannedQuantityKg) > 0 ? (
                          <>
                            Required: <strong className="font-mono">{it.requiredKg} kg</strong>
                          </>
                        ) : (
                          <span className="italic text-slate-400">Enter planned kg</span>
                        )}
                      </span>
                    </div>

                    <div className="text-right">
                      {orderForm.vendorId ? (
                        <>
                          <span
                            className={`text-[11px] font-bold block font-mono ${
                              it.hasEnough
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            In Hand: {it.inHandKg} kg
                          </span>
                          {it.inHandKg === 0 ? (
                            <span className="text-[10px] font-extrabold text-rose-500 uppercase">
                              Zero Stock ✗
                            </span>
                          ) : it.deficitKg > 0 ? (
                            <span className="text-[10px] font-extrabold text-rose-500 uppercase">
                              Deficit: -{it.deficitKg} kg
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                              In Hand ✓
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">Select Vendor</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Size & Micron Specification Selector from Master */}
          <div className="space-y-2 p-3.5 bg-slate-50/75 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-brand-500" />
                <span>Size & Micron Specification *</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setQuickSizeForm({ size: '', micron: 50, unit: 'Micron', label: '50 Micron', description: '' });
                  setIsQuickSizeModalOpen(true);
                }}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Spec to Master
              </button>
            </div>

            <select
              value={
                isCustomSizeMicron
                  ? '__custom__'
                  : sizeMicrons.find(
                      (sm) =>
                        (sm.size === orderForm.targetSize || sm.label === orderForm.targetSize) &&
                        Number(sm.micron) === Number(orderForm.targetMicron)
                    )?.id ||
                    (orderForm.targetSize || orderForm.targetMicron ? '__custom__' : '')
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  setIsCustomSizeMicron(true);
                } else if (!val) {
                  setIsCustomSizeMicron(false);
                  setOrderForm({ ...orderForm, targetSize: '', targetMicron: '' });
                } else {
                  setIsCustomSizeMicron(false);
                  const selectedSpec = sizeMicrons.find((sm) => sm.id === val);
                  if (selectedSpec) {
                    setOrderForm({
                      ...orderForm,
                      targetSize: selectedSpec.size || selectedSpec.label || '',
                      targetMicron: String(selectedSpec.micron || ''),
                    });
                  }
                }
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium cursor-pointer"
            >
              <option value="">-- Select from Master Size & Micron Catalog --</option>
              {sizeMicrons
                .filter((sm) => sm.is_active !== false)
                .map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.label} {sm.size ? `(${sm.size})` : ''} — {sm.micron} {sm.unit || 'Micron'}
                  </option>
                ))}
              <option value="__custom__">⚙️ Custom / Manual Specification...</option>
            </select>

            {/* Editable Dimensions and Micron inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>Target Dimensions / Size</span>
                  {!isCustomSizeMicron && orderForm.targetSize && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Master Synced
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={orderForm.targetSize}
                  onChange={(e) => {
                    setIsCustomSizeMicron(true);
                    setOrderForm({ ...orderForm, targetSize: e.target.value });
                  }}
                  placeholder="e.g. 600 or 12x18 inches"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>Target Micron (Thickness)</span>
                  {!isCustomSizeMicron && orderForm.targetMicron && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Master Synced
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={orderForm.targetMicron}
                    onChange={(e) => {
                      setIsCustomSizeMicron(true);
                      setOrderForm({ ...orderForm, targetMicron: e.target.value });
                    }}
                    placeholder="e.g. 50"
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">µm</span>
                </div>
              </div>
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

          {orderError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{orderError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsOrderModalOpen(false);
                setOrderError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || (materialValidation.isReady && materialValidation.hasShortage)}
              className={materialValidation.isReady && materialValidation.hasShortage ? 'opacity-60 cursor-not-allowed bg-rose-600 hover:bg-rose-600' : ''}
            >
              {materialValidation.isReady && materialValidation.hasShortage
                ? 'Cannot Issue (Material Shortage)'
                : isSubmitting
                ? 'Placing Order...'
                : 'Issue Job Work Order'}
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
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${receiveForm.deliveryDestination === 'factory_stock'
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
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${receiveForm.deliveryDestination === 'direct_customer'
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

          {receiveError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{receiveError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsReceiveModalOpen(false);
                setSelectedOrderForReceive(null);
                setReceiveError(null);
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
        onClose={() => {
          setIsWorkerModalOpen(false);
          setWorkerError(null);
        }}
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

          {workerError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{workerError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsWorkerModalOpen(false);
                setWorkerError(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Job Worker'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* QUICK ADD SIZE & MICRON MODAL */}
      <Modal
        isOpen={isQuickSizeModalOpen}
        onClose={() => setIsQuickSizeModalOpen(false)}
        title="Add New Size & Micron Specification"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const finalLabel =
              quickSizeForm.label.trim() ||
              (quickSizeForm.size.trim()
                ? `${quickSizeForm.size.trim()} - ${quickSizeForm.micron} ${quickSizeForm.unit}`
                : `${quickSizeForm.micron} ${quickSizeForm.unit}`);

            setIsQuickSaving(true);
            try {
              const res = await api.post('/size-microns', {
                label: finalLabel,
                size: quickSizeForm.size.trim() || 'Standard',
                micron: Number(quickSizeForm.micron),
                unit: quickSizeForm.unit || 'Micron',
                description: quickSizeForm.description.trim(),
                isActive: true,
              });

              toast.success('Size & Micron specification saved to Master catalog!', 'Specification Created');
              const created = res.data.sizeMicron;
              if (created) {
                setSizeMicrons((prev) => [created, ...prev]);
                setOrderForm((prev) => ({
                  ...prev,
                  targetSize: created.size || created.label || '',
                  targetMicron: String(created.micron || ''),
                }));
                setIsCustomSizeMicron(false);
              }
              setIsQuickSizeModalOpen(false);
              setQuickSizeForm({ size: '', micron: 50, unit: 'Micron', label: '50 Micron', description: '' });
              fetchData();
            } catch (err: any) {
              const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to save specification to master.';
              toast.error(msg, 'Save Error');
            } finally {
              setIsQuickSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Specification Label *
            </label>
            <input
              type="text"
              required
              value={quickSizeForm.label}
              onChange={(e) => setQuickSizeForm({ ...quickSizeForm, label: e.target.value })}
              placeholder="e.g. 600 - 20 Micron"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Size / Width / Dimensions
              </label>
              <input
                type="text"
                value={quickSizeForm.size}
                onChange={(e) => {
                  const s = e.target.value;
                  setQuickSizeForm({
                    ...quickSizeForm,
                    size: s,
                    label: s
                      ? `${s} - ${quickSizeForm.micron} ${quickSizeForm.unit}`
                      : `${quickSizeForm.micron} ${quickSizeForm.unit}`,
                  });
                }}
                placeholder="e.g. 600 or 12x18"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Micron Value *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={quickSizeForm.micron}
                onChange={(e) => {
                  const m = Number(e.target.value) || 50;
                  setQuickSizeForm({
                    ...quickSizeForm,
                    micron: m,
                    label: quickSizeForm.size
                      ? `${quickSizeForm.size} - ${m} ${quickSizeForm.unit}`
                      : `${m} ${quickSizeForm.unit}`,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickSizeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isQuickSaving}
            >
              {isQuickSaving ? 'Saving...' : 'Save to Master Catalog'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JobWorkPage;
