'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Building, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProductionCompany {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ProductionCompaniesPage() {
  const [companies, setCompanies] = useState<ProductionCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ProductionCompany | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('production_companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching production companies:', error);
    } finally {
      setLoading(false);
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      notes: '',
    });
    setEditingCompany(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (company: ProductionCompany) => {
    setFormData({
      name: company.name,
      contact_person: company.contact_person || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      website: company.website || '',
      notes: company.notes || '',
    });
    setEditingCompany(company);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('production_companies')
          .update(formData)
          .eq('id', editingCompany.id);

        if (error) throw error;
        showSuccess('Production company updated successfully');
      } else {
        // Create new company
        const { error } = await supabase
          .from('production_companies')
          .insert([formData]);

        if (error) throw error;
        showSuccess('Production company created successfully');
      }

      setShowAddModal(false);
      resetForm();
      fetchCompanies();
    } catch (error: any) {
      alert('Error saving production company: ' + error.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all associated documents.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('production_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Production company deleted successfully');
      fetchCompanies();
    } catch (error: any) {
      alert('Error deleting production company: ' + error.message);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('production_companies')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showSuccess(`Production company ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchCompanies();
    } catch (error: any) {
      alert('Error updating status: ' + error.message);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.name?.toLowerCase().includes(searchLower) ||
      company.contact_person?.toLowerCase().includes(searchLower) ||
      company.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Production Companies</h1>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#e11921] hover:bg-[#bf151c]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600">Loading production companies...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Company Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact Person</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {company.contact_person || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {company.email || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {company.phone || '-'}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleActive(company.id, company.is_active)}
                          className={`px-2 py-1 text-xs rounded ${
                            company.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {company.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/production-companies/${company.id}`}
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            title="View Documents"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(company)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(company.id, company.name)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCompanies.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-lg font-medium">No production companies found</p>
                <p className="text-sm mt-2">Add a new company to get started</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingCompany ? 'Edit Production Company' : 'Add Production Company'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Paramount Pictures"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Person</label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <Input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, Los Angeles, CA 90001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Additional notes about this production company..."
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#e11921] hover:bg-[#bf151c]"
                  >
                    {editingCompany ? 'Update Company' : 'Create Company'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
