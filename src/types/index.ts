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
  supplier_lot_number?: string;
  receipt_date: string;
  received_quantity_kg: number;
  remaining_quantity_kg: number;
  status: 'available' | 'depleted' | 'quarantined' | 'expired';
  materials?: {
    code: string;
    name: string;
  };
  suppliers?: {
    name: string;
  };
}

export interface ProductRecipeItem {
  id: string;
  material_id: string;
  percentage: number;
  planned_kg_per_kg_output: number;
  materials?: {
    code: string;
    name: string;
  };
}

export interface ProductRecipe {
  id: string;
  version: number;
  is_active: boolean;
  notes?: string;
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
  waste_kg: number;
  rejected_kg: number;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  operator_id?: string;
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

