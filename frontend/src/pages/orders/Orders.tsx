import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const Orders: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.list({ per_page: 20 });
      if (res.success) setOrders((res.data.data || res.data) as any[]);
      else setError(res.message || 'Failed to load orders');
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td className="px-6 py-4" colSpan={3}>Loading...</td></tr>
              ) : error ? (
                <tr><td className="px-6 py-4 text-danger-600" colSpan={3}>{error}</td></tr>
              ) : orders.length === 0 ? (
                <tr><td className="px-6 py-4 text-gray-500" colSpan={3}>No orders</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-6 py-4">{o.order_number}</td>
                    <td className="px-6 py-4">{o.total_amount}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/orders/${o.id}`} className="btn-secondary">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
