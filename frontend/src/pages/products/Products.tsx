import React, { useEffect, useMemo, useState } from 'react';
import { productsAPI, categoriesAPI, brandsAPI, unitsAPI } from '../../services/api';

interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  selling_price: number;
  stock_quantity: number;
  category_id?: number;
  brand_id?: number;
  unit_id?: number;
}

interface Option { id: number; name: string }

const Products: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '', sku: '', barcode: '',
    category_id: '', brand_id: '', unit_id: '',
    cost_price: '', selling_price: '', low_stock_alert: '10', stock_quantity: '',
    image: null as File | null,
  });

  const resetForm = () => {
    setForm({ name: '', sku: '', barcode: '', category_id: '', brand_id: '', unit_id: '', cost_price: '', selling_price: '', low_stock_alert: '10', stock_quantity: '', image: null });
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setIsOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      category_id: String(p.category_id ?? ''),
      brand_id: String(p.brand_id ?? ''),
      unit_id: String(p.unit_id ?? ''),
      cost_price: '',
      selling_price: String(p.selling_price ?? ''),
      low_stock_alert: '10',
      stock_quantity: String(p.stock_quantity ?? ''),
      image: null,
    });
    setIsOpen(true);
  };

  const loadLists = async () => {
    const [catRes, brandRes, unitRes] = await Promise.all([
      categoriesAPI.getAll({ per_page: 100 }),
      brandsAPI.getAll(),
      unitsAPI.getAll(),
    ]);
    if (catRes.success) setCategories(((catRes.data as any).data || (catRes.data as any)) as Option[]);
    if (brandRes.success) setBrands(((brandRes.data as any).data || (brandRes.data as any)) as Option[]);
    if (unitRes.success) setUnits(((unitRes.data as any).data || (unitRes.data as any)) as Option[]);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ per_page: 50 });
      if (res.success) setProducts(res.data.data as Product[]);
      else setError(res.message || 'Failed to load products');
    } catch (e: any) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadLists();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files && files[0]) setForm(prev => ({ ...prev, [name]: files[0] }));
    else setForm(prev => ({ ...prev, [name]: value }));
  };

  const pickErrorMessage = (err: any): string => {
    if (err?.response?.data?.message) return err.response.data.message;
    if (typeof err?.message === 'string') return err.message;
    return 'Request failed';
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.sku) fd.append('sku', form.sku);
      if (form.barcode) fd.append('barcode', form.barcode);
      if (form.category_id) fd.append('category_id', form.category_id);
      if (form.brand_id) fd.append('brand_id', form.brand_id);
      if (form.unit_id) fd.append('unit_id', form.unit_id);
      if (form.cost_price) fd.append('cost_price', form.cost_price);
      if (form.selling_price) fd.append('selling_price', form.selling_price);
      if (form.low_stock_alert) fd.append('low_stock_alert', form.low_stock_alert);
      if (form.stock_quantity) fd.append('stock_quantity', form.stock_quantity);
      if (form.image) fd.append('image', form.image);

      const res = editing
        ? await productsAPI.update(editing.id, fd)
        : await productsAPI.create(fd);

      if (!res.success) throw new Error(res.message || 'Save failed');

      setIsOpen(false);
      resetForm();
      await load();
    } catch (err: any) {
      setError(pickErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p: Product) => {
    if (!confirm(`Delete product "${p.name}"?`)) return;
    try {
      const res = await productsAPI.delete(p.id);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      await load();
    } catch (err: any) {
      alert(pickErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button onClick={openCreate} className="btn-primary">Add Product</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-6 py-4" colSpan={5}>Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-6 py-4 text-danger-600" colSpan={5}>{error}</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-gray-500" colSpan={5}>No products found</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">{p.name}</td>
                    <td className="px-6 py-4">{p.sku ?? '-'}</td>
                    <td className="px-6 py-4">{p.selling_price}</td>
                    <td className="px-6 py-4">{p.stock_quantity}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(p)} className="btn-secondary mr-2">Edit</button>
                      <button onClick={() => onDelete(p)} className="btn-danger">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="card w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit product' : 'Add product'}</h2>
              <button onClick={() => setIsOpen(false)} className="btn-secondary">Close</button>
            </div>

            {error && <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-3">{error}</div>}

            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="form-label">Name</label>
                <input name="name" value={form.name} onChange={onChange} className="input" required />
              </div>

              <div>
                <label className="form-label">SKU</label>
                <input name="sku" value={form.sku} onChange={onChange} className="input" />
              </div>

              <div>
                <label className="form-label">Barcode</label>
                <input name="barcode" value={form.barcode} onChange={onChange} className="input" />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select name="category_id" value={form.category_id} onChange={onChange} className="input" required>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Brand</label>
                <select name="brand_id" value={form.brand_id} onChange={onChange} className="input">
                  <option value="">Select...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Unit</label>
                <select name="unit_id" value={form.unit_id} onChange={onChange} className="input" required>
                  <option value="">Select...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Cost price</label>
                <input name="cost_price" value={form.cost_price} onChange={onChange} type="number" step="0.01" className="input" required />
              </div>

              <div>
                <label className="form-label">Selling price</label>
                <input name="selling_price" value={form.selling_price} onChange={onChange} type="number" step="0.01" className="input" required />
              </div>

              <div>
                <label className="form-label">Low stock alert</label>
                <input name="low_stock_alert" value={form.low_stock_alert} onChange={onChange} type="number" className="input" required />
              </div>

              <div>
                <label className="form-label">Stock qty</label>
                <input name="stock_quantity" value={form.stock_quantity} onChange={onChange} type="number" className="input" required />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Image</label>
                <input name="image" onChange={onChange} type="file" accept="image/*" className="input" />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
