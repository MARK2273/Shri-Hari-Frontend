import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Truck, Plus, MapPin, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';

export const DispatchPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [fgBatches, setFgBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    orderId: '',
    destinationAddress: 'Amul Packaging Hub, Kheda, Gujarat',
    vehicleNumber: 'GJ-01-AB-1234',
    notes: '',
    orderItemId: '',
    productId: '',
    quantityKg: 194,
    finishedGoodsBatchId: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [delRes, ordRes, fgRes] = await Promise.all([
        api.get('/dispatch'),
        api.get('/orders'),
        api.get('/finished-goods'),
      ]);

      setDeliveries(delRes.data.deliveries || []);
      setOrders(ordRes.data.orders || []);
      setFgBatches(fgRes.data.batches || []);

      if (ordRes.data.orders?.length > 0) {
        const ord = ordRes.data.orders[0];
        const item = ord.customer_order_items?.[0] || {};
        const availableFG = fgRes.data.batches?.find((b: any) => b.product_id === item.product_id);

        setDispatchForm((prev) => ({
          ...prev,
          orderId: ord.id,
          orderItemId: item.id || '',
          productId: item.product_id || '',
          finishedGoodsBatchId: availableFG?.id || '',
          quantityKg: Number(availableFG?.quantity_on_hand_kg) || 194,
        }));
      }
    } catch (err) {
      console.error('Failed to load dispatch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/dispatch/confirm', {
        orderId: dispatchForm.orderId,
        destinationAddress: dispatchForm.destinationAddress,
        vehicleNumber: dispatchForm.vehicleNumber,
        notes: dispatchForm.notes,
        items: [
          {
            orderItemId: dispatchForm.orderItemId,
            productId: dispatchForm.productId,
            quantityKg: dispatchForm.quantityKg,
            batchAllocations: [
              {
                finishedGoodsBatchId: dispatchForm.finishedGoodsBatchId,
                quantityKg: dispatchForm.quantityKg,
              },
            ],
          },
        ],
      });

      setIsDispatchModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm dispatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-500" />
            Dispatch & Delivery Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Confirmed dispatches deduct finished stock atomically with full lot allocation
          </p>
        </div>
        <button
          onClick={() => setIsDispatchModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Create & Confirm Dispatch
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Dispatch History ({deliveries.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              <tr>
                <th className="py-2.5 whitespace-nowrap">Document #</th>
                <th className="py-2.5 whitespace-nowrap">Customer Order #</th>
                <th className="py-2.5 whitespace-nowrap">Customer</th>
                <th className="py-2.5 whitespace-nowrap">Destination</th>
                <th className="py-2.5 whitespace-nowrap">Vehicle #</th>
                <th className="py-2.5 whitespace-nowrap">Dispatched Qty</th>
                <th className="py-2.5 whitespace-nowrap">Date & Time</th>
                <th className="py-2.5 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No dispatch delivery notes recorded yet.
                  </td>
                </tr>
              ) : (
                deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                    <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {del.delivery_number}
                    </td>
                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                      {del.customer_orders?.order_number || del.order_number}
                    </td>
                    <td className="py-3 text-slate-800 dark:text-slate-200">
                      {del.customers?.name || del.customer_name}
                    </td>
                    <td className="py-3 text-slate-500 max-w-[180px] truncate" title={del.destination_address}>
                      {del.destination_address}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-400">
                      {del.vehicle_number || 'N/A'}
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {del.delivery_items?.[0]?.quantity_kg || del.items?.[0]?.quantity_kg || 0} kg
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(del.dispatch_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Badge variant="success">Confirmed & Deducted</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create & Confirm Dispatch */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Create & Confirm Dispatch Note"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDispatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer Order
            </label>
            {orders.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                No customer orders available for dispatch.
              </div>
            ) : (
              <select
                required
                value={dispatchForm.orderId}
                onChange={(e) => {
                  const ord = orders.find((o) => o.id === e.target.value);
                  const item = ord?.customer_order_items?.[0] || {};
                  const availableFG = fgBatches.find((b) => b.product_id === item.product_id);
                  setDispatchForm({
                    ...dispatchForm,
                    orderId: e.target.value,
                    orderItemId: item.id || '',
                    productId: item.product_id || '',
                    finishedGoodsBatchId: availableFG?.id || '',
                    destinationAddress: ord?.customers?.delivery_address || dispatchForm.destinationAddress,
                  });
                }}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value="" disabled>-- Select Customer Order --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} - {o.customers?.name || o.customer_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vehicle / Transport Number
            </label>
            <input
              type="text"
              placeholder="e.g. GJ-01-AB-1234"
              value={dispatchForm.vehicleNumber}
              onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Allocate From Finished Goods Batch
            </label>
            {fgBatches.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                No finished goods batches in inventory to allocate.
              </div>
            ) : (
              <select
                required
                value={dispatchForm.finishedGoodsBatchId}
                onChange={(e) => setDispatchForm({ ...dispatchForm, finishedGoodsBatchId: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              >
                <option value="" disabled>-- Select Finished Goods Batch --</option>
                {fgBatches.map((fg) => (
                  <option key={fg.id} value={fg.id}>
                    {fg.batch_number} (On-Hand: {fg.quantity_on_hand_kg} kg)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dispatched Quantity (kg)
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={dispatchForm.quantityKg}
                onChange={(e) =>
                  setDispatchForm({ ...dispatchForm, quantityKg: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Address
              </label>
              <input
                type="text"
                required
                value={dispatchForm.destinationAddress}
                onChange={(e) => setDispatchForm({ ...dispatchForm, destinationAddress: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            ⚠️ <strong>Stock Deduction Notice:</strong> Confirming this dispatch will immediately deduct{' '}
            <span className="font-mono font-bold">{dispatchForm.quantityKg} kg</span> from the selected finished
            goods batch and register an irreversible delivery ledger transaction.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={orders.length === 0 || fgBatches.length === 0}
              isLoading={isSubmitting}
              loadingText="Confirming Dispatch & Deducting Stock..."
            >
              Confirm Dispatch & Deduct Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
