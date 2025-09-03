import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersAPI } from '../../services/api';

const OrderDetails: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await ordersAPI.getById(Number(id));
        if (res.success) setOrder(res.data);
        else setError(res.message || 'Failed to load order');
      } catch (e: any) {
        setError(e.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="card p-4">Loading...</div>;
  if (error) return <div className="card p-4 text-danger-600">{error}</div>;
  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order {order.order_number}</h1>
        <button className="btn-primary" onClick={() => window.print()}>Print</button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Customer</div>
            <div className="font-medium">{order.customer?.name || 'Walk-in'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total</div>
            <div className="font-medium">{order.total_amount}</div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.order_products?.map((i: any) => (
                <tr key={i.id}>
                  <td className="px-6 py-2">{i.product?.name || i.product_id}</td>
                  <td className="px-6 py-2">{i.quantity}</td>
                  <td className="px-6 py-2">{i.unit_price}</td>
                  <td className="px-6 py-2">{i.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
