import React, { useEffect, useMemo, useState } from 'react';
import { productsAPI, ordersAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  selling_price: number;
  barcode?: string;
  sku?: string;
}

interface CartItem { product: Product; qty: number; }

const POS: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  const [cart, setCart] = useState<Record<number, CartItem>>({});

  const subtotal = useMemo(() => Object.values(cart).reduce((s, i) => s + i.product.selling_price * i.qty, 0), [cart]);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await productsAPI.search(q);
      if (res.success) setResults((res.data as any) as Product[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(() => search(query), 300); return () => clearTimeout(t); }, [query]);

  const addToCart = (p: Product) => setCart(prev => ({ ...prev, [p.id]: { product: p, qty: (prev[p.id]?.qty || 0) + 1 } }));
  const inc = (id: number) => setCart(prev => ({ ...prev, [id]: { ...prev[id], qty: prev[id].qty + 1 } }));
  const dec = (id: number) => setCart(prev => { const item = prev[id]; if (!item) return prev; const qty = Math.max(1, item.qty - 1); return { ...prev, [id]: { ...item, qty } }; });
  const removeItem = (id: number) => setCart(prev => { const cp = { ...prev }; delete cp[id]; return cp; });
  const empty = () => setCart({});

  const checkout = async () => {
    if (Object.keys(cart).length === 0) return;
    setCheckingOut(true);
    try {
      const payload = {
        items: Object.values(cart).map(i => ({ product_id: i.product.id, qty: i.qty, price: i.product.selling_price })),
        paid_amount: subtotal, // cash only
      };
      const res = await ordersAPI.create(payload);
      if (res.success) {
        empty();
        navigate(`/orders/${res.data.order_id}`); // auto-open invoice
      } else {
        alert(res.message || 'Checkout failed');
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-7 space-y-3">
        <div className="card p-4">
          <input className="input" placeholder="Search products by name / barcode" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">Search results</h3>
          {loading ? 'Searching…' : results.length === 0 ? (
            <div className="text-gray-500">No products</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map(p => (
                <div key={p.id} className="border rounded-lg p-3 hover:shadow-soft">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.sku || p.barcode || ''}</div>
                  <div className="mt-1 text-primary-700 font-semibold">{p.selling_price}</div>
                  <button className="btn-primary mt-2" onClick={() => addToCart(p)}>Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Cart</h3>
            <button onClick={empty} className="btn-secondary">Empty</button>
          </div>

          {Object.keys(cart).length === 0 ? (
            <div className="text-gray-500">Cart is empty</div>
          ) : (
            <div className="space-y-3">
              {Object.values(cart).map(({ product, qty }) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.selling_price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary" onClick={() => dec(product.id)}>-</button>
                    <div className="w-10 text-center">{qty}</div>
                    <button className="btn-secondary" onClick={() => inc(product.id)}>+</button>
                    <button className="btn-danger ml-2" onClick={() => removeItem(product.id)}>Remove</button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex items-center justify-between">
                <div className="font-semibold">Subtotal</div>
                <div className="font-semibold">{subtotal.toFixed(2)}</div>
              </div>
              <button className="btn-primary w-full" onClick={checkout} disabled={checkingOut}>{checkingOut ? 'Processing...' : 'Checkout'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
