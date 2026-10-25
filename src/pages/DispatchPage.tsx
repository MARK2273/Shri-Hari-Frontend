import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  Truck,
  Plus,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Ruler,
  Building2,
  Zap,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';

export const DispatchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const urlBatchId = searchParams.get('batchId');

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [fgBatches, setFgBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [showAllBatches, setShowAllBatches] = useState(false);
  const [confirmCrossCustomer, setConfirmCrossCustomer] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    orderId: '',
    destinationAddress: 'Amul Packaging Hub, Kheda, Gujarat',
    vehicleNumber: 'GJ-01-AB-1234',
    notes: '',
    orderItemId: '',
    productId: '',
    quantityKg: 100,
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

      const fetchedDeliveries = delRes.data.deliveries || [];
      const fetchedOrders = ordRes.data.orders || [];
      const fetchedFGs = fgRes.data.batches || [];

      setDeliveries(fetchedDeliveries);
      setOrders(fetchedOrders);
      setFgBatches(fetchedFGs);

      // Determine initial selection
      let targetOrder = fetchedOrders[0];
      if (urlOrderId) {
        const found = fetchedOrders.find((o: any) => o.id === urlOrderId);
        if (found) targetOrder = found;
      }

      if (targetOrder) {
        const item = targetOrder.customer_order_items?.[0] || targetOrder.items?.[0] || {};
        const orderSpec = (targetOrder.size_micron || targetOrder.sizeMicron || item.size_micron || item.sizeMicron || '').trim().toLowerCase();
        const requestedKg = Number(item.requested_quantity_kg || targetOrder.total_requested_weight_kg || 0);
        const dispatchedKg = Number(item.dispatched_quantity_kg || 0);
        const remainingKg = Math.max(0, requestedKg - dispatchedKg);

        // Find best batch: urlBatchId -> dedicated to this order -> unreserved exact spec -> unreserved prod -> unreserved any -> fallback
        let selectedBatch: any = null;
        if (urlBatchId) {
          selectedBatch = fetchedFGs.find((b: any) => b.id === urlBatchId);
        }
        if (!selectedBatch) {
          // Dedicated to this specific customer order
          selectedBatch = fetchedFGs.find(
            (b: any) => b.order_id === targetOrder.id && Number(b.quantity_on_hand_kg) > 0
          );
        }
        if (!selectedBatch) {
          // Unreserved exact match
          selectedBatch = fetchedFGs.find(
            (b: any) =>
              !b.order_id &&
              b.product_id === item.product_id &&
              (b.size_micron || '').trim().toLowerCase() === orderSpec &&
              Number(b.quantity_on_hand_kg) > 0
          );
        }
        if (!selectedBatch) {
          // Unreserved product match
          selectedBatch = fetchedFGs.find(
            (b: any) =>
              !b.order_id &&
              b.product_id === item.product_id &&
              Number(b.quantity_on_hand_kg) > 0
          );
        }
        if (!selectedBatch) {
          // Any unreserved lot
          selectedBatch = fetchedFGs.find((b: any) => !b.order_id && Number(b.quantity_on_hand_kg) > 0);
        }
        if (!selectedBatch && fetchedFGs.length > 0) {
          selectedBatch = fetchedFGs[0];
        }

        const batchOnHand = Number(selectedBatch?.quantity_on_hand_kg || 0);
        const defaultQty = remainingKg > 0 ? Math.min(remainingKg, batchOnHand || remainingKg) : (batchOnHand || 100);

        setConfirmCrossCustomer(false);
        setDispatchForm({
          orderId: targetOrder.id,
          orderItemId: item.id || '',
          productId: item.product_id || '',
          finishedGoodsBatchId: selectedBatch?.id || '',
          destinationAddress: targetOrder.customers?.delivery_address || targetOrder.destinationAddress || 'Factory Gate Dispatch Hub',
          vehicleNumber: 'GJ-01-AB-1234',
          notes: '',
          quantityKg: defaultQty || 100,
        });

        // If URL requested an order or batch, auto-open the modal
        if (urlOrderId || urlBatchId) {
          setIsDispatchModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load dispatch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [urlOrderId, urlBatchId]);

  // Active selected order details
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === dispatchForm.orderId);
  }, [orders, dispatchForm.orderId]);

  const activeOrderItem = useMemo(() => {
    return activeOrder?.customer_order_items?.[0] || activeOrder?.items?.[0] || {};
  }, [activeOrder]);

  const activeOrderSpec = useMemo(() => {
    return (activeOrder?.size_micron || activeOrder?.sizeMicron || activeOrderItem?.size_micron || activeOrderItem?.sizeMicron || '').trim();
  }, [activeOrder, activeOrderItem]);

  // Active selected batch details
  const activeBatch = useMemo(() => {
    return fgBatches.find((b) => b.id === dispatchForm.finishedGoodsBatchId);
  }, [fgBatches, dispatchForm.finishedGoodsBatchId]);

  // Check if selected batch is reserved for another customer
  const isCrossCustomerBatch = useMemo(() => {
    if (!activeBatch || !activeOrder) return false;
    return Boolean(activeBatch.order_id && activeBatch.order_id !== activeOrder.id);
  }, [activeBatch, activeOrder]);

  // Group finished goods batches relative to the active order
  const { dedicatedBatches, unreservedMatches, otherBatches } = useMemo(() => {
    const dedicated: any[] = [];
    const unreserved: any[] = [];
    const others: any[] = [];

    fgBatches.forEach((b) => {
      const onHand = Number(b.quantity_on_hand_kg || 0);
      if (onHand <= 0) return;

      if (b.order_id && activeOrder && b.order_id === activeOrder.id) {
        dedicated.push(b);
      } else if (!b.order_id) {
        unreserved.push(b);
      } else {
        others.push(b);
      }
    });

    return { dedicatedBatches: dedicated, unreservedMatches: unreserved, otherBatches: others };
  }, [fgBatches, activeOrder]);

  const isExactMatch = useMemo(() => {
    if (!activeBatch || !activeOrder) return false;
    const prodMatch = activeBatch.product_id === activeOrderItem?.product_id;
    const bSpec = (activeBatch.size_micron || '').trim().toLowerCase();
    const oSpec = activeOrderSpec.toLowerCase();
    return prodMatch && bSpec === oSpec && bSpec.length > 0;
  }, [activeBatch, activeOrder, activeOrderItem, activeOrderSpec]);

  const isSelectedFromJobWork = useMemo(() => {
    const op = activeBatch?.production_batches?.operator_name || activeBatch?.operator_name || '';
    return op.toLowerCase().includes('job work') || activeBatch?.batch_number?.startsWith('FG-JW');
  }, [activeBatch]);

  const jobWorkVendorName = useMemo(() => {
    return activeBatch?.production_batches?.operator_name || activeBatch?.operator_name || 'Job Work Vendor';
  }, [activeBatch]);

  // When order changes, re-sync order item, product, and suggest the best batch
  const handleOrderChange = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    const item = ord.customer_order_items?.[0] || ord.items?.[0] || {};
    const orderSpec = (ord.size_micron || ord.sizeMicron || item.size_micron || item.sizeMicron || '').trim().toLowerCase();
    const reqKg = Number(item.requested_quantity_kg || ord.total_requested_weight_kg || 0);
    const dispKg = Number(item.dispatched_quantity_kg || 0);
    const remKg = Math.max(0, reqKg - dispKg);

    // Look for dedicated batch for this order first
    const dedicated = fgBatches.find(
      (b) => b.order_id === orderId && Number(b.quantity_on_hand_kg) > 0
    );
    // Next: unreserved exact match
    const unreservedExact = fgBatches.find(
      (b) =>
        !b.order_id &&
        b.product_id === item.product_id &&
        (b.size_micron || '').trim().toLowerCase() === orderSpec &&
        Number(b.quantity_on_hand_kg) > 0
    );
    // Next: unreserved product match
    const unreservedProd = fgBatches.find(
      (b) =>
        !b.order_id &&
        b.product_id === item.product_id &&
        Number(b.quantity_on_hand_kg) > 0
    );
    // Next: any unreserved
    const anyUnreserved = fgBatches.find((b) => !b.order_id && Number(b.quantity_on_hand_kg) > 0);
    const selected = dedicated || unreservedExact || unreservedProd || anyUnreserved || fgBatches[0];

    const batchOnHand = Number(selected?.quantity_on_hand_kg || 0);
    const qtyToDispatch = remKg > 0 ? Math.min(remKg, batchOnHand || remKg) : (batchOnHand || 100);

    setConfirmCrossCustomer(false);
    setDispatchForm({
      ...dispatchForm,
      orderId,
      orderItemId: item.id || '',
      productId: item.product_id || '',
      finishedGoodsBatchId: selected?.id || '',
      destinationAddress: ord.customers?.delivery_address || ord.destinationAddress || dispatchForm.destinationAddress,
      quantityKg: qtyToDispatch,
    });
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCrossCustomerBatch && !confirmCrossCustomer) {
      alert(`Cross-Customer Protection: This batch is reserved for ${activeBatch?.customer_name || 'another customer'}. Please check the confirmation checkbox to authorize borrowing this stock.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/dispatch/confirm', {
        orderId: dispatchForm.orderId,
        destinationAddress: dispatchForm.destinationAddress,
        vehicleNumber: dispatchForm.vehicleNumber,
        notes: dispatchForm.notes,
        allowCrossCustomerReallocation: confirmCrossCustomer,
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
      setConfirmCrossCustomer(false);
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
            Directly dispatch floor inventory &amp; Job Work finished goods to customer orders matching Product &amp; Specification.
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Dispatch History ({deliveries.length})
          </h3>
          <span className="text-xs text-slate-400">All deliveries deduct inventory atomically</span>
        </div>

        <div className="overflow-x-auto -mx-5 px-5 pb-2">
          <table className="w-full text-left text-xs min-w-[1080px] border-collapse">
            <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 bg-white dark:bg-factory-900">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap min-w-[180px]">Customer & Order</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[180px]">Product & Specification</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[170px]">Dispatched Lot</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[200px]">Destination</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[120px]">Vehicle #</th>
                <th className="px-4 py-3 text-right whitespace-nowrap min-w-[110px]">Dispatched Qty</th>
                <th className="px-4 py-3 whitespace-nowrap min-w-[110px]">Date</th>
                <th className="px-4 py-3 text-center whitespace-nowrap min-w-[140px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No dispatch delivery notes recorded yet.
                  </td>
                </tr>
              ) : (
                deliveries.map((del) => {
                  const delItem = del.delivery_items?.[0] || del.items?.[0] || {};
                  const alloc = delItem.delivery_batch_allocations?.[0] || {};
                  const fg = alloc.finished_goods_batches || {};
                  const batchNum = fg.batch_number || 'Direct Floor Batch';
                  const spec = fg.size_micron || 'Standard';
                  const isJobWork = batchNum.startsWith('FG-JW');

                  return (
                    <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[180px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                          {del.customers?.name || del.customer_name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                          {del.customer_orders?.order_number || del.delivery_number}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[180px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                          {delItem.products?.name || 'Finished Product'}
                        </div>
                        {spec && (
                          <div className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 whitespace-nowrap">
                            <Ruler className="w-3 h-3 shrink-0" />
                            <span>{spec}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[170px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {batchNum}
                          </span>
                          {isJobWork && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0 whitespace-nowrap">
                              Job Work
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 min-w-[200px] truncate max-w-[240px]" title={del.destination_address}>
                        {del.destination_address}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 min-w-[120px] whitespace-nowrap">
                        {del.vehicle_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 min-w-[110px] whitespace-nowrap">
                        {delItem.quantity_kg || 0} kg
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 min-w-[110px]">
                        {new Date(del.dispatch_date).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-center min-w-[140px] whitespace-nowrap">
                        <Badge variant="success">Confirmed & Deducted</Badge>
                      </td>
                    </tr>
                  );
                })
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
          {/* Select Customer Order */}
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
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value="" disabled>-- Select Customer Order --</option>
                {orders.map((o) => {
                  const itm = o.customer_order_items?.[0] || o.items?.[0] || {};
                  const pName = itm.products?.name || 'Product';
                  const spec = o.size_micron || o.sizeMicron || itm.size_micron || itm.sizeMicron || '';
                  const req = Number(itm.requested_quantity_kg || o.total_requested_weight_kg || 0);
                  const disp = Number(itm.dispatched_quantity_kg || 0);
                  const rem = Math.max(0, req - disp);

                  return (
                    <option key={o.id} value={o.id}>
                      {o.order_number || 'Order'} • {o.customers?.name || o.customer_name} • {pName} {spec ? `(${spec})` : ''} • Remaining: {rem} kg
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Select Finished Goods Batch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Allocate Finished Goods Batch
              </label>
              {dedicatedBatches.length > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dedicated lot available
                </span>
              )}
            </div>

            {fgBatches.filter((b) => Number(b.quantity_on_hand_kg || 0) > 0).length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                No matching in-stock finished goods batches found.
              </div>
            ) : (
              <select
                required
                value={dispatchForm.finishedGoodsBatchId}
                onChange={(e) => {
                  const b = fgBatches.find((batch) => batch.id === e.target.value);
                  const bOnHand = Number(b?.quantity_on_hand_kg || 0);
                  const reqKg = Number(activeOrderItem.requested_quantity_kg || activeOrder?.total_requested_weight_kg || 0);
                  const dispKg = Number(activeOrderItem.dispatched_quantity_kg || 0);
                  const remKg = Math.max(0, reqKg - dispKg);

                  setConfirmCrossCustomer(false);
                  setDispatchForm({
                    ...dispatchForm,
                    finishedGoodsBatchId: e.target.value,
                    quantityKg: remKg > 0 ? Math.min(remKg, bOnHand || remKg) : (bOnHand || dispatchForm.quantityKg),
                  });
                }}
                className={`w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-factory-800 border rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                  isCrossCustomerBatch
                    ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/50'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                <option value="" disabled>-- Select Finished Goods Batch --</option>
                
                {dedicatedBatches.length > 0 && (
                  <optgroup label={`🎯 Dedicated for ${activeOrder?.customers?.name || activeOrder?.customer_name || 'Selected Customer'}`}>
                    {dedicatedBatches.map((fg) => (
                      <option key={fg.id} value={fg.id}>
                        Lot {fg.batch_number} • {fg.size_micron || 'Standard'} • ({fg.quantity_on_hand_kg} kg on-hand) [Dedicated]
                      </option>
                    ))}
                  </optgroup>
                )}

                {unreservedMatches.length > 0 && (
                  <optgroup label="📦 Floor Stock (Unreserved / Job Work)">
                    {unreservedMatches.map((fg) => {
                      const op = fg.production_batches?.operator_name || fg.operator_name || '';
                      const isJW = op.toLowerCase().includes('job work') || fg.batch_number?.startsWith('FG-JW');
                      const vendorClean = op ? op.replace(/job work[:\s]*/i, '').trim() : '';
                      const source = isJW ? (vendorClean ? `Job Work: ${vendorClean}` : 'Job Work') : 'Floor Stock';
                      return (
                        <option key={fg.id} value={fg.id}>
                          Lot {fg.batch_number} • {fg.size_micron || 'Standard'} • {source} ({fg.quantity_on_hand_kg} kg available)
                        </option>
                      );
                    })}
                  </optgroup>
                )}

                {otherBatches.length > 0 && (
                  <optgroup label="⚠️ Reserved for Other Customers (Cross-Customer Reallocation)">
                    {otherBatches.map((fg) => (
                      <option key={fg.id} value={fg.id}>
                        Lot {fg.batch_number} • {fg.size_micron || 'Standard'} • [Reserved for: {fg.customer_name || 'Other Customer'}] ({fg.quantity_on_hand_kg} kg available)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}

            {/* Perfect match badge */}
            {activeBatch && !isCrossCustomerBatch && activeBatch.order_id === activeOrder?.id && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Dedicated Production Lot: Specifically produced for {activeOrder?.customers?.name || activeOrder?.customer_name}.</span>
              </div>
            )}

            {/* Cross-Customer Warning Banner */}
            {isCrossCustomerBatch && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Cross-Customer Allocation Warning</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      This batch (<strong>{activeBatch?.batch_number}</strong>) was produced specifically for{' '}
                      <span className="font-bold underline">{activeBatch?.customer_name || 'another customer'}</span>{' '}
                      {activeBatch?.order_number ? `(${activeBatch.order_number})` : ''}.
                      Dispatching this lot will borrow inventory from their production order!
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 font-semibold text-xs cursor-pointer select-none border-t border-amber-500/20">
                  <input
                    type="checkbox"
                    checked={confirmCrossCustomer}
                    onChange={(e) => setConfirmCrossCustomer(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>I authorize borrowing / reallocating this stock for {activeOrder?.customers?.name || activeOrder?.customer_name}</span>
                </label>
              </div>
            )}
          </div>

          {/* Quantities & Vehicle */}
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
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Delivery Address
            </label>
            <input
              type="text"
              required
              value={dispatchForm.destinationAddress}
              onChange={(e) => setDispatchForm({ ...dispatchForm, destinationAddress: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
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
              disabled={orders.length === 0 || fgBatches.length === 0 || (isCrossCustomerBatch && !confirmCrossCustomer)}
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
