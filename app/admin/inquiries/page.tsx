'use client';

import { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { Inquiry, supabase } from '@/lib/supabase';
import InquiryDetailModal from '@/components/admin/InquiryDetailModal';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    setLoading(true);
    try {
      // Get session to include access token
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/inquiries', {
        credentials: 'include',
        headers
      });
      const data = await response.json();
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(inquiryId: string, newStatus: string) {
    try {
      // Get session to include access token
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchInquiries();
        setSelectedInquiry(null);
        setSuccessMessage('Inquiry status updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    }
  }

  const filteredInquiries = inquiries.filter(inquiry => {
    const fullName = `${inquiry.first_name || inquiry.user_name || ''} ${inquiry.last_name || ''}`.trim();
    const propertyName = inquiry.properties?.name || 'General Inquiry';

    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            <p className="mt-2 text-gray-600">Loading inquiries...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <option value="new">New</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">From</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => {
                const fullName = `${inquiry.first_name || inquiry.user_name || ''} ${inquiry.last_name || ''}`.trim();
                const propertyName = inquiry.properties?.name || 'General Inquiry';
                const propertyImage = inquiry.properties?.primary_image;
                const propertyCity = inquiry.properties?.city || '';

                return (
                  <tr key={inquiry.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{fullName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{inquiry.user_email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {propertyImage && (
                          <img
                            src={propertyImage}
                            alt={propertyName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{propertyName}</div>
                          {propertyCity && <div className="text-sm text-gray-500">{propertyCity}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(inquiry.status)}`}>
                        {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {filteredInquiries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {loading ? 'Loading inquiries...' : 'No inquiries found matching your criteria'}
          </div>
        )}
      </div>

      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusUpdate={handleStatusUpdate}
          canUpdateStatus={true}
        />
      )}
    </div>
  );
}
