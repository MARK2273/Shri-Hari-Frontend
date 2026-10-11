import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ShoppingCart, Plus, Calendar, Clock, CheckCircle, Package } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerId: '',
    orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${Math.floor(Math.random() * 90 + 10)}`,
    requiredDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
    productId: '',
    requestedQuantityKg: 500,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordRes, custRes, prdRes] = await Promise.all([
        api.get('/orders'),
        api.get('/orders/customers'),
        api.get('/products'),
      ]);
      setOrders(ordRes.data.orders || []);
      setCustomers(custRes.data.customers || []);
      setProducts(prdRes.data.products || []);

      if (custRes.data.customers?.length > 0) {
        setOrderForm((prev) => ({ ...prev, customerId: custRes.data.customers[0].id }));
      }
      if (prdRes.data.products?.length > 0) {
        setOrderForm((prev) => ({ ...prev, productId: prdRes.data.products[0].id }));
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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/orders', {
        customerId: orderForm.customerId,
        orderNumber: orderForm.orderNumber,
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
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Customer Order
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
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
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                    Customer: {order.customers?.name || order.customer_name}
                  </h3>
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
        })}
      </div>

      {/* Modal: Create Customer Order */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Customer Order"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer
            </label>
            <select
              required
              value={orderForm.customerId}
              onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Order Number
              </label>
              <input
                type="text"
                required
                value={orderForm.orderNumber}
                onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Required Delivery Date
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
                Ordered Product
              </label>
              <select
                required
                value={orderForm.productId}
                onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Quantity (kg)
              </label>
              <input
                type="number"
                step="1"
                required
                value={orderForm.requestedQuantityKg}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, requestedQuantityKg: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-colors"
            >
              Confirm Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
