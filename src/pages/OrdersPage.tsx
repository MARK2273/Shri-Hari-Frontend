import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Truck,
  Zap,
  Layers,
  TrendingUp,
  ArrowUpRight,
  Info,
  Lock,
  Flame,
  XCircle,
  Ban,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { SizeMicron } from '../types';

export interface OrderLineItem {
  id: string;
  productId: string;
  requestedQuantityKg: number | '';
  sizeMicron: string;
  grade: string;
  sellingPricePerKg: number | '';
  notes?: string;
  isCustomSize?: boolean;
}

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [sizeMicrons, setSizeMicrons] = useState<SizeMicron[]>([]);
  const [fgBatches, setFgBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Size/Micron Master states
  const [activeQuickSizeItemId, setActiveQuickSizeItemId] = useState<string | null>(null);
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

  // Increase Order Quantity state (available ONLY if order is NOT in the production run)
  const [orderToIncrease, setOrderToIncrease] = useState<any | null>(null);
  const [selectedItemToIncreaseId, setSelectedItemToIncreaseId] = useState<string>('');
  const [selectedRecipeProductId, setSelectedRecipeProductId] = useState<string>('');
  const [selectedSizeMicron, setSelectedSizeMicron] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSellingPrice, setSelectedSellingPrice] = useState<number | ''>('');
  const [increaseAmountKg, setIncreaseAmountKg] = useState<number | ''>(50);
  const [newTotalQuantityKg, setNewTotalQuantityKg] = useState<number | ''>('');
  const [increaseReason, setIncreaseReason] = useState<string>('');
  const [isSubmittingIncrease, setIsSubmittingIncrease] = useState<boolean>(false);
  const [increaseError, setIncreaseError] = useState<string | null>(null);
  const [feasibilityCheck, setFeasibilityCheck] = useState<{
    loading: boolean;
    result: any | null;
  }>({ loading: false, result: null });

  // Material Feasibility Checker
  const checkStockFeasibility = async (productId: string, quantityKg: number) => {
    if (!productId || !quantityKg || quantityKg <= 0) {
      setFeasibilityCheck({ loading: false, result: null });
      return;
    }
    setFeasibilityCheck({ loading: true, result: null });
    try {
      const res = await api.post('/products/calculate-requirements', {
        productId,
        quantityKg,
      });
      setFeasibilityCheck({ loading: false, result: res.data });
    } catch (err: any) {
      setFeasibilityCheck({ loading: false, result: null });
    }
  };

  const openIncreaseQtyModal = (order: any, defaultItemId?: string) => {
    if (order.is_in_production_run) {
      alert(`Order ${order.order_number} cannot be increased because it is already in the production run.`);
      return;
    }
    setOrderToIncrease(order);
    const items = (order.customer_order_items && order.customer_order_items.length > 0)
      ? order.customer_order_items
      : (order.items && order.items.length > 0 ? order.items : [{}]);
    const chosenItemId = defaultItemId || items[0]?.id || '';
    setSelectedItemToIncreaseId(chosenItemId);
    const chosenItem = items.find((i: any) => i.id === chosenItemId) || items[0] || {};
    const currentKg = Number(chosenItem?.requested_quantity_kg || order.total_requested_weight_kg || 0);

    const initialProdId = chosenItem.product_id || (products[0]?.id || '');
    setSelectedRecipeProductId(initialProdId);
    setSelectedSizeMicron(chosenItem.size_micron || order.size_micron || '');
    setSelectedGrade(chosenItem.grade || order.grade || '');
    setSelectedSellingPrice(chosenItem.selling_price_per_kg || order.selling_price_per_kg || '');
    setIncreaseAmountKg(50);
    setNewTotalQuantityKg(currentKg + 50);
    setIncreaseReason('');
    setIncreaseError(null);
    checkStockFeasibility(initialProdId, 50);
  };

  const handleItemSelectChange = (itemId: string) => {
    setSelectedItemToIncreaseId(itemId);
    if (!orderToIncrease) return;
    const items = (orderToIncrease.customer_order_items && orderToIncrease.customer_order_items.length > 0)
      ? orderToIncrease.customer_order_items
      : (orderToIncrease.items && orderToIncrease.items.length > 0 ? orderToIncrease.items : [{}]);
    const item = items.find((i: any) => i.id === itemId) || items[0] || {};
    const currentKg = Number(item.requested_quantity_kg || 0);
    const extra = typeof increaseAmountKg === 'number' ? increaseAmountKg : 50;
    setNewTotalQuantityKg(currentKg + extra);
    const pId = item.product_id || selectedRecipeProductId;
    setSelectedRecipeProductId(pId);
    setSelectedSizeMicron(item.size_micron || selectedSizeMicron);
    setSelectedGrade(item.grade || selectedGrade);
    setSelectedSellingPrice(item.selling_price_per_kg || selectedSellingPrice);
    if (extra > 0) {
      checkStockFeasibility(pId, extra);
    }
  };

  const handleExtraKgChange = (val: number | '') => {
    setIncreaseAmountKg(val);
    if (!orderToIncrease) return;
    const items = (orderToIncrease.customer_order_items && orderToIncrease.customer_order_items.length > 0)
      ? orderToIncrease.customer_order_items
      : (orderToIncrease.items && orderToIncrease.items.length > 0 ? orderToIncrease.items : [{}]);
    const chosenItem = items.find((i: any) => i.id === selectedItemToIncreaseId) || items[0] || {};
    const currentKg = Number(chosenItem.requested_quantity_kg || orderToIncrease.total_requested_weight_kg || 0);
    const extra = val === '' ? 0 : Number(val);
    if (val === '') {
      setNewTotalQuantityKg('');
      setFeasibilityCheck({ loading: false, result: null });
    } else {
      setNewTotalQuantityKg(currentKg + extra);
      if (extra > 0) {
        checkStockFeasibility(selectedRecipeProductId || chosenItem.product_id, extra);
      } else {
        setFeasibilityCheck({ loading: false, result: null });
      }
    }
  };

  const handleNewTotalKgChange = (val: number | '') => {
    setNewTotalQuantityKg(val);
    if (!orderToIncrease) return;
    const items = (orderToIncrease.customer_order_items && orderToIncrease.customer_order_items.length > 0)
      ? orderToIncrease.customer_order_items
      : (orderToIncrease.items && orderToIncrease.items.length > 0 ? orderToIncrease.items : [{}]);
    const chosenItem = items.find((i: any) => i.id === selectedItemToIncreaseId) || items[0] || {};
    const currentKg = Number(chosenItem.requested_quantity_kg || orderToIncrease.total_requested_weight_kg || 0);
    if (val === '') {
      setIncreaseAmountKg('');
      setFeasibilityCheck({ loading: false, result: null });
    } else {
      const extra = Math.max(0, Number(val) - currentKg);
      setIncreaseAmountKg(extra);
      if (extra > 0) {
        checkStockFeasibility(selectedRecipeProductId || chosenItem.product_id, extra);
      } else {
        setFeasibilityCheck({ loading: false, result: null });
      }
    }
  };

  const handleConfirmIncreaseQty = async () => {
    if (!orderToIncrease) return;
    const items = (orderToIncrease.customer_order_items && orderToIncrease.customer_order_items.length > 0)
      ? orderToIncrease.customer_order_items
      : (orderToIncrease.items && orderToIncrease.items.length > 0 ? orderToIncrease.items : [{}]);
    const chosenItem = items.find((i: any) => i.id === selectedItemToIncreaseId) || items[0] || {};
    const currentKg = Number(chosenItem.requested_quantity_kg || orderToIncrease.total_requested_weight_kg || 0);
    const targetKg = Number(newTotalQuantityKg);

    if (!targetKg || targetKg <= currentKg) {
      setIncreaseError(`New quantity (${targetKg || 0} kg) must be strictly greater than current quantity (${currentKg} kg).`);
      return;
    }

    if (feasibilityCheck.result && !feasibilityCheck.result.sufficient) {
      setIncreaseError(`Cannot increase order: ${feasibilityCheck.result.missingDetails || 'Insufficient raw material stock in warehouse to produce extra demand.'}`);
      return;
    }

    setIsSubmittingIncrease(true);
    setIncreaseError(null);
    try {
      await api.patch(`/orders/${orderToIncrease.id}/increase-quantity`, {
        itemId: chosenItem.id,
        newQuantityKg: targetKg,
        productId: selectedRecipeProductId || undefined,
        sizeMicron: selectedSizeMicron || undefined,
        grade: selectedGrade || undefined,
        sellingPricePerKg: selectedSellingPrice ? Number(selectedSellingPrice) : undefined,
        reason: increaseReason.trim() || undefined,
      });
      await fetchData();
      setOrderToIncrease(null);
    } catch (err: any) {
      setIncreaseError(err.response?.data?.message || 'Failed to increase order quantity.');
    } finally {
      setIsSubmittingIncrease(false);
    }
  };

  // Edit Order state (allowed ONLY if NOT in production run)
  const [orderToEdit, setOrderToEdit] = useState<any | null>(null);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState<{
    customerId: string;
    requiredDeliveryDate: string;
    notes: string;
    items: OrderLineItem[];
  }>({
    customerId: '',
    requiredDeliveryDate: '',
    notes: '',
    items: [],
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editOrderError, setEditOrderError] = useState<string | null>(null);

  const openEditOrderModal = (order: any) => {
    if (order.is_in_production_run) {
      alert(`Order ${order.order_number} cannot be edited because it is already in the production run.`);
      return;
    }
    setOrderToEdit(order);
    setEditOrderError(null);
    const items = (order.customer_order_items && order.customer_order_items.length > 0)
      ? order.customer_order_items
      : (order.items && order.items.length > 0 ? order.items : []);

    setEditOrderForm({
      customerId: order.customer_id || '',
      requiredDeliveryDate: order.required_delivery_date || '',
      notes: order.notes && !order.notes.startsWith('{') ? order.notes : '',
      items: items.length > 0
        ? items.map((it: any, idx: number) => ({
            id: it.id || `edit-item-${idx}`,
            productId: it.product_id || (products[0]?.id || ''),
            requestedQuantityKg: Number(it.requested_quantity_kg || 100),
            sizeMicron: it.size_micron || '',
            grade: it.grade || '',
            sellingPricePerKg: it.selling_price_per_kg || '',
            notes: it.notes && !it.notes.startsWith('{') ? it.notes : '',
            isCustomSize: !sizeMicrons.some((sm) => sm.label === it.size_micron) && !!it.size_micron,
          }))
        : [
            {
              id: 'edit-item-0',
              productId: products[0]?.id || '',
              requestedQuantityKg: Number(order.total_requested_weight_kg || 100),
              sizeMicron: order.size_micron || '',
              grade: order.grade || '',
              sellingPricePerKg: order.selling_price_per_kg || '',
              notes: '',
              isCustomSize: false,
            },
          ],
    });
    setIsEditOrderModalOpen(true);
  };

  const handleEditItemChange = (id: string, field: keyof OrderLineItem, value: any) => {
    setEditOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));
  };

  const handleAddEditItem = () => {
    setEditOrderForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `edit-item-${Date.now()}`,
          productId: products[0]?.id || '',
          requestedQuantityKg: 100,
          sizeMicron: '',
          grade: '',
          sellingPricePerKg: '',
          notes: '',
          isCustomSize: false,
        },
      ],
    }));
  };

  const handleRemoveEditItem = (id: string) => {
    if (editOrderForm.items.length <= 1) return;
    setEditOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const handleConfirmEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;
    setIsSubmittingEdit(true);
    setEditOrderError(null);
    try {
      await api.put(`/orders/${orderToEdit.id}`, {
        customerId: editOrderForm.customerId,
        requiredDeliveryDate: editOrderForm.requiredDeliveryDate,
        notes: editOrderForm.notes,
        items: editOrderForm.items.map((it) => ({
          id: it.id.startsWith('edit-item-') ? undefined : it.id,
          productId: it.productId,
          requestedQuantityKg: Number(it.requestedQuantityKg),
          sizeMicron: it.sizeMicron,
          grade: it.grade,
          sellingPricePerKg: Number(it.sellingPricePerKg) || undefined,
          notes: it.notes,
        })),
      });
      await fetchData();
      setIsEditOrderModalOpen(false);
      setOrderToEdit(null);
    } catch (err: any) {
      setEditOrderError(err.response?.data?.message || 'Failed to update order.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Cancel Order state (allowed ONLY if NOT in production run)
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const openCancelModal = (order: any) => {
    if (order.is_in_production_run) {
      alert(`Order ${order.order_number} cannot be cancelled because it is already in the production run.`);
      return;
    }
    setOrderToCancel(order);
    setCancelReason('');
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToCancel) return;
    setIsSubmittingCancel(true);
    setCancelError(null);
    try {
      await api.post(`/orders/${orderToCancel.id}/cancel`, {
        reason: cancelReason.trim() || undefined,
      });
      await fetchData();
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Failed to cancel customer order.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Form state: Order with multiple recipe line items
  const [orderForm, setOrderForm] = useState<{
    customerId: string;
    orderNumber: string;
    requiredDeliveryDate: string;
    notes: string;
    items: OrderLineItem[];
  }>({
    customerId: '',
    orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${Math.floor(Math.random() * 90 + 10)}`,
    requiredDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
    items: [
      {
        id: 'item-1',
        productId: '',
        requestedQuantityKg: 500,
        sizeMicron: '',
        grade: '',
        sellingPricePerKg: '',
        notes: '',
        isCustomSize: false,
      },
    ],
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
      const [ordRes, custRes, prdRes, matRes, smRes, fgRes] = await Promise.all([
        api.get('/orders'),
        api.get('/orders/customers'),
        api.get('/products'),
        api.get('/materials'),
        api.get('/size-microns'),
        api.get('/finished-goods'),
      ]);
      const fetchedCustomers = custRes.data.customers || [];
      const fetchedProducts = prdRes.data.products || [];
      const fetchedMaterials = matRes.data.materials || [];
      const fetchedSizeMicrons = smRes.data.sizeMicrons || [];
      const fetchedFGs = fgRes.data.batches || [];

      setOrders(ordRes.data.orders || []);
      setCustomers(fetchedCustomers);
      setProducts(fetchedProducts);
      setMaterials(fetchedMaterials);
      setSizeMicrons(fetchedSizeMicrons);
      setFgBatches(fetchedFGs);

      if (fetchedCustomers.length > 0 && !orderForm.customerId) {
        setOrderForm((prev) => ({ ...prev, customerId: fetchedCustomers[0].id }));
      }
      if (fetchedProducts.length > 0) {
        setOrderForm((prev) => ({
          ...prev,
          items: prev.items.map((it, idx) =>
            idx === 0 && !it.productId
              ? {
                  ...it,
                  productId: fetchedProducts[0].id,
                  sizeMicron: it.sizeMicron || fetchedProducts[0].size_micron || '',
                }
              : it
          ),
        }));
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

  // Open Create Order Modal with fresh default values
  const handleOpenCreateOrder = () => {
    const defaultCustId = customers[0]?.id || '';
    const defaultProd = products[0];
    setOrderForm({
      customerId: defaultCustId,
      orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${Math.floor(Math.random() * 90 + 10)}`,
      requiredDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: '',
      items: [
        {
          id: `item-${Date.now()}`,
          productId: defaultProd?.id || '',
          requestedQuantityKg: 500,
          sizeMicron: defaultProd?.size_micron || '',
          grade: '',
          sellingPricePerKg: '',
          notes: '',
          isCustomSize: false,
        },
      ],
    });
    setIsOrderModalOpen(true);
  };

  // Line Item Management
  const handleAddItem = () => {
    const defaultProd = products[0];
    setOrderForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: defaultProd?.id || '',
          requestedQuantityKg: 100,
          sizeMicron: defaultProd?.size_micron || '',
          grade: '',
          sellingPricePerKg: '',
          notes: '',
          isCustomSize: false,
        },
      ],
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (orderForm.items.length <= 1) return;
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const handleItemChange = (id: string, field: keyof OrderLineItem, value: any) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== id) return it;
        if (field === 'productId') {
          const prod = products.find((p) => p.id === value);
          return {
            ...it,
            productId: value,
            sizeMicron: prod?.size_micron || it.sizeMicron,
          };
        }
        return { ...it, [field]: value };
      }),
    }));
  };

  // Create Order with Multiple Recipes / Line Items
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customerId) {
      alert('Please select or add a customer first.');
      return;
    }
    if (orderForm.items.length === 0) {
      alert('Please add at least one recipe / product line item.');
      return;
    }

    for (let i = 0; i < orderForm.items.length; i++) {
      const it = orderForm.items[i];
      if (!it.productId) {
        alert(`Please select a product/recipe for Recipe Item #${i + 1}.`);
        return;
      }
      const qty = Number(it.requestedQuantityKg);
      if (!qty || qty <= 0) {
        alert(`Please enter a valid requested quantity (> 0 kg) for Recipe Item #${i + 1}.`);
        return;
      }
      const sellPrice = parseFloat(String(it.sellingPricePerKg));
      if (!sellPrice || sellPrice <= 0) {
        alert(`Please enter a valid selling price (> ₹0/kg) for Recipe Item #${i + 1}.`);
        return;
      }
    }

    const payloadItems = orderForm.items.map((it) => {
      const selectedProduct = products.find((p) => p.id === it.productId);
      const recipeCost = getProductRecipeCost(selectedProduct);
      const sellPrice = parseFloat(String(it.sellingPricePerKg)) || 0;
      return {
        productId: it.productId,
        requestedQuantityKg: Number(it.requestedQuantityKg),
        sellingPricePerKg: sellPrice,
        recipeCostPerKg: recipeCost,
        grade: it.grade?.trim() || undefined,
        sizeMicron: it.sizeMicron?.trim() || undefined,
        notes: it.notes?.trim() || undefined,
      };
    });

    setIsSubmitting(true);
    try {
      await api.post('/orders', {
        customerId: orderForm.customerId,
        requiredDeliveryDate: orderForm.requiredDeliveryDate,
        grade: payloadItems[0]?.grade,
        sizeMicron: payloadItems[0]?.sizeMicron,
        sellingPricePerKg: payloadItems[0]?.sellingPricePerKg,
        recipeCostPerKg: payloadItems[0]?.recipeCostPerKg,
        notes: orderForm.notes,
        items: payloadItems,
      });
      setIsOrderModalOpen(false);
      setOrderForm({
        customerId: customers[0]?.id || '',
        orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-00${Math.floor(Math.random() * 90 + 10)}`,
        requiredDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: '',
        items: [
          {
            id: `item-${Date.now()}`,
            productId: products[0]?.id || '',
            requestedQuantityKg: 500,
            sizeMicron: products[0]?.size_micron || '',
            grade: '',
            sellingPricePerKg: '',
            notes: '',
            isCustomSize: false,
          },
        ],
      });
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-start sm:items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-brand-500 shrink-0 mt-0.5 sm:mt-0" />
            <span>Customer Orders & Production Demand</span>
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
                handleOpenCreateOrder();
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
              const orderItems: any[] = (order.customer_order_items && order.customer_order_items.length > 0)
                ? order.customer_order_items
                : (order.items && order.items.length > 0 ? order.items : [{}]);
              const isMultiItem = orderItems.length > 1;
              const primaryItem = orderItems[0] || {};
              const primaryProductName = primaryItem.products?.name || products.find((p) => p.id === primaryItem.product_id)?.name;
              const primaryGrade = order.grade || primaryItem.grade;
              const primarySizeMicron = order.size_micron || order.sizeMicron || primaryItem.size_micron || primaryItem.sizeMicron;

              const totalRequested = orderItems.reduce(
                (sum: number, it: any) => sum + Number(it.requested_quantity_kg || 0),
                0
              ) || Number(order.total_requested_weight_kg || 0);

              const totalProduced = orderItems.reduce(
                (sum: number, it: any) => sum + Number(it.produced_quantity_kg || 0),
                0
              );

              const totalDispatched = orderItems.reduce(
                (sum: number, it: any) => sum + Number(it.dispatched_quantity_kg || 0),
                0
              );

              const prodPercent = totalRequested > 0 ? Math.min(100, Math.round((totalProduced / totalRequested) * 100)) : 0;
              const dispPercent = totalRequested > 0 ? Math.min(100, Math.round((totalDispatched / totalRequested) * 100)) : 0;
              const isProductionCompleted =
                ['completed', 'delivered', 'cancelled'].includes(order.status) ||
                (totalProduced >= totalRequested && totalRequested > 0 && ['produced', 'completed'].includes(order.status));

              const isInProductionRun = Boolean(
                order.is_in_production_run ?? (
                  ['in_production', 'partially_produced', 'produced', 'completed', 'partially_dispatched', 'dispatched'].includes(order.status) ||
                  totalProduced > 0 ||
                  Number(order.active_production_batches_count || 0) > 0
                )
              );

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {order.customers?.name || order.customer_name || 'Direct Client'}
                          {order.customers?.contact_person && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({order.customers.contact_person})
                            </span>
                          )}
                        </h3>
                        <Badge
                          variant={
                            order.status === 'completed'
                              ? 'success'
                              : order.status === 'cancelled'
                                ? 'danger'
                                : order.status === 'in_production' || order.status === 'partially_produced'
                                  ? 'warning'
                                  : 'info'
                          }
                        >
                          {order.status}
                        </Badge>
                        {isMultiItem && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                            <Layers className="w-3 h-3 text-indigo-500" />
                            {orderItems.length} Recipes
                          </span>
                        )}
                      </div>
                      {order.customers?.delivery_address && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{order.customers.delivery_address}</span>
                        </p>
                      )}

                      {/* Single Product Specifications (If 1 item) */}
                      {!isMultiItem && (primaryProductName || primaryGrade || primarySizeMicron || (order.notes && !order.notes.startsWith('{'))) && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {primaryProductName && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-factory-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <Package className="w-3 h-3 text-brand-500" />
                              {primaryProductName}
                            </span>
                          )}
                          {primaryGrade && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                              <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Grade:</span>
                              {primaryGrade}
                            </span>
                          )}
                          {primarySizeMicron && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                              <span className="text-[10px] uppercase font-semibold text-sky-600 dark:text-sky-400">Size / Micron:</span>
                              {primarySizeMicron}
                            </span>
                          )}
                          {Number(order.selling_price_per_kg || primaryItem.selling_price_per_kg) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
                              <span className="text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400">Sell:</span>
                              ₹{Number(order.selling_price_per_kg || primaryItem.selling_price_per_kg).toFixed(2)}/kg
                            </span>
                          )}
                          {Number(order.recipe_cost_per_kg || primaryItem.recipe_cost_per_kg) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-factory-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] uppercase font-semibold text-slate-500">BOM Cost:</span>
                              ₹{Number(order.recipe_cost_per_kg || primaryItem.recipe_cost_per_kg).toFixed(2)}/kg
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

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Order Date: {order.order_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Target Delivery: {order.required_delivery_date}</span>
                      </div>
                      <div className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-lg border border-brand-200 dark:border-brand-800/40 flex items-center gap-2">
                        <span>Total: {totalRequested} kg</span>
                        {Number(order.total_order_value) > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 border-l border-brand-200 dark:border-brand-800/60 pl-2">
                            ₹{Number(order.total_order_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      {/* Order Modification Actions: Locked if order is in production run */}
                      {isInProductionRun ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 shadow-xs cursor-default"
                          title="Order is locked: Production has already started or batches exist. Quantities, recipes, and status cannot be cancelled or altered."
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>In Production Run (Locked)</span>
                        </span>
                      ) : order.status === 'cancelled' ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 shadow-xs cursor-default"
                          title="This order has been cancelled"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-500" />
                          <span>Order Cancelled</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditOrderModal(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-factory-800 dark:hover:bg-factory-700 border border-slate-200 dark:border-slate-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xs"
                            title="Edit order recipes, items, specs, or delivery date before production starts"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-brand-500" />
                            <span>Edit Order</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openIncreaseQtyModal(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95 shadow-xs"
                            title="Increase order quantity before production starts"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Increase Quantity</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openCancelModal(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 transition-all hover:scale-[1.02] active:scale-95 shadow-xs"
                            title="Cancel this order before production begins"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Cancel Order</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Overall Progress Tracking (Ordered -> Produced -> Dispatched) */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">1. Total Ordered</span>
                      <p className="font-mono text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {totalRequested} kg
                      </p>
                      <p className="text-[10px] text-slate-400">100% Demand</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-factory-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">2. Produced</span>
                        <span className="text-[10px] font-mono font-bold text-amber-500">{prodPercent}%</span>
                      </div>
                      <p className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {totalProduced} kg
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
                        {totalDispatched} kg
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dispPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Recipe Itemized Specifications Breakdown */}
                  {isMultiItem && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          Multi-Recipe Specifications ({orderItems.length} Line Items)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Total Demand: {totalRequested} kg
                        </span>
                      </div>

                      <div className="space-y-2">
                        {orderItems.map((itm: any, itmIdx: number) => {
                          const itmProdName = itm.products?.name || products.find((p) => p.id === itm.product_id)?.name || 'Custom Formulation';
                          const itmReq = Number(itm.requested_quantity_kg || 0);
                          const itmProd = Number(itm.produced_quantity_kg || 0);
                          const itmDisp = Number(itm.dispatched_quantity_kg || 0);
                          const itmProdPct = itmReq > 0 ? Math.min(100, Math.round((itmProd / itmReq) * 100)) : 0;
                          const itmDispPct = itmReq > 0 ? Math.min(100, Math.round((itmDisp / itmReq) * 100)) : 0;

                          return (
                            <div
                              key={itm.id || itmIdx}
                              className="p-3 rounded-xl bg-slate-50/70 dark:bg-factory-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                    Item #{itmIdx + 1}
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {itmProdName}
                                  </span>
                                  {itm.grade && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                      Grade: {itm.grade}
                                    </span>
                                  )}
                                  {itm.size_micron && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                                      {itm.size_micron}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span>Demand: <strong className="font-mono text-slate-700 dark:text-slate-300">{itmReq} kg</strong></span>
                                  <span>Produced: <strong className="font-mono text-amber-600 dark:text-amber-400">{itmProd} kg ({itmProdPct}%)</strong></span>
                                  <span>Dispatched: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{itmDisp} kg ({itmDispPct}%)</strong></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center font-mono">
                                {Number(itm.selling_price_per_kg) > 0 && (
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block font-sans">Selling Rate</span>
                                    <span className="font-bold text-teal-600 dark:text-teal-400">₹{Number(itm.selling_price_per_kg).toFixed(2)}/kg</span>
                                  </div>
                                )}
                                {Number(itm.recipe_cost_per_kg) > 0 && (
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block font-sans">BOM Cost</span>
                                    <span className="text-slate-500">₹{Number(itm.recipe_cost_per_kg).toFixed(2)}/kg</span>
                                  </div>
                                )}
                                {Number(itm.requested_quantity_kg) > 0 && Number(itm.selling_price_per_kg) > 0 && (
                                  <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-3">
                                    <span className="text-[10px] text-slate-400 block font-sans">Item Value</span>
                                    <span className="font-black text-slate-900 dark:text-white">
                                      ₹{(Number(itm.requested_quantity_kg) * Number(itm.selling_price_per_kg)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                {!isInProductionRun && itmProd < itmReq && (
                                  <button
                                    type="button"
                                    onClick={() => openIncreaseQtyModal(order, itm.id)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1 transition-colors ml-1 shrink-0"
                                    title="Increase requested quantity for this specific recipe"
                                  >
                                    <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Increase</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Direct Dispatch Match Finder (Job Work & Floor Stock Matching Product + Spec) */}
                  {(() => {
                    const targetProdId = primaryItem.product_id;
                    const targetSpecLower = (primarySizeMicron || '').trim().toLowerCase();
                    const pendingKg = Math.max(0, totalRequested - totalDispatched);

                    if (pendingKg <= 0 || !targetProdId || !targetSpecLower) return null;

                    const matchedBatches = fgBatches.filter((b: any) => {
                      const isProdMatch = b.product_id === targetProdId;
                      const bSpecLower = (b.size_micron || '').trim().toLowerCase();
                      return isProdMatch && bSpecLower === targetSpecLower && Number(b.quantity_on_hand_kg) > 0;
                    });

                    if (matchedBatches.length === 0) return null;

                    const totalMatchedStock = matchedBatches.reduce(
                      (sum: number, b: any) => sum + Number(b.quantity_on_hand_kg || 0),
                      0
                    );
                    const bestBatch = matchedBatches[0];
                    const isJW =
                      (bestBatch.production_batches?.operator_name || bestBatch.operator_name || '')
                        .toLowerCase()
                        .includes('job work') || bestBatch.batch_number?.startsWith('FG-JW');
                    const jwVendor =
                      bestBatch.production_batches?.operator_name || bestBatch.operator_name || 'Job Work Vendor';
                    const allocatableKg = Math.min(pendingKg, totalMatchedStock);

                    return (
                      <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <Zap className="w-4 h-4 fill-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                Ready in Stock for Direct Dispatch!
                              </span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                {totalMatchedStock} kg available ({matchedBatches.length}{' '}
                                {matchedBatches.length === 1 ? 'batch' : 'batches'})
                              </span>
                              {isJW && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                  From Job Work ({jwVendor})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              Product and exact specification <strong>"{primarySizeMicron}"</strong> are ready in floor inventory (Lot:{' '}
                              <strong className="font-mono">{bestBatch.batch_number}</strong>). Fulfill this order directly with zero extra production wait!
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/dispatch?orderId=${order.id}&batchId=${bestBatch.id}`}
                          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 whitespace-nowrap self-end sm:self-center"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Direct Dispatch ({allocatableKg} kg)</span>
                        </Link>
                      </div>
                    );
                  })()}
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
              No customers registered yet. Click "Add Customer" to register client accounts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <tr>
                    <th className="px-3.5 py-3 whitespace-nowrap">Company Name</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Contact Person</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Phone & Email</th>
                    <th className="px-3.5 py-3 whitespace-nowrap">Delivery Address</th>
                    <th className="px-3.5 py-3 text-center whitespace-nowrap">Status</th>
                    <th className="px-3.5 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-factory-800/40">
                      <td className="px-3.5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {cust.name}
                      </td>
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {cust.contact_person || '—'}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-500 space-y-0.5">
                        {cust.phone && (
                          <div className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                        {cust.email && (
                          <div className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{cust.email}</span>
                          </div>
                        )}
                        {!cust.phone && !cust.email && '—'}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-500 max-w-xs truncate" title={cust.delivery_address}>
                        {cust.delivery_address || '—'}
                      </td>
                      <td className="px-3.5 py-3.5 text-center">
                        <Badge variant={cust.is_active !== false ? 'success' : 'neutral'}>
                          {cust.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
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
                <strong>{customerToDelete?.name}</strong> will be permanently removed from your client directory.
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

      {/* Modal: Create Customer Order (Multi-Recipe Support) */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Customer Order"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {/* Customer & Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Customer Company *
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
                <div className="p-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200">
                  No customers registered. Please add a customer first.
                </div>
              ) : (
                <select
                  required
                  value={orderForm.customerId}
                  onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="" disabled>-- Select Customer Company --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Delivery Date *
              </label>
              <input
                type="date"
                required
                value={orderForm.requiredDeliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, requiredDeliveryDate: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Section: Recipe & Product Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-brand-500" />
                  Recipe Items & Product Line Items ({orderForm.items.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Customers can order multiple film recipes / product formulations under a single purchase order.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Recipe Item
              </button>
            </div>

            {/* List of Recipe Item Cards - Single smooth flow, NO inner scroll traps */}
            <div className="space-y-3">
              {orderForm.items.map((it, idx) => {
                const selectedProduct = products.find((p) => p.id === it.productId);
                const recipeCost = getProductRecipeCost(selectedProduct);
                const sellPrice =
                  typeof it.sellingPricePerKg === 'number'
                    ? it.sellingPricePerKg
                    : parseFloat(String(it.sellingPricePerKg)) || 0;
                const margin = sellPrice > 0 ? sellPrice - recipeCost : 0;
                const marginPct = recipeCost > 0 ? (margin / recipeCost) * 100 : 0;
                const weight = Number(it.requestedQuantityKg) || 0;
                const totalItemVal = sellPrice * weight;

                return (
                  <div
                    key={it.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-factory-800/30 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  >
                    {/* Item Card Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                          Recipe Item #{idx + 1}
                        </span>
                        {selectedProduct && (
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-brand-500" />
                            {selectedProduct.name}
                          </span>
                        )}
                        {it.sizeMicron && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-factory-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                            {it.sizeMicron}
                          </span>
                        )}
                        {weight > 0 && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                            {weight} kg
                          </span>
                        )}
                      </div>

                      {orderForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/50"
                          title="Remove this recipe item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Form Fields: Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Product Formulation */}
                      <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Product / Formulation *
                        </label>
                        {products.length === 0 ? (
                          <div className="p-2 text-xs text-amber-600 bg-amber-50 rounded-xl border">
                            No products available.
                          </div>
                        ) : (
                          <select
                            required
                            value={it.productId}
                            onChange={(e) => handleItemChange(it.id, 'productId', e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20"
                          >
                            <option value="" disabled>-- Select Formulation --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.code ? `(${p.code})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Size / Micron */}
                      <div className="md:col-span-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Size / Micron *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveQuickSizeItemId(it.id);
                              setSizeToEdit(null);
                              setQuickSizeForm({ size: '', micron: 50, unit: 'Micron', label: '50 Micron', description: '' });
                              setIsQuickSizeModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" /> Master
                          </button>
                        </div>

                        <select
                          value={
                            sizeMicrons.some((sm) => sm.label === it.sizeMicron)
                              ? it.sizeMicron
                              : it.sizeMicron
                                ? '__custom__'
                                : ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              handleItemChange(it.id, 'isCustomSize', true);
                            } else {
                              handleItemChange(it.id, 'isCustomSize', false);
                              handleItemChange(it.id, 'sizeMicron', val);
                            }
                          }}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20"
                        >
                          <option value="">-- Master Specification --</option>
                          {sizeMicrons
                            .filter((sm) => sm.is_active)
                            .map((sm) => (
                              <option key={sm.id} value={sm.label}>
                                {sm.label} {sm.description ? `(${sm.description})` : ''}
                              </option>
                            ))}
                          <option value="__custom__">➕ Custom Specification...</option>
                        </select>

                        {(it.isCustomSize ||
                          (!sizeMicrons.some((sm) => sm.label === it.sizeMicron) && it.sizeMicron)) && (
                          <div className="mt-1.5">
                            <input
                              type="text"
                              placeholder="e.g. 600 - 20 Micron"
                              value={it.sizeMicron}
                              onChange={(e) => handleItemChange(it.id, 'sizeMicron', e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white dark:bg-factory-900 border border-brand-500 rounded-xl ring-2 ring-brand-500/20"
                            />
                          </div>
                        )}
                      </div>

                      {/* Grade */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Grade / Resin Spec
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Virgin, Food"
                          value={it.grade}
                          onChange={(e) => handleItemChange(it.id, 'grade', e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Form Fields: Row 2 (Weight, Costs, Selling Rate, Line Subtotal) */}
                    <div className="mt-3 p-3 rounded-xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                      {/* Requested Weight */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          Requested Weight *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            min="1"
                            required
                            value={it.requestedQuantityKg}
                            onChange={(e) =>
                              handleItemChange(it.id, 'requestedQuantityKg', parseFloat(e.target.value) || '')
                            }
                            placeholder="100"
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200 pr-8"
                          />
                          <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">kg</span>
                        </div>
                      </div>

                      {/* Formula BOM Cost */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Formula BOM Cost</span>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-700 dark:text-slate-300 py-1">
                          <span>₹{recipeCost.toFixed(2)}</span>
                          <span className="text-[10px] font-semibold text-slate-400 font-sans">/kg</span>
                        </div>
                      </div>

                      {/* Selling Price Per KG */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                          Selling Price (₹/kg) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="e.g. 135.00"
                            value={it.sellingPricePerKg}
                            onChange={(e) =>
                              handleItemChange(
                                it.id,
                                'sellingPricePerKg',
                                e.target.value === '' ? '' : parseFloat(e.target.value)
                              )
                            }
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 pr-10 focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <span className="absolute right-2 top-1.5 text-[11px] text-slate-400 font-bold">₹/kg</span>
                        </div>
                      </div>

                      {/* Line Subtotal & Margin */}
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Line Subtotal & Margin</span>
                        <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          ₹{totalItemVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {sellPrice > 0 ? (
                          <div className={`text-[10px] font-mono font-bold mt-0.5 ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {margin >= 0 ? '+' : ''}₹{margin.toFixed(2)}/kg {recipeCost > 0 && `(${margin >= 0 ? '+' : ''}${marginPct.toFixed(1)}%)`}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">Pending selling price</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Recipe Button */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 px-4 border-2 border-dashed border-brand-300 dark:border-brand-800/60 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Recipe / Line Item to this Order
            </button>
          </div>

          {/* Aggregate Order Summary */}
          {(() => {
            const totalWeight = orderForm.items.reduce(
              (sum, it) => sum + (Number(it.requestedQuantityKg) || 0),
              0
            );
            const totalVal = orderForm.items.reduce((sum, it) => {
              const qty = Number(it.requestedQuantityKg) || 0;
              const sell = Number(it.sellingPricePerKg) || 0;
              return sum + qty * sell;
            }, 0);
            const totalCost = orderForm.items.reduce((sum, it) => {
              const qty = Number(it.requestedQuantityKg) || 0;
              const prod = products.find((p) => p.id === it.productId);
              const cost = getProductRecipeCost(prod);
              return sum + qty * cost;
            }, 0);
            const totalMargin = totalVal - totalCost;
            const marginPct = totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;
            const hasEnteredPrices = orderForm.items.some((it) => Number(it.sellingPricePerKg) > 0);

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-slate-50 dark:from-factory-800/80 dark:to-factory-800/40 border border-emerald-500/20 dark:border-emerald-500/30 space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20 shadow-sm">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Combined Order Summary
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {orderForm.items.length} {orderForm.items.length === 1 ? 'Recipe Item' : 'Recipe Items'} under this Purchase Order
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-700/80 text-right shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Total Weight</span>
                      <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                        {totalWeight.toLocaleString('en-IN')} kg
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-700/80 text-right shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Est. Material Cost</span>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Est. Gross Margin</span>
                    {hasEnteredPrices ? (
                      <span
                        className={`text-sm font-mono font-bold ${
                          totalMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {totalMargin >= 0 ? '+' : ''}₹{totalMargin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {totalCost > 0 && ` (${totalMargin >= 0 ? '+' : ''}${marginPct.toFixed(1)}%)`}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Awaiting Selling Price Inputs
                      </span>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Total Order Value</span>
                    <span className="font-mono text-xl font-black text-slate-900 dark:text-white">
                      ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* General Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Order Notes / Delivery Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. PO #PO-99124, delivery at gate #2, certificate of analysis required"
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
              Confirm Customer Order ({orderForm.items.length} {orderForm.items.length === 1 ? 'Recipe' : 'Recipes'})
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
                if (activeQuickSizeItemId) {
                  handleItemChange(activeQuickSizeItemId, 'sizeMicron', created.label);
                  handleItemChange(activeQuickSizeItemId, 'isCustomSize', false);
                }
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

      {/* Modal: Increase Order Quantity */}
      <Modal
        isOpen={Boolean(orderToIncrease)}
        onClose={() => {
          if (!isSubmittingIncrease) setOrderToIncrease(null);
        }}
        title={orderToIncrease ? `Increase Order Quantity — ${orderToIncrease.order_number}` : ''}
        maxWidth="lg"
      >
        {orderToIncrease && (() => {
          const items: any[] = (orderToIncrease.customer_order_items && orderToIncrease.customer_order_items.length > 0)
            ? orderToIncrease.customer_order_items
            : (orderToIncrease.items && orderToIncrease.items.length > 0 ? orderToIncrease.items : [{}]);
          const chosenItem = items.find((i: any) => i.id === selectedItemToIncreaseId) || items[0] || {};
          const chosenProductName = chosenItem.products?.name || products.find((p) => p.id === chosenItem.product_id)?.name || 'Custom Product';
          const chosenSpec = chosenItem.size_micron || orderToIncrease.size_micron || orderToIncrease.sizeMicron || 'Standard';
          const chosenGrade = chosenItem.grade || orderToIncrease.grade || '';
          
          const currentItemReq = Number(chosenItem.requested_quantity_kg || orderToIncrease.total_requested_weight_kg || 0);
          const currentItemProd = Number(chosenItem.produced_quantity_kg || 0);
          const currentItemDisp = Number(chosenItem.dispatched_quantity_kg || 0);
          const currentTotalReq = items.reduce((s, it) => s + Number(it.requested_quantity_kg || 0), 0) || currentItemReq;
          
          const extraKg = typeof increaseAmountKg === 'number' ? increaseAmountKg : 0;
          const targetTotalItemKg = currentItemReq + extraKg;
          const newTotalOrderKg = currentTotalReq + extraKg;
          const newRemainingDemandKg = Math.max(0, targetTotalItemKg - currentItemProd);
          
          const sellRate = Number(chosenItem.selling_price_per_kg || orderToIncrease.selling_price_per_kg || 0);
          const extraValue = extraKg * sellRate;

          return (
            <div className="space-y-4">
              {/* Order Info Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {orderToIncrease.customers?.name || orderToIncrease.customer_name || 'Direct Client'}
                    </span>
                    <Badge variant="warning">{orderToIncrease.status}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Order Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{orderToIncrease.order_date}</span> • Target Delivery: <span className="font-semibold text-slate-700 dark:text-slate-300">{orderToIncrease.required_delivery_date}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Order Demand</span>
                  <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-200">{currentTotalReq} kg</span>
                </div>
              </div>

              {/* Multi-Item Selector if order has multiple line items */}
              {items.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    Select Recipe Line Item to Increase:
                  </label>
                  <select
                    value={selectedItemToIncreaseId}
                    onChange={(e) => handleItemSelectChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-factory-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                  >
                    {items.map((it: any, idx: number) => {
                      const pName = it.products?.name || products.find((p) => p.id === it.product_id)?.name || 'Product';
                      const spec = it.size_micron || 'Standard';
                      const req = Number(it.requested_quantity_kg || 0);
                      const prod = Number(it.produced_quantity_kg || 0);
                      return (
                        <option key={it.id || idx} value={it.id}>
                          Recipe #{idx + 1}: {pName} • {spec} {it.grade ? `[${it.grade}]` : ''} (Current: {req} kg | Produced: {prod} kg)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Recipe / Product Formulation Selector to update recipe */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-factory-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-brand-500" />
                    Product Formulation & Recipe:
                  </label>
                  {selectedRecipeProductId !== chosenItem.product_id && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                      Recipe Update Pending
                    </span>
                  )}
                </div>

                <select
                  value={selectedRecipeProductId}
                  onChange={(e) => {
                    setSelectedRecipeProductId(e.target.value);
                    if (extraKg > 0) {
                      checkStockFeasibility(e.target.value, extraKg);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-brand-500/20 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Size / Micron Spec
                    </label>
                    <select
                      value={
                        sizeMicrons.some((sm) => sm.label === selectedSizeMicron)
                          ? selectedSizeMicron
                          : selectedSizeMicron ? '__custom__' : ''
                      }
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          setSelectedSizeMicron(e.target.value);
                        }
                      }}
                      className="w-full text-xs px-3 py-1.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                    >
                      <option value="">-- Match Master Spec --</option>
                      {sizeMicrons.filter((sm) => sm.is_active).map((sm) => (
                        <option key={sm.id} value={sm.label}>{sm.label}</option>
                      ))}
                      <option value="__custom__">➕ Custom Spec</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Grade / Resin Spec
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Virgin / Food Grade"
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity Adjustment Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Add Extra Quantity (+ kg) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      step="any"
                      value={increaseAmountKg}
                      onChange={(e) => handleExtraKgChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="e.g. 50"
                      className="w-full text-sm font-mono font-bold px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Total Item Quantity (kg) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={currentItemReq + 1}
                      step="any"
                      value={newTotalQuantityKg}
                      onChange={(e) => handleNewTotalKgChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder={`Min: ${currentItemReq + 1}`}
                      className="w-full text-sm font-mono font-bold px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>
              </div>

              {/* Quick Add Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Add:</span>
                {[10, 25, 50, 100, 250, 500].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => handleExtraKgChange(pill)}
                    className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-factory-800 dark:hover:bg-factory-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    +{pill} kg
                  </button>
                ))}
              </div>

              {/* Real-time Material Inventory Feasibility Check Card */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-factory-800/40 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-brand-500" />
                    Production Raw Material Availability Check (+{extraKg} kg)
                  </span>
                  {feasibilityCheck.loading ? (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin text-brand-500" /> Checking stock...
                    </span>
                  ) : feasibilityCheck.result ? (
                    feasibilityCheck.result.sufficient ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Sufficient Material Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/40">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Insufficient Stock
                      </span>
                    )
                  ) : null}
                </div>

                {feasibilityCheck.result && feasibilityCheck.result.requirements?.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {feasibilityCheck.result.requirements.map((req: any) => (
                      <div
                        key={req.material_id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono border ${
                          req.sufficient
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300'
                            : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {req.sufficient ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span className="font-sans font-bold">{req.material_name}</span>
                          <span className="text-[10px] text-slate-400 font-sans">({req.percentage}%)</span>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span>Need: <strong>{req.required_kg} kg</strong></span>
                          <span className={req.sufficient ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                            In Stock: {req.available_stock_kg} kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !feasibilityCheck.loading && (
                    <p className="text-[11px] text-slate-400 italic">No formulation ingredients required for standard input.</p>
                  )
                )}

                {feasibilityCheck.result && !feasibilityCheck.result.sufficient && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900/50 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>Cannot increase order: Factory warehouse does not have enough raw materials in stock to produce this extra demand. Please procure raw material inventory before increasing demand.</span>
                  </div>
                )}
              </div>

              {/* Live Preview Summary Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-slate-50 dark:from-factory-800/80 dark:to-factory-800/40 border border-emerald-500/20 dark:border-emerald-500/30 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Order Impact Preview
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-factory-900/80 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Additional</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+{extraKg} kg</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-factory-900/80 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">New Item Total</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{targetTotalItemKg} kg</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-factory-900/80 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">New Order Total</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{newTotalOrderKg} kg</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-factory-900/80 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">To Produce</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{newRemainingDemandKg} kg</span>
                  </div>
                </div>

                {sellRate > 0 && extraValue > 0 && (
                  <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-xs font-sans">
                    <span className="text-slate-500 dark:text-slate-400">Additional Order Value (@ ₹{sellRate.toFixed(2)}/kg):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +₹{extraValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Reason / Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={increaseReason}
                  onChange={(e) => setIncreaseReason(e.target.value)}
                  placeholder="e.g. Customer requested +50 kg more before production run"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              {/* Error Message */}
              {increaseError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{increaseError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderToIncrease(null)}
                  disabled={isSubmittingIncrease}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmIncreaseQty}
                  disabled={
                    isSubmittingIncrease ||
                    !extraKg ||
                    extraKg <= 0 ||
                    Boolean(feasibilityCheck.result && !feasibilityCheck.result.sufficient)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {isSubmittingIncrease ? 'Increasing Quantity...' : `Confirm & Add +${extraKg} kg`}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Customer Order & Recipes Modal (Available only when order is not in production run) */}
      <Modal
        isOpen={isEditOrderModalOpen}
        onClose={() => {
          if (!isSubmittingEdit) {
            setIsEditOrderModalOpen(false);
            setOrderToEdit(null);
          }
        }}
        title={orderToEdit ? `Edit Order & Formulations - ${orderToEdit.order_number}` : 'Edit Customer Order'}
        maxWidth="4xl"
      >
        {orderToEdit && (
          <form onSubmit={handleConfirmEditOrder} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-blue-600" />
              <span>
                You are updating <strong>{orderToEdit.order_number}</strong>. Because this order is not yet running in production, line items, recipes, target specifications, and demand quantities can be safely adjusted.
              </span>
            </div>

            {/* Customer & Delivery Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Enterprise Client *
                </label>
                <select
                  required
                  value={editOrderForm.customerId}
                  onChange={(e) => setEditOrderForm({ ...editOrderForm, customerId: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Required Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={editOrderForm.requiredDeliveryDate}
                  onChange={(e) => setEditOrderForm({ ...editOrderForm, requiredDeliveryDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-500" />
                  Order Recipe Line Items ({editOrderForm.items.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddEditItem}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Recipe Item
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {editOrderForm.items.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-factory-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Item #{idx + 1}
                      </span>
                      {editOrderForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(it.id)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Product Formulation */}
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Product Formulation (Recipe) *
                        </label>
                        <select
                          required
                          value={it.productId}
                          onChange={(e) => handleEditItemChange(it.id, 'productId', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.code ? `(${p.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size / Micron */}
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Size / Micron
                        </label>
                        <select
                          value={
                            sizeMicrons.some((sm) => sm.label === it.sizeMicron)
                              ? it.sizeMicron
                              : it.sizeMicron ? '__custom__' : ''
                          }
                          onChange={(e) => {
                            if (e.target.value !== '__custom__') {
                              handleEditItemChange(it.id, 'sizeMicron', e.target.value);
                            }
                          }}
                          className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        >
                          <option value="">-- Match Master Spec --</option>
                          {sizeMicrons.filter((sm) => sm.is_active).map((sm) => (
                            <option key={sm.id} value={sm.label}>{sm.label}</option>
                          ))}
                          <option value="__custom__">➕ Custom Spec</option>
                        </select>
                      </div>

                      {/* Grade */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Grade / Resin Spec
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Virgin"
                          value={it.grade}
                          onChange={(e) => handleEditItemChange(it.id, 'grade', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      {/* Requested Weight */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Requested Weight (kg) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          required
                          value={it.requestedQuantityKg}
                          onChange={(e) => handleEditItemChange(it.id, 'requestedQuantityKg', parseFloat(e.target.value) || '')}
                          className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-lg text-emerald-600"
                        />
                      </div>

                      {/* Selling Price */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Selling Price (₹/kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 135"
                          value={it.sellingPricePerKg}
                          onChange={(e) => handleEditItemChange(it.id, 'sellingPricePerKg', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full text-xs font-mono px-2.5 py-1.5 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                      </div>

                      {/* Item Total Value */}
                      <div className="text-right pt-2 font-mono">
                        <span className="text-[10px] text-slate-400 uppercase block">Line Subtotal</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                          ₹{((Number(it.requestedQuantityKg) || 0) * (Number(it.sellingPricePerKg) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Order Notes / Customer Remarks
              </label>
              <textarea
                rows={2}
                value={editOrderForm.notes}
                onChange={(e) => setEditOrderForm({ ...editOrderForm, notes: e.target.value })}
                placeholder="Optional notes or instructions..."
                className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            {editOrderError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editOrderError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditOrderModalOpen(false);
                  setOrderToEdit(null);
                }}
                disabled={isSubmittingEdit}
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isSubmittingEdit ? 'Saving Changes...' : 'Save & Update Order'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Cancel Customer Order */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          if (!isSubmittingCancel) {
            setIsCancelModalOpen(false);
            setOrderToCancel(null);
          }
        }}
        title={`Cancel Customer Order: ${orderToCancel?.order_number || ''}`}
        maxWidth="md"
      >
        {orderToCancel && (
          <form onSubmit={handleConfirmCancelOrder} className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Are you sure you want to cancel this order?
                  </h4>
                  <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90 mt-1">
                    Once cancelled, this customer order will be marked as <strong>Cancelled</strong> and removed from the active factory production queue.
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {orderToCancel.customers?.name || orderToCancel.customer_name || 'Direct Client'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Demand</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {orderToCancel.total_requested_weight_kg || 0} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Delivery</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {orderToCancel.required_delivery_date || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                  <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                    {orderToCancel.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Cancellation <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer cancelled order, specifications changed, duplicate entry..."
                className="w-full text-xs px-3 py-2 bg-white dark:bg-factory-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setOrderToCancel(null);
                }}
                disabled={isSubmittingCancel}
              >
                Keep Order
              </Button>
              <button
                type="submit"
                disabled={isSubmittingCancel}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95"
              >
                <XCircle className="w-3.5 h-3.5" />
                {isSubmittingCancel ? 'Cancelling...' : 'Confirm Order Cancellation'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
