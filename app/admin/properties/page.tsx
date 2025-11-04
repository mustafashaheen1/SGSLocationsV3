'use client';

import { useState } from 'react';
import { Search, Check, X, Edit, Trash2 } from 'lucide-react';

interface Property {
  id: number;
  name: string;
  owner: string;
  status: 'active' | 'pending' | 'inactive';
  created: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([
    { id: 1, name: 'Modern Loft Studio', owner: 'John Smith', status: 'active', created: '2024-01-15' },
    { id: 2, name: 'Downtown Office Space', owner: 'Sarah Johnson', status: 'pending', created: '2024-01-20' },
    { id: 3, name: 'Warehouse Studio', owner: 'Mike Davis', status: 'active', created: '2024-01-22' },
    { id: 4, name: 'Rooftop Event Space', owner: 'Emily Chen', status: 'active', created: '2024-01-25' },
    { id: 5, name: 'Vintage Theater', owner: 'David Wilson', status: 'pending', created: '2024-01-28' },
    { id: 6, name: 'Industrial Warehouse', owner: 'Lisa Brown', status: 'inactive', created: '2024-02-01' },
    { id: 7, name: 'Contemporary Gallery', owner: 'James Taylor', status: 'active', created: '2024-02-05' },
    { id: 8, name: 'Outdoor Garden Venue', owner: 'Maria Garcia', status: 'pending', created: '2024-02-08' },
    { id: 9, name: 'Historic Mansion', owner: 'Robert Martinez', status: 'active', created: '2024-02-10' },
    { id: 10, name: 'Beach House Studio', owner: 'Jennifer Lee', status: 'active', created: '2024-02-12' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleApprove = (id: number) => {
    setLoading(true);
    setTimeout(() => {
      setProperties(properties.map(p =>
        p.id === id ? { ...p, status: 'active' as const } : p
      ));
      setLoading(false);
      showSuccess('Property approved successfully');
    }, 500);
  };

  const handleReject = (id: number) => {
    setLoading(true);
    setTimeout(() => {
      setProperties(properties.map(p =>
        p.id === id ? { ...p, status: 'inactive' as const } : p
      ));
      setLoading(false);
      showSuccess('Property rejected');
    }, 500);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this property?')) {
      setLoading(true);
      setTimeout(() => {
        setProperties(properties.filter(p => p.id !== id));
        setLoading(false);
        showSuccess('Property deleted successfully');
      }, 500);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search properties or owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Property Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr key={property.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-900">{property.name}</td>
                  <td className="py-4 px-4 text-gray-600">{property.owner}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(property.status)}`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{property.created}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      {property.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(property.id)}
                            disabled={loading}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(property.id)}
                            disabled={loading}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button
                        disabled={loading}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        disabled={loading}
                        className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
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

        {filteredProperties.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No properties found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
