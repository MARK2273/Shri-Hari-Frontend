export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'platform_admin' | 'factory_admin' | 'supervisor' | 'operator' | 'dispatch_manager';
  tenant_id: string;
  tenant_name?: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  description?: string;
  standard_unit: string;
  min_stock_level_kg: number;
  total_stock_kg?: number;
  is_low_stock?: boolean;
}

export interface MaterialBatch {
  id: string;
  batch_number: string;
  material_id: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_lot_number?: string;
  receipt_date: string;
  received_quantity_kg: number;
  remaining_quantity_kg: number;
  cost_per_kg?: number;
  status: 'available' | 'depleted' | 'quarantined' | 'expired';
  materials?: {
    code: string;
    name: string;
  };
  suppliers?: {
    name: string;
  };
}

export interface Supplier {
  id: string;
  tenant_id?: string;
  code?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductRecipeItem {
  id: string;
  material_id: string;
  plate_type?: 'A' | 'B' | 'C' | string;
  plate_a_kg?: number;
  plate_b_kg?: number;
  plate_c_kg?: number;
  quantity_kg?: number;
  percentage: number;
  planned_kg_per_kg_output: number;
  materials?: {
    code: string;
    name: string;
    cost_per_kg?: number;
  };
}

export interface ProductRecipe {
  id: string;
  version: number;
  is_active: boolean;
  notes?: string;
  plate_summary?: Record<string, { total_kg: number; percentage: number; count: number }>;
  product_recipe_items: ProductRecipeItem[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  standard_weight_kg?: number;
  active_recipe?: ProductRecipe;
}

export interface CustomerOrderItem {
  id: string;
  product_id: string;
  requested_quantity_kg: number;
  produced_quantity_kg: number;
  dispatched_quantity_kg: number;
  status: string;
  products?: Product;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  required_delivery_date: string;
  status: 'draft' | 'confirmed' | 'in_production' | 'partially_produced' | 'produced' | 'partially_dispatched' | 'completed' | 'cancelled';
  total_requested_weight_kg: number;
  customers?: {
    name: string;
    contact_person?: string;
    phone?: string;
    delivery_address?: string;
  };
  customer_order_items?: CustomerOrderItem[];
}

export interface ProductionBatch {
  id: string;
  batch_number: string;
  order_id: string;
  product_id: string;
  recipe_id: string;
  planned_quantity_kg: number;
  actual_input_kg: number;
  accepted_output_kg: number;
  trim_waste_kg?: number;
  plant_waste_kg?: number;
  waste_kg: number;
  rejected_kg: number;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  operator_id?: string;
  operator_name?: string;
  supervisor_id?: string;
  start_time?: string;
  completion_time?: string;
  customer_orders?: {
    order_number: string;
    customers?: { name: string };
  };
  products?: {
    code: string;
    name: string;
  };
  production_material_consumption?: Array<{
    id: string;
    material_id: string;
    material_batch_id: string;
    planned_quantity_kg: number;
    actual_quantity_kg: number;
    materials?: { name: string; code: string };
    material_batches?: { batch_number: string };
  }>;
}

export interface FinishedGoodsBatch {
  id: string;
  batch_number: string;
  product_id: string;
  production_batch_id: string;
  quantity_produced_kg: number;
  quantity_on_hand_kg: number;
  quantity_reserved_kg: number;
  quantity_dispatched_kg: number;
  status: string;
  products?: {
    code: string;
    name: string;
  };
}

export interface Delivery {
  id: string;
  delivery_number: string;
  order_id: string;
  dispatch_date: string;
  destination_address: string;
  vehicle_number?: string;
  status: string;
  customers?: {
    name: string;
    phone?: string;
  };
  customer_orders?: {
    order_number: string;
  };
  delivery_items?: Array<{
    id: string;
    quantity_kg: number;
    products?: { name: string; code: string };
  }>;
}

export interface SizeMicron {
  id: string;
  tenant_id?: string;
  label: string;
  size?: string;
  micron: number;
  unit: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface JobWorker {
  id: string;
  tenant_id?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at?: string;
}

export interface JobWorkOutward {
  id: string;
  challan_number: string;
  vendor_id: string;
  vendor_name: string;
  material_id: string;
  material_name: string;
  source_batch_id?: string;
  source_batch_number?: string;
  quantity_kg: number;
  dispatch_date: string;
  vehicle_number?: string;
  notes?: string;
  created_at: string;
}

export interface JobWorkOrder {
  id: string;
  order_number: string;
  vendor_id: string;
  vendor_name: string;
  product_id: string;
  product_name: string;
  recipe_id?: string;
  recipe_name?: string;
  target_size?: string;
  target_micron?: number;
  planned_quantity_kg: number;
  received_quantity_kg: number;
  scrap_quantity_kg: number;
  customer_id?: string;
  customer_name?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  expected_delivery_date?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface JobWorkReceipt {
  id: string;
  receipt_number: string;
  job_work_order_id: string;
  job_work_order_number: string;
  vendor_id: string;
  vendor_name: string;
  product_id: string;
  product_name: string;
  accepted_quantity_kg: number;
  scrap_quantity_kg: number;
  delivery_destination: 'factory_stock' | 'direct_customer';
  customer_id?: string;
  customer_name?: string;
  vehicle_number?: string;
  delivery_date: string;
  notes?: string;
  materials_consumed?: Array<{
    material_id: string;
    material_name: string;
    consumed_kg: number;
  }>;
  fg_batch_id?: string;
  delivery_id?: string;
  created_at: string;
}

export interface VendorMaterialBalance {
  material_id: string;
  material_name: string;
  sent_kg: number;
  consumed_kg: number;
  balance_kg: number;
}

export interface VendorStockSummary {
  vendor_id: string;
  vendor_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  total_balance_kg: number;
  materials: VendorMaterialBalance[];
}

export interface ScrapEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  entry_date: string;
  source_type: string;
  production_batch_id?: string;
  product_id?: string;
  scrap_type: string;
  quantity_kg: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  production_batches?: {
    id: string;
    batch_number: string;
    status: string;
  };
  products?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ScrapSale {
  id: string;
  tenant_id: string;
  sale_number: string;
  sale_date: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_address?: string;
  scrap_type: string;
  quantity_kg: number;
  rate_per_kg: number;
  total_amount: number;
  payment_mode: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'pending';
  payment_status: 'received' | 'pending' | 'partial';
  vehicle_number?: string;
  driver_name?: string;
  gate_pass_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface ScrapSummary {
  total_generated_kg: number;
  total_sold_kg: number;
  on_floor_scrap_kg: number;
  total_sales_revenue: number;
  average_rate_per_kg: number;
  entries_count: number;
  sales_count: number;
  scrap_by_type: Record<string, number>;
  recent_entries: ScrapEntry[];
  recent_sales: ScrapSale[];
}

