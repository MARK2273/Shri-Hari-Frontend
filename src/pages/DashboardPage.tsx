import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Layers,
  PackageCheck,
  Factory,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PageSkeleton } from '../components/common/Skeleton';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { AlertBanner } from '../components/common/AlertBanner';
import { Card } from '../components/common/Card';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [productionRuns, setProductionRuns] = useState<any[]>([]);
  const [fgInventory, setFgInventory] = useState<any>({ summary: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [matRes, ordRes, prodRes, fgRes] = await Promise.all([
          api.get('/materials'),
          api.get('/orders'),
          api.get('/production'),
          api.get('/finished-goods'),
        ]);

        setMaterials(matRes.data.materials || []);
        setOrders(ordRes.data.orders || []);
        setProductionRuns(prodRes.data.batches || []);
        setFgInventory(fgRes.data || { summary: [] });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalRawStockKg = materials.reduce((acc, m) => acc + (Number(m.total_stock_kg) || 0), 0);
  const lowStockMaterials = materials.filter((m) => m.is_low_stock);
  const totalFinishedGoodsKg = (fgInventory.summary || []).reduce(
    (acc: number, item: any) => acc + (Number(item.total_on_hand_kg) || 0),
    0
  );
  const openOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const pendingOrdersKg = openOrders.reduce(
    (acc, o) => acc + (Number(o.total_requested_weight_kg) || 0),
    0
  );
  const inProgressRuns = productionRuns.filter((r) => r.status === 'in_progress' || r.status === 'draft');

  if (isLoading) {
    return <PageSkeleton type="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <PageHeader
        title="Factory Overview"
        subtitle="A clear overview of your factory's current operations."
        actions={
          <>
            <Link to="/materials">
              <Button variant="secondary" size="md" icon={Plus}>
                Receive Stock
              </Button>
            </Link>
            <Link to="/production">
              <Button variant="primary" size="md" icon={Plus}>
                Create Production Run
              </Button>
            </Link>
          </>
        }
      />

      {/* Important Operational Alerts */}
      <div className="space-y-3">
        {lowStockMaterials.length > 0 && (
          <AlertBanner
            variant="warning"
            title={`Low Raw Material Stock (${lowStockMaterials.length} materials below minimum level)`}
            description={
              <div className="flex flex-wrap gap-2 mt-1.5">
                {lowStockMaterials.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#1E2923] border border-[#F6DCAD] dark:border-[#4E381A] text-xs font-medium text-[#975E10] dark:text-[#F3BA59]"
                  >
                    <span>{m.name}:</span>
                    <strong className="font-mono text-[#202B26] dark:text-white">
                      {(Number(m.total_stock_kg) || 0).toLocaleString()} kg
                    </strong>
                    <span className="text-[11px] opacity-75">(Min: {m.min_stock_level_kg} kg)</span>
                  </span>
                ))}
              </div>
            }
            action={
              <Link
                to="/materials"
                className="text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] hover:underline whitespace-nowrap"
              >
                Receive Stock &rarr;
              </Link>
            }
          />
        )}

        {openOrders.length > 0 && inProgressRuns.length === 0 && (
          <AlertBanner
            variant="info"
            title={`${openOrders.length} customer order(s) waiting to be scheduled for production`}
            description="There are currently no active production runs on the floor while customer orders are pending."
            action={
              <Link
                to="/production"
                className="text-xs font-semibold text-[#245D87] dark:text-[#78B6E4] hover:underline whitespace-nowrap"
              >
                Start Production &rarr;
              </Link>
            }
          />
        )}
      </div>

      {/* Key Factory Figures (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Raw Material Stock"
          value={totalRawStockKg.toLocaleString()}
          unit="kg"
          subtitle={`${materials.length} material categories stored`}
          icon={Layers}
          tone={lowStockMaterials.length > 0 ? 'warning' : 'default'}
          action={
            <Link to="/materials" className="text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] hover:underline">
              View Materials
            </Link>
          }
        />

        <StatCard
          label="Finished Goods Stock"
          value={totalFinishedGoodsKg.toLocaleString()}
          unit="kg"
          subtitle="Ready for customer dispatch"
          icon={PackageCheck}
          tone="default"
          action={
            <Link to="/finished-goods" className="text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] hover:underline">
              View Stock
            </Link>
          }
        />

        <StatCard
          label="Pending Customer Orders"
          value={pendingOrdersKg.toLocaleString()}
          unit="kg"
          subtitle={`${openOrders.length} orders waiting to be completed`}
          icon={Clock}
          tone={openOrders.length > 0 ? 'info' : 'default'}
          action={
            <Link to="/orders" className="text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] hover:underline">
              View Orders
            </Link>
          }
        />

        <StatCard
          label="Active Production Batches"
          value={inProgressRuns.length > 0 ? inProgressRuns.length : productionRuns.length}
          unit={inProgressRuns.length > 0 ? 'in progress' : 'total batches'}
          subtitle={inProgressRuns.length > 0 ? 'Currently on shop floor' : 'Production runs completed'}
          icon={Factory}
          tone={inProgressRuns.length > 0 ? 'success' : 'default'}
          action={
            <Link to="/production" className="text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] hover:underline">
              View Batches
            </Link>
          }
        />
      </div>

      {/* Recent Operations Tables Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Production Runs */}
        <Card
          title="Recent Production Runs"
          subtitle="Latest manufacturing batches executed on factory machines"
          noPadding
          actions={
            <Link
              to="/production"
              className="text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[460px]">
              <thead className="bg-[#FAFBF9] dark:bg-[#151D19] border-b border-[#E5EAE6] dark:border-[#26332C] text-[#68746D] dark:text-[#9DAAA2] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Good Output</th>
                  <th className="px-4 py-3 text-right">Waste</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAE6] dark:divide-[#26332C]">
                {productionRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#68746D] dark:text-[#9DAAA2]">
                      No production batches recorded yet.
                    </td>
                  </tr>
                ) : (
                  productionRuns.slice(0, 5).map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-[#F6F7F5] dark:hover:bg-[#1E2923] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#202B26] dark:text-[#EAEFEA] whitespace-nowrap">
                        {run.created_at
                          ? new Date(run.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#202B26] dark:text-[#EAEFEA] font-medium max-w-[160px] truncate">
                        {run.products?.name || run.product_name || 'Packaging Film'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[#21865B]">
                        {Number(run.accepted_output_kg || 0).toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[#D84C4C]">
                        {Number(run.waste_kg || 0).toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            run.status === 'completed'
                              ? 'success'
                              : run.status === 'in_progress'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {run.status === 'completed'
                            ? 'Completed'
                            : run.status === 'in_progress'
                            ? 'In Progress'
                            : run.status === 'draft'
                            ? 'Draft'
                            : run.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Customer Orders */}
        <Card
          title="Recent Customer Orders"
          subtitle="Orders received and current production status"
          noPadding
          actions={
            <Link
              to="/orders"
              className="text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[420px]">
              <thead className="bg-[#FAFBF9] dark:bg-[#151D19] border-b border-[#E5EAE6] dark:border-[#26332C] text-[#68746D] dark:text-[#9DAAA2] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Order No</th>
                  <th className="px-4 py-3 text-right">Requested</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAE6] dark:divide-[#26332C]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#68746D] dark:text-[#9DAAA2]">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F6F7F5] dark:hover:bg-[#1E2923] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#202B26] dark:text-[#EAEFEA] max-w-[150px] truncate">
                        {order.customers?.name || order.customer_name || 'Customer'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#68746D] dark:text-[#9DAAA2]">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[#202B26] dark:text-[#EAEFEA]">
                        {Number(order.total_requested_weight_kg || 0).toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            order.status === 'completed'
                              ? 'success'
                              : order.status === 'in_production'
                              ? 'warning'
                              : order.status === 'dispatched'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {order.status === 'in_production'
                            ? 'In Production'
                            : order.status === 'completed'
                            ? 'Completed'
                            : order.status === 'confirmed'
                            ? 'Confirmed'
                            : order.status === 'draft'
                            ? 'Draft'
                            : order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Quick Access to Key Factory Workflows */}
      <Card title="Quick Factory Actions" subtitle="Direct shortcuts to common daily shop-floor tasks">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/materials"
            className="p-3.5 rounded-lg border border-[#E5EAE6] dark:border-[#26332C] hover:border-[#176B52] dark:hover:border-[#80C6A5] bg-[#FAFBF9] dark:bg-[#151D19] transition-all group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-md bg-[#EAF4EF] dark:bg-[#152B22] text-[#176B52] dark:text-[#80C6A5] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#202B26] dark:text-[#EAEFEA] group-hover:text-[#176B52] dark:group-hover:text-[#80C6A5]">
                Receive Raw Stock
              </h4>
              <p className="text-[11px] text-[#68746D] dark:text-[#9DAAA2] mt-0.5">
                Log polymer granules & additives
              </p>
            </div>
          </Link>

          <Link
            to="/orders"
            className="p-3.5 rounded-lg border border-[#E5EAE6] dark:border-[#26332C] hover:border-[#176B52] dark:hover:border-[#80C6A5] bg-[#FAFBF9] dark:bg-[#151D19] transition-all group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-md bg-[#EAF4EF] dark:bg-[#152B22] text-[#176B52] dark:text-[#80C6A5] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#202B26] dark:text-[#EAEFEA] group-hover:text-[#176B52] dark:group-hover:text-[#80C6A5]">
                New Customer Order
              </h4>
              <p className="text-[11px] text-[#68746D] dark:text-[#9DAAA2] mt-0.5">
                Book client demands & specs
              </p>
            </div>
          </Link>

          <Link
            to="/production"
            className="p-3.5 rounded-lg border border-[#E5EAE6] dark:border-[#26332C] hover:border-[#176B52] dark:hover:border-[#80C6A5] bg-[#FAFBF9] dark:bg-[#151D19] transition-all group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-md bg-[#EAF4EF] dark:bg-[#152B22] text-[#176B52] dark:text-[#80C6A5] flex items-center justify-center shrink-0">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#202B26] dark:text-[#EAEFEA] group-hover:text-[#176B52] dark:group-hover:text-[#80C6A5]">
                Start Production
              </h4>
              <p className="text-[11px] text-[#68746D] dark:text-[#9DAAA2] mt-0.5">
                Execute extrusion & slitting
              </p>
            </div>
          </Link>

          <Link
            to="/dispatch"
            className="p-3.5 rounded-lg border border-[#E5EAE6] dark:border-[#26332C] hover:border-[#176B52] dark:hover:border-[#80C6A5] bg-[#FAFBF9] dark:bg-[#151D19] transition-all group flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-md bg-[#EAF4EF] dark:bg-[#152B22] text-[#176B52] dark:text-[#80C6A5] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#202B26] dark:text-[#EAEFEA] group-hover:text-[#176B52] dark:group-hover:text-[#80C6A5]">
                Dispatch & Delivery
              </h4>
              <p className="text-[11px] text-[#68746D] dark:text-[#9DAAA2] mt-0.5">
                Record vehicle delivery challan
              </p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
};
