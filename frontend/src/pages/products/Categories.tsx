import React, { useEffect, useState } from 'react';
import { categoriesAPI } from '../../services/api';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

const Categories: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setIsActive(true);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await categoriesAPI.getAll({ per_page: 100 });
      if (res.success) setCategories((res.data.data || res.data) as Category[]);
      else setError(res.message || 'Failed to load categories');
    } catch (e: any) {
      setError(e.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { resetForm(); setIsOpen(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description || '');
    setIsActive(c.is_active);
    setIsOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editing) {
        const res = await categoriesAPI.update(editing.id, { name, description, is_active: isActive });
        if (!res.success) throw new Error(res.message || 'Update failed');
      } else {
        const res = await categoriesAPI.create({ name, description, is_active: isActive });
        if (!res.success) throw new Error(res.message || 'Create failed');
      }
      setIsOpen(false);
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      const res = await categoriesAPI.delete(c.id);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      await load();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button onClick={openCreate} className="btn-primary">Add Category</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-6 py-4" colSpan={3}>Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-6 py-4 text-danger-600" colSpan={3}>{error}</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-gray-500" colSpan={3}>No categories found</td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${c.is_active ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(c)} className="btn-secondary mr-2">Edit</button>
                      <button onClick={() => onDelete(c)} className="btn-danger">Delete</button>
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
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit category' : 'Add category'}</h2>
              <button onClick={() => setIsOpen(false)} className="btn-secondary">Close</button>
            </div>

            {error && <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-3">{error}</div>}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Description</label>
                <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input id="is_active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>
              <div className="flex justify-end gap-3">
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

export default Categories;
