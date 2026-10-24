import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShoppingCart,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Package,
  Users,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  AlertTriangle,
  IndianRupee,
  Ruler,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { SizeMicron } from '../types';

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'sizeMicrons'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [sizeMicrons, setSizeMicrons] = useState<SizeMicron[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Size/Micron Master states
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [isQuickSizeModalOpen, setIsQuickSizeModalOpen] = useState(false);
  const [quickSizeForm, setQuickSizeForm] = useState({
    size: '',
    micron: 50,
    unit: 'Micron',
    label: '50 Micron',
    description: '',
  });
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [sizeMicronSearch, setSizeMicronSearch] = useState('');
  const [sizeToEdit, setSizeToEdit] = useState<SizeMicron | null>(null);
  const [sizeToDelete, setSizeToDelete] = useState<SizeMicron | null>(null);

  // Form state: Order
  const [orderForm, setOrderForm] = useState<{
    customerId: string;
    orderNumber: string;
    requiredDeliveryDate: string;
    grade: string;
    sizeMicron: string;
    sellingPricePerKg: number | '';
    notes: string;
    productId: string;
    requestedQuantityKg: number;
  }>({
    customerId: '',
    orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${Math.floor(Math.random() * 90 + 10)}`,
    requiredDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    grade: '',
    sizeMicron: '',
    sellingPricePerKg: '',
    notes: '',
    productId: '',
    requestedQuantityKg: 500,
  });

  // Calculate product formulation BOM cost per kg dynamically
  const getProductRecipeCost = (product: any): number => {
    if (!product) return 0;
    if (product.recipe_cost_per_kg && Number(product.recipe_cost_per_kg) > 0) {
      return Number(product.recipe_cost_per_kg);
    }
    const activeRecipe =
      product.active_recipe ||
      product.product_recipes?.find((r: any) => r.is_active) ||
      product.product_recipes?.[0];
    if (!activeRecipe?.product_recipe_items?.length) return 0;

    return activeRecipe.product_recipe_items.reduce((sum: number, it: any) => {
      const mat = materials.find((m) => m.id === it.material_id);
      const cost = Number(mat?.cost_per_kg || mat?.latest_cost_per_kg || mat?.avg_cost_per_kg || 0);
      const ratio = (Number(it.percentage) || 0) / 100;
      return sum + ratio * cost;
    }, 0);
  };

  // Form state: Customer Details
  const [customerForm, setCustomerForm] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    billingAddress: '',
    deliveryAddress: '',
    isActive: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordRes, custRes, prdRes, matRes, smRes] = await Promise.all([
        api.get('/orders'),
        api.get('/orders/customers'),
        api.get('/products'),
        api.get('/materials'),
        api.get('/size-microns'),
      ]);
      const fetchedCustomers = custRes.data.customers || [];
      const fetchedProducts = prdRes.data.products || [];
      const fetchedMaterials = matRes.data.materials || [];
      const fetchedSizeMicrons = smRes.data.sizeMicrons || [];

      setOrders(ordRes.data.orders || []);
      setCustomers(fetchedCustomers);
      setProducts(fetchedProducts);
      setMaterials(fetchedMaterials);
      setSizeMicrons(fetchedSizeMicrons);

      if (fetchedCustomers.length > 0 && !orderForm.customerId) {
        setOrderForm((prev) => ({ ...prev, customerId: fetchedCustomers[0].id }));
      }
      if (fetchedProducts.length > 0 && !orderForm.productId) {
        setOrderForm((prev) => ({ ...prev, productId: fetchedProducts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load orders data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Customer Management: Open Create Modal
  const handleOpenCreateCustomer = () => {
    setCustomerToEdit(null);
    setCustomerForm({
      code: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      billingAddress: '',
      deliveryAddress: '',
      isActive: true,
    });
    setIsCustomerModalOpen(true);
  };

  // Customer Management: Open Edit Modal
  const handleOpenEditCustomer = (cust: any) => {
    setCustomerToEdit(cust);
    setCustomerForm({
      code: cust.code,
      name: cust.name,
      contactPerson: cust.contact_person || '',
      phone: cust.phone || '',
      email: cust.email || '',
      billingAddress: cust.billing_address || '',
      deliveryAddress: cust.delivery_address || '',
      isActive: cust.is_active !== false,
    });
    setIsCustomerModalOpen(true);
  };

  // Customer Management: Save (Create or Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (customerToEdit) {
        await api.put(`/orders/customers/${customerToEdit.id}`, {
          name: customerForm.name,
          contactPerson: customerForm.contactPerson,
          phone: customerForm.phone,
          email: customerForm.email,
          billingAddress: customerForm.billingAddress,
          deliveryAddress: customerForm.deliveryAddress,
          isActive: customerForm.isActive,
        });
      } else {
        const res = await api.post('/orders/customers', {
          name: customerForm.name,
          contactPerson: customerForm.contactPerson,
          phone: customerForm.phone,
          email: customerForm.email,
          billingAddress: customerForm.billingAddress,
          deliveryAddress: customerForm.deliveryAddress,
        });
        if (res.data?.customer?.id) {
          setOrderForm((prev) => ({ ...prev, customerId: res.data.customer.id }));
        }
      }
      setIsCustomerModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save customer details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer Management: Delete
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/orders/customers/${customerToDelete.id}`);
      setCustomerToDelete(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customerId) {
      alert('Please select or add a customer first.');
      return;
    }
    if (!orderForm.productId) {
      alert('Please select a product. If none exist, configure a product first.');
      return;
    }
    const sellPrice = parseFloat(String(orderForm.sellingPricePerKg));
    if (!sellPrice || sellPrice <= 0) {
      alert('Please enter a valid Selling Price Per KG greater than 0.');
      return;
    }

    const selectedProduct = products.find((p) => p.id === orderForm.productId);
    const recipeCost = getProductRecipeCost(selectedProduct);

    setIsSubmitting(true);
    try {
      await api.post('/orders', {
        customerId: orderForm.customerId,
        requiredDeliveryDate: orderForm.requiredDeliveryDate,
        grade: orderForm.grade,
        sizeMicron: orderForm.sizeMicron,
        sellingPricePerKg: sellPrice,
        recipeCostPerKg: recipeCost,
        notes: orderForm.notes,
        items: [
          {
            productId: orderForm.productId,
            requestedQuantityKg: orderForm.requestedQuantityKg,
            sellingPricePerKg: sellPrice,
            recipeCostPerKg: recipeCost,
            grade: orderForm.grade,
            sizeMicron: orderForm.sizeMicron,
            notes: orderForm.notes,
          },
        ],
      });
      setIsOrderModalOpen(false);
      setOrderForm((prev) => ({
        ...prev,
        grade: '',
        sizeMicron: '',
        sellingPricePerKg: '',
        notes: '',
        requestedQuantityKg: 500,
      }));
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create order');
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
            <ShoppingCart className="w-6 h-6 text-brand-500" />
            Customer Orders & Production Demand
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Order-driven manufacturing workflow. All production batches link back to confirmed orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreateCustomer}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-factory-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-brand-500" />
            Add Customer
          </button>

          <button
            onClick={() => {
              if (customers.length === 0) {
                handleOpenCreateCustomer();
              } else {
                setIsOrderModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Customer Order
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Orders vs Customer Directory vs Size & Micron Master */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3 sm:gap-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${activeTab === 'orders'
            ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Active Orders & Demand ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${activeTab === 'customers'
            ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Directory & Accounts ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sizeMicrons')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${activeTab === 'sizeMicrons'
            ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Ruler className="w-4 h-4 text-brand-500" />
          <span>Size & Micron Master ({sizeMicrons.length})</span>
        </button>
      </div>

      {/* Tab 1: Orders List */}
      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <ShoppingCart className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Customer Orders Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Customer orders drive the factory's production schedule. All production jobs and batch outputs are linked to orders.
              </p>
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={() => {
                    if (customers.length === 0) {
                      handleOpenCreateCustomer();
                    } else {
                      setIsOrderModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-4 h-4" />
                  {customers.length === 0 ? 'Add Customer First' : 'Create Customer Order'}
                </button>
              </div>
            </div>
          ) : (
            orders.map((order) => {
              const item = order.customer_order_items?.[0] || order.items?.[0] || {};
              const productName = item.products?.name || products.find((p) => p.id === item.product_id)?.name;
              const orderGrade = order.grade || item.grade;
              const orderSizeMicron = order.size_micron || order.sizeMicron || item.size_micron || item.sizeMicron;
              const requested = Number(item.requested_quantity_kg || order.total_requested_weight_kg || 0);
              const produced = Number(item.produced_quantity_kg || 0);
              const dispatched = Number(item.dispatched_quantity_kg || 0);

              const prodPercent = requested > 0 ? Math.min(100, Math.round((produced / requested) * 100)) : 0;
              const dispPercent = requested > 0 ? Math.min(100, Math.round((dispatched / requested) * 100)) : 0;

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {order.order_number}
                        </span>
                        <Badge
                          variant={
                            order.status === 'completed'
                              ? 'success'
                              : order.status === 'in_production' || order.status === 'partially_produced'
                                ? 'warning'
                                : 'info'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
                        <span>Customer: {order.customers?.name || order.customer_name || 'Direct Client'}</span>
                        {order.customers?.contact_person && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({order.customers.contact_person})
                          </span>
                        )}
                      </h3>
                      {order.customers?.delivery_address && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{order.customers.delivery_address}</span>
                        </p>
                      )}

                      {/* Product Specifications: Product, Grade, Size / Micron */}
                      {(productName || orderGrade || orderSizeMicron || (order.notes && !order.notes.startsWith('{'))) && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {productName && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-factory-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <Package className="w-3 h-3 text-brand-500" />
                              {productName}
                            </span>
                          )}
                          {orderGrade && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                              <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Grade:</span>
                              {orderGrade}
                            </span>
                          )}
                          {orderSizeMicron && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                              <span className="text-[10px] uppercase font-semibold text-sky-600 dark:text-sky-400">Size / Micron:</span>
                              {orderSizeMicron}
                            </span>
                          )}
                          {Number(order.selling_price_per_kg || item.selling_price_per_kg) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
                              <span className="text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400">Sell:</span>
                              ₹{Number(order.selling_price_per_kg || item.selling_price_per_kg).toFixed(2)}/kg
                            </span>
                          )}
                          {Number(order.recipe_cost_per_kg || item.recipe_cost_per_kg) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-factory-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] uppercase font-semibold text-slate-500">BOM Cost:</span>
                              ₹{Number(order.recipe_cost_per_kg || item.recipe_cost_per_kg).toFixed(2)}/kg
                            </span>
                          )}
                          {order.notes && !order.notes.startsWith('{') && (
                            <span className="text-[11px] text-slate-400 italic">
                              "{order.notes}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Order Date: {order.order_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Target Delivery: {order.required_delivery_date}</span>
                      </div>
                      <div className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-lg border border-brand-200 dark:border-brand-800/40 flex items-center gap-2">
                        <span>Total: {order.total_requested_weight_kg} kg</span>
                        {Number(order.total_order_value) > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 border-l border-brand-200 dark:border-brand-800/60 pl-2">
                            ₹{Number(order.total_order_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Tracking (Ordered -> Produced -> Dispatched) */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">1. Ordered</span>
                      <p className="font-mono text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {requested} kg
                      </p>
                      <p className="text-[10px] text-slate-400">100% Demand</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">2. Produced</span>
                        <span className="text-[10px] font-mono font-bold text-amber-500">{prodPercent}%</span>
                      </div>
                      <p className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {produced} kg
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${prodPercent}%` }}></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">3. Dispatched</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-500">{dispPercent}%</span>
                      </div>
                      <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {dispatched} kg
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dispPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'customers' ? (
        /* Tab 2: Customer Directory & Accounts */
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Client Directory ({customers.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Manage registered customer companies, procurement contacts, delivery destinations, and accounts.
              </p>
            </div>

            <button
              onClick={handleOpenCreateCustomer}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>

          {customers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No customers registered yet. Click "Add Customer" to register client accounts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5 whitespace-nowrap">Code</th>
                    <th className="py-2.5 whitespace-nowrap">Company Name</th>
                    <th className="py-2.5 whitespace-nowrap">Contact Person</th>
                    <th className="py-2.5 whitespace-nowrap">Phone & Email</th>
                    <th className="py-2.5 whitespace-nowrap">Delivery Address</th>
                    <th className="py-2.5 whitespace-nowrap">Status</th>
                    <th className="py-2.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cust.code}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                        {cust.name}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {cust.contact_person || '—'}
                      </td>
                      <td className="py-3 text-slate-500 space-y-0.5">
                        {cust.phone && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                        {cust.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{cust.email}</span>
                          </div>
                        )}
                        {!cust.phone && !cust.email && '—'}
                      </td>
                      <td className="py-3 text-slate-500 max-w-xs truncate" title={cust.delivery_address}>
                        {cust.delivery_address || '—'}
                      </td>
                      <td className="py-3">
                        <Badge variant={cust.is_active !== false ? 'success' : 'neutral'}>
                          {cust.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditCustomer(cust)}
                            className="p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(cust)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-lg transition-colors"
                            title="Delete Customer"
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
          )}
        </div>
      ) : (
        /* Tab 3: Size & Micron Master Management */
        <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Size & Micron Specification Master ({sizeMicrons.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Manage standard film gauges (microns), dimensions, and packaging sizes populated in order dropdowns.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSizeToEdit(null);
                  setQuickSizeForm({ size: '', micron: 50, unit: 'Micron', label: '50 Micron', description: '' });
                  setIsQuickSizeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Specification</span>
              </button>
            </div>
          </div>

          {/* Search bar inside Tab 3 */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by label, size, micron..."
              value={sizeMicronSearch}
              onChange={(e) => setSizeMicronSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5 whitespace-nowrap">Dropdown Label</th>
                  <th className="py-2.5 whitespace-nowrap">Thickness / Gauge</th>
                  <th className="py-2.5 whitespace-nowrap">Size / Dimensions</th>
                  <th className="py-2.5 whitespace-nowrap">Description</th>
                  <th className="py-2.5 whitespace-nowrap text-center">Status</th>
                  <th className="py-2.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {sizeMicrons
                  .filter((sm) => {
                    if (!sizeMicronSearch.trim()) return true;
                    const q = sizeMicronSearch.toLowerCase();
                    return (
                      sm.label.toLowerCase().includes(q) ||
                      (sm.size && sm.size.toLowerCase().includes(q)) ||
                      String(sm.micron).includes(q)
                    );
                  })
                  .map((sm) => (
                    <tr key={sm.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-[11px]">
                            {sm.micron}
                          </span>
                          <span>{sm.label}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                          {sm.micron} {sm.unit || 'Micron'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {sm.size || 'Standard'}
                      </td>
                      <td className="py-3 text-slate-500 max-w-xs truncate">
                        {sm.description || '—'}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={sm.is_active ? 'success' : 'neutral'}>
                          {sm.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSizeToEdit(sm);
                              setQuickSizeForm({
                                size: sm.size || '',
                                micron: Number(sm.micron) || 50,
                                unit: sm.unit || 'Micron',
                                label: sm.label,
                                description: sm.description || '',
                              });
                              setIsQuickSizeModalOpen(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-factory-800"
                            title="Edit specification"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSizeToDelete(sm)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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

      {/* Modal: Add or Edit Customer Details */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={customerToEdit ? `Edit Customer: ${customerToEdit.name}` : 'Add New Customer Company'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company / Client Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Amul Dairy Foods Ltd."
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vikram Mehta (Procurement)"
                value={customerForm.contactPerson}
                onChange={(e) => setCustomerForm({ ...customerForm, contactPerson: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone / Mobile
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. orders@amuldairy.com"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Delivery / Unloading Destination Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Central Packaging Warehouse, Plant #4, Anand Industrial Estate, Gujarat"
              value={customerForm.deliveryAddress}
              onChange={(e) => setCustomerForm({ ...customerForm, deliveryAddress: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Used on logistics delivery notes and dispatch slips.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Billing / GST Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Registered Corporate Office, Anand, Gujarat - 388001"
              value={customerForm.billingAddress}
              onChange={(e) => setCustomerForm({ ...customerForm, billingAddress: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none"
            />
          </div>

          {customerToEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCustomerActive"
                checked={customerForm.isActive}
                onChange={(e) => setCustomerForm({ ...customerForm, isActive: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="isCustomerActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active for new customer orders & dispatch
              </label>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Saving Customer..."
            >
              {customerToEdit ? 'Save Changes' : 'Create Customer Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Customer Confirmation */}
      <Modal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        title="Delete Customer Account"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <p className="font-bold">Are you sure you want to delete this customer?</p>
              <p className="mt-1">
                <strong>{customerToDelete?.name}</strong> ({customerToDelete?.code}) will be permanently removed from your client directory.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setCustomerToDelete(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmDeleteCustomer}
              isLoading={isDeleting}
              loadingText="Deleting..."
              icon={Trash2}
            >
              Yes, Delete Customer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Create Customer Order */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Customer Order"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Customer *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsOrderModalOpen(false);
                  handleOpenCreateCustomer();
                }}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add New Customer
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">No customers registered yet</p>
                  <p className="text-[11px] opacity-80">You need to register at least one customer to place orders.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOrderModalOpen(false);
                    handleOpenCreateCustomer();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs shrink-0 hover:bg-amber-600 transition-colors"
                >
                  Add Customer
                </button>
              </div>
            ) : (
              <select
                required
                value={orderForm.customerId}
                onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="" disabled>-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Required Delivery Date *
            </label>
            <input
              type="date"
              required
              value={orderForm.requiredDeliveryDate}
              onChange={(e) => setOrderForm({ ...orderForm, requiredDeliveryDate: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ordered Product *
              </label>
              {products.length === 0 ? (
                <div className="p-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  No products in catalog yet. Please add a product in Products & Recipes.
                </div>
              ) : (
                <select
                  required
                  value={orderForm.productId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    const prod = products.find((p) => p.id === chosenId);
                    setOrderForm({
                      ...orderForm,
                      productId: chosenId,
                      sizeMicron: prod?.size_micron || orderForm.sizeMicron,
                    });
                  }}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="" disabled>-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Weight (kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="1"
                  required
                  value={orderForm.requestedQuantityKg}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, requestedQuantityKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">kg</span>
              </div>
            </div>
          </div>

          {/* Grade & Size / Micron */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grade
              </label>
              <input
                type="text"
                placeholder="Enter grade (e.g. HDPE, Virgin, Relene 010F18)"
                value={orderForm.grade}
                onChange={(e) => setOrderForm({ ...orderForm, grade: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Size / Micron Dropdown directly fetched from Master */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Size / Micron *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSizeToEdit(null);
                    setQuickSizeForm({ size: '', micron: 50, unit: 'Micron', label: '50 Micron', description: '' });
                    setIsQuickSizeModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add New
                </button>
              </div>

              <select
                value={
                  sizeMicrons.some((sm) => sm.label === orderForm.sizeMicron)
                    ? orderForm.sizeMicron
                    : orderForm.sizeMicron
                      ? '__custom__'
                      : ''
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setIsCustomSize(true);
                  } else {
                    setIsCustomSize(false);
                    setOrderForm({ ...orderForm, sizeMicron: val });
                  }
                }}
                className="w-full h-10 text-xs px-3 bg-slate-50 dark:bg-factory-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
              >
                <option value="">-- Select Size / Micron from Master --</option>
                {sizeMicrons
                  .filter((sm) => sm.is_active)
                  .map((sm) => (
                    <option key={sm.id} value={sm.label}>
                      {sm.label} {sm.description ? `(${sm.description})` : ''}
                    </option>
                  ))}
                <option value="__custom__">➕ Custom Specification...</option>
              </select>

              {(isCustomSize || (!sizeMicrons.some((sm) => sm.label === orderForm.sizeMicron) && orderForm.sizeMicron)) && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter custom size / micron (e.g. 50 Micron, 24x36)"
                    value={orderForm.sizeMicron}
                    onChange={(e) => setOrderForm({ ...orderForm, sizeMicron: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-brand-500 rounded-xl ring-2 ring-brand-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tip: Click &quot;Add Master&quot; above to save this specification permanently for future orders.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing: Recipe Cost (View Only) & Selling Price Per KG (Input) */}
          {(() => {
            const selectedProduct = products.find((p) => p.id === orderForm.productId);
            const recipeCost = getProductRecipeCost(selectedProduct);
            const sellPrice =
              typeof orderForm.sellingPricePerKg === 'number'
                ? orderForm.sellingPricePerKg
                : parseFloat(String(orderForm.sellingPricePerKg)) || 0;
            const margin = sellPrice > 0 ? sellPrice - recipeCost : 0;
            const marginPct = recipeCost > 0 ? (margin / recipeCost) * 100 : 0;
            const weight = Number(orderForm.requestedQuantityKg) || 0;
            const totalVal = sellPrice * weight;

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Recipe Cost Price - Viewable only */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Recipe Cost Price
                      </label>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-factory-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                        View Only
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-100/90 dark:bg-factory-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                        ₹{recipeCost.toFixed(2)}{' '}
                        <span className="text-[10px] font-semibold text-slate-400 font-sans">/ kg</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        BOM Cost
                      </span>
                    </div>
                  </div>

                  {/* Selling Price Per KG - Input field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Selling Price Per KG (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="e.g. 135.00"
                        value={orderForm.sellingPricePerKg}
                        onChange={(e) =>
                          setOrderForm({
                            ...orderForm,
                            sellingPricePerKg: e.target.value === '' ? '' : parseFloat(e.target.value),
                          })
                        }
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono pr-12 font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">₹/kg</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Price & Profit Margin Card */}
                {sellPrice > 0 && (
                  <div
                    className={`p-3 rounded-2xl border transition-all ${margin >= 0
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 border-rose-200 dark:border-rose-800/60'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${margin >= 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                            Estimated Gross Margin
                          </p>
                          <p
                            className={`text-xs font-bold ${margin >= 0
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-600 dark:text-rose-400'
                              }`}
                          >
                            {margin >= 0 ? '+' : ''}₹{margin.toFixed(2)} / kg
                            {recipeCost > 0 && (
                              <span className="text-[10px] font-normal ml-1.5 opacity-80">
                                ({margin >= 0 ? '+' : ''}
                                {marginPct.toFixed(2)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Est. Total Order Value
                        </span>
                        <p className="font-mono text-sm font-black text-slate-900 dark:text-white leading-tight">
                          ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {weight > 0 && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {weight} kg @ ₹{sellPrice.toFixed(2)}/kg
                          </p>
                        )}
                      </div>
                    </div>

                    {margin < 0 && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1.5 pt-1.5 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Warning: Selling price is below the BOM recipe cost of ₹{recipeCost.toFixed(2)}/kg
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Order Notes / Quality Specs
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Corona treatment 42 dynes, food-grade certificate required"
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-factory-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={customers.length === 0 || products.length === 0}
              isLoading={isSubmitting}
              loadingText="Creating Order..."
            >
              Confirm Customer Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Size / Micron Master Modal */}
      <Modal
        isOpen={isQuickSizeModalOpen}
        onClose={() => setIsQuickSizeModalOpen(false)}
        title={sizeToEdit ? `Edit Specification: ${sizeToEdit.label}` : 'Add to Size & Micron Master'}
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!quickSizeForm.micron || Number(quickSizeForm.micron) <= 0) {
              alert('Please enter a valid positive micron value.');
              return;
            }
            const finalLabel =
              quickSizeForm.label.trim() ||
              (quickSizeForm.size.trim()
                ? `${quickSizeForm.size.trim()} - ${quickSizeForm.micron} ${quickSizeForm.unit}`
                : `${quickSizeForm.micron} ${quickSizeForm.unit}`);

            setIsQuickSaving(true);
            try {
              if (sizeToEdit) {
                await api.put(`/size-microns/${sizeToEdit.id}`, {
                  label: finalLabel,
                  size: quickSizeForm.size.trim() || 'Standard',
                  micron: Number(quickSizeForm.micron),
                  unit: quickSizeForm.unit || 'Micron',
                  description: quickSizeForm.description.trim(),
                  isActive: true,
                });
              } else {
                const res = await api.post('/size-microns', {
                  label: finalLabel,
                  size: quickSizeForm.size.trim() || 'Standard',
                  micron: Number(quickSizeForm.micron),
                  unit: quickSizeForm.unit || 'Micron',
                  description: quickSizeForm.description.trim(),
                  isActive: true,
                });
                const created = res.data.sizeMicron;
                setOrderForm({ ...orderForm, sizeMicron: created.label });
                setIsCustomSize(false);
              }

              await fetchData();
              setIsQuickSizeModalOpen(false);
              setSizeToEdit(null);
              setQuickSizeForm({ size: '', micron: 50, unit: 'Micron', label: '50 Micron', description: '' });
            } catch (err: any) {
              alert(err.response?.data?.message || 'Failed to save specification to master.');
            } finally {
              setIsQuickSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Micron Thickness *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={quickSizeForm.micron}
                onChange={(e) => {
                  const m = parseFloat(e.target.value) || 0;
                  setQuickSizeForm((prev) => {
                    const sizePart = prev.size.trim();
                    return {
                      ...prev,
                      micron: m,
                      label: sizePart ? `${sizePart} - ${m} ${prev.unit}` : `${m} ${prev.unit}`,
                    };
                  });
                }}
                placeholder="e.g. 50"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit
              </label>
              <select
                value={quickSizeForm.unit}
                onChange={(e) => {
                  const u = e.target.value;
                  setQuickSizeForm((prev) => {
                    const sizePart = prev.size.trim();
                    return {
                      ...prev,
                      unit: u,
                      label: sizePart ? `${sizePart} - ${prev.micron} ${u}` : `${prev.micron} ${u}`,
                    };
                  });
                }}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value="Micron">Micron (μm)</option>
                <option value="μm">μm</option>
                <option value="Gauge">Gauge</option>
                <option value="Mil">Mil</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Size / Dimensions
            </label>
            <input
              type="text"
              value={quickSizeForm.size}
              onChange={(e) => {
                const s = e.target.value;
                setQuickSizeForm((prev) => ({
                  ...prev,
                  size: s,
                  label: s.trim() ? `${s.trim()} - ${prev.micron} ${prev.unit}` : `${prev.micron} ${prev.unit}`,
                }));
              }}
              placeholder="e.g. 24x36 or Standard Roll"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dropdown Display Label *
            </label>
            <input
              type="text"
              required
              value={quickSizeForm.label}
              onChange={(e) => setQuickSizeForm({ ...quickSizeForm, label: e.target.value })}
              placeholder="e.g. 24x36 - 50 Micron"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Application (Optional)
            </label>
            <textarea
              rows={2}
              value={quickSizeForm.description}
              onChange={(e) => setQuickSizeForm({ ...quickSizeForm, description: e.target.value })}
              placeholder="e.g. Heavy duty milk pouch liner"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsQuickSizeModalOpen(false);
                setSizeToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isQuickSaving}
            >
              {sizeToEdit ? 'Save Changes' : 'Save to Master & Select'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Size/Micron Confirmation Modal */}
      <Modal
        isOpen={Boolean(sizeToDelete)}
        onClose={() => setSizeToDelete(null)}
        title="Confirm Specification Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-semibold">
              Delete specification <strong className="font-bold underline">{sizeToDelete?.label}</strong>?
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            This will remove this specification from future order dropdowns.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSizeToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (!sizeToDelete) return;
                try {
                  await api.delete(`/size-microns/${sizeToDelete.id}`);
                  setSizeToDelete(null);
                  await fetchData();
                } catch (err: any) {
                  alert(err.response?.data?.message || 'Failed to delete specification');
                }
              }}
            >
              Delete Specification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
