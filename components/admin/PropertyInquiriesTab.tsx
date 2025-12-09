'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import InquiryDetailModal from './InquiryDetailModal';
import { Inquiry } from '@/lib/supabase';

interface PropertyInquiriesTabProps {
  propertyId: string;
}

export default function PropertyInquiriesTab({ propertyId }: PropertyInquiriesTabProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchInquiries();
  }, [propertyId]);

  async function fetchInquiries() {
    setLoading(true);
    try {
      const response = await fetch(`/api/inquiries?property_id=${propertyId}`);
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
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchInquiries();
        setSelectedInquiry(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  const filteredInquiries = inquiries.filter(inquiry => {
    if (statusFilter === 'all') return true;
    return inquiry.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="mt-2 text-gray-600">Loading inquiries...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Property Inquiries ({filteredInquiries.length})
        </h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e11921] focus:border-[#e11921] outline-none"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="responded">Responded</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredInquiries.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          {statusFilter === 'all'
            ? 'No inquiries found for this property'
            : `No ${statusFilter} inquiries found for this property`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">From</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {inquiry.first_name || inquiry.user_name} {inquiry.last_name || ''}
                      </div>
                      <div className="text-sm text-gray-500">{inquiry.user_email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {inquiry.company || 'N/A'}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

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
