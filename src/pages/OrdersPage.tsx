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
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state: Order
  const [orderForm, setOrderForm] = useState({
    customerId: '',
    orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${Math.floor(Math.random() * 90 + 10)}`,
    requiredDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
    productId: '',
    requestedQuantityKg: 500,
  });

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
      const [ordRes, custRes, prdRes] = await Promise.all([
        api.get('/orders'),
        api.get('/orders/customers'),
        api.get('/products'),
      ]);
      const fetchedCustomers = custRes.data.customers || [];
      const fetchedProducts = prdRes.data.products || [];

      setOrders(ordRes.data.orders || []);
      setCustomers(fetchedCustomers);
      setProducts(fetchedProducts);

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

  // 1-Click Seed Sample Customers
  const handleSeedCustomers = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/orders/customers/seed-defaults', {});
      alert(res.data?.message || 'Sample packaging clients configured!');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to seed sample clients');
    } finally {
      setIsSubmitting(false);
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
    setIsSubmitting(true);
    try {
      await api.post('/orders', {
        customerId: orderForm.customerId,
        requiredDeliveryDate: orderForm.requiredDeliveryDate,
        notes: orderForm.notes,
        items: [
          {
            productId: orderForm.productId,
            requestedQuantityKg: orderForm.requestedQuantityKg,
          },
        ],
      });
      setIsOrderModalOpen(false);
      setOrderForm((prev) => ({
        ...prev,
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
            Order-driven manufacturing workflow. All production batches link back to confirmed orders (ORD-01..ORD-09).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {customers.length === 0 && (
            <button
              onClick={handleSeedCustomers}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-xl hover:bg-brand-100 transition-colors shadow-sm"
              title="1-Click Populate sample corporate packaging clients (Amul, Parle, Nestle, Haldiram)"
            >
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Seed Sample Clients</span>
            </button>
          )}

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

      {/* Tabs Switcher: Orders vs Customer Directory */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Active Orders & Demand ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'customers'
              ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Directory & Accounts ({customers.length})</span>
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
              <div className="flex items-center justify-center gap-3 pt-2">
                {customers.length === 0 && (
                  <button
                    onClick={handleSeedCustomers}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl hover:bg-brand-100 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    Seed Sample Clients
                  </button>
                )}
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
                      <div className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-lg border border-brand-200 dark:border-brand-800/40">
                        Total: {order.total_requested_weight_kg} kg
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
      ) : (
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
              No customers registered yet. Click "+ Add Customer" or use "Seed Sample Clients" to populate accounts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="py-2.5">Code</th>
                    <th className="py-2.5">Company Name</th>
                    <th className="py-2.5">Contact Person</th>
                    <th className="py-2.5">Phone & Email</th>
                    <th className="py-2.5">Delivery Address</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
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
      )}

      {/* Modal: Add or Edit Customer Details */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={customerToEdit ? `Edit Customer: ${customerToEdit.name}` : 'Add New Customer Company'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Code
              </label>
              <div className="w-full text-xs px-3 py-2 bg-slate-100 dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-mono flex items-center justify-between">
                <span>{customerToEdit ? customerToEdit.code : 'Auto-Generated'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                  Auto
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique client code auto-assigned</span>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {customerToEdit ? 'Save Changes' : 'Create Customer Account'}
            </button>
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
            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmDeleteCustomer}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Customer'}</span>
            </button>
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
                  + Add Customer
                </button>
              </div>
            ) : (
              <select
                required
                value={orderForm.customerId}
                onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Order Number
              </label>
              <div className="w-full text-xs px-3 py-2 bg-slate-100 dark:bg-factory-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-mono flex items-center justify-between">
                <span>Auto-Generated (ORD-...)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                  Auto
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique order number auto-assigned</span>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                  onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
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
            <button
              type="submit"
              disabled={isSubmitting || customers.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              Confirm Customer Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
