import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="card p-5">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="mt-2 text-2xl font-semibold">{value}</div>
  </div>
);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await dashboardAPI.getOverview();
        if (res.success) setData(res.data);
        else setError(res.message || 'Failed to load data');
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="card p-6">Loading dashboard...</div>;
  if (error) return <div className="card p-6 text-danger-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today Sales" value={data?.today_sales ?? 0} />
        <StatCard label="Monthly Sales" value={data?.monthly_sales ?? 0} />
        <StatCard label="Total Orders" value={data?.total_orders ?? 0} />
        <StatCard label="Total Customers" value={data?.total_customers ?? 0} />
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold">Low Stock</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.low_stock_products > 0 ? (
            <div className="text-gray-600">{data.low_stock_products} products low on stock</div>
          ) : (
            <div className="text-gray-500">No low-stock products</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
